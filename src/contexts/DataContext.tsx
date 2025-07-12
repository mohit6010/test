import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Question, Answer, Notification, Vote } from '../types';
import { useAuth } from './AuthContext';
import { generateAIAnswer } from '../lib/gemini';

interface DataContextType {
  questions: Question[];
  notifications: Notification[];
  votes: Vote[];
  isLoading: boolean;
  addQuestion: (question: Omit<Question, 'id' | 'createdAt' | 'updatedAt' | 'votes' | 'views' | 'answers' | 'author'>) => Promise<void>;
  addAnswer: (answer: Omit<Answer, 'id' | 'createdAt' | 'updatedAt' | 'votes' | 'isAccepted' | 'author'>) => Promise<void>;
  addAIAnswer: (questionId: string, questionTitle: string, questionDescription: string) => Promise<void>;
  voteOnQuestion: (questionId: string, value: 1 | -1) => Promise<void>;
  voteOnAnswer: (answerId: string, value: 1 | -1) => Promise<void>;
  acceptAnswer: (questionId: string, answerId: string) => Promise<void>;
  markNotificationRead: (notificationId: string) => void;
  getUnreadNotificationCount: () => number;
  refreshQuestions: () => Promise<void>;
  incrementQuestionViews: (questionId: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, updateUserStats } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    refreshQuestions();
    if (user) {
      fetchUserVotes();
    }
  }, [user]);

  const fetchUserVotes = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('votes')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      const userVotes: Vote[] = data.map(vote => ({
        id: vote.id,
        userId: vote.user_id,
        targetId: vote.target_id,
        targetType: vote.target_type as 'question' | 'answer',
        value: vote.value as 1 | -1
      }));

      setVotes(userVotes);
    } catch (error) {
      console.error('Error fetching user votes:', error);
    }
  };

  const refreshQuestions = async () => {
    try {
      setIsLoading(true);
      
      // Fetch questions with author info
      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select(`
          *,
          author:users!questions_author_id_fkey(*)
        `)
        .order('created_at', { ascending: false });

      if (questionsError) throw questionsError;

      // Fetch answers with author info
      const { data: answersData, error: answersError } = await supabase
        .from('answers')
        .select(`
          *,
          author:users(*)
        `)
        .order('created_at', { ascending: true });

      if (answersError) throw answersError;

      // Combine questions with their answers
      const questionsWithAnswers: Question[] = questionsData.map(q => {
        const questionAnswers = answersData
          .filter(a => a.question_id === q.id)
          .map(a => ({
            id: a.id,
            content: a.content,
            questionId: a.question_id,
            authorId: a.author_id,
            author: {
              id: a.author.id,
              username: a.author.username,
              email: a.author.email,
              avatar: a.author.avatar_url,
              role: a.author.role,
              reputation: a.author.reputation,
              questionsAnswered: a.author.questions_answered,
              badge: a.author.badge,
              joinedAt: new Date(a.author.created_at)
            },
            createdAt: new Date(a.created_at),
            updatedAt: new Date(a.updated_at),
            votes: a.votes,
            isAccepted: a.is_accepted,
            isAIGenerated: a.is_ai_generated
          }));

        return {
          id: q.id,
          title: q.title,
          description: q.description,
          tags: q.tags,
          authorId: q.author_id,
          author: {
            id: q.author.id,
            username: q.author.username,
            email: q.author.email,
            avatar: q.author.avatar_url,
            role: q.author.role,
            reputation: q.author.reputation,
            questionsAnswered: q.author.questions_answered,
            badge: q.author.badge,
            joinedAt: new Date(q.author.created_at)
          },
          createdAt: new Date(q.created_at),
          updatedAt: new Date(q.updated_at),
          votes: q.votes,
          views: q.views,
          answers: questionAnswers,
          acceptedAnswerId: q.accepted_answer_id
        };
      });

      setQuestions(questionsWithAnswers);
    } catch (error) {
      console.error('Error fetching questions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addQuestion = async (questionData: Omit<Question, 'id' | 'createdAt' | 'updatedAt' | 'votes' | 'views' | 'answers' | 'author'>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { data, error } = await supabase
        .from('questions')
        .insert({
          title: questionData.title,
          description: questionData.description,
          tags: questionData.tags,
          author_id: user.id
        })
        .select()
        .single();

      if (error) throw error;

      await refreshQuestions();
    } catch (error) {
      console.error('Error adding question:', error);
      throw error;
    }
  };

  const addAnswer = async (answerData: Omit<Answer, 'id' | 'createdAt' | 'updatedAt' | 'votes' | 'isAccepted' | 'author'>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { data, error } = await supabase
        .from('answers')
        .insert({
          content: answerData.content,
          question_id: answerData.questionId,
          author_id: user.id,
          is_ai_generated: answerData.isAIGenerated || false
        })
        .select()
        .single();

      if (error) throw error;

      // Update user stats
      await updateUserStats(user.id);
      await refreshQuestions();
    } catch (error) {
      console.error('Error adding answer:', error);
      throw error;
    }
  };

  const addAIAnswer = async (questionId: string, questionTitle: string, questionDescription: string) => {
    try {
      const aiContent = await generateAIAnswer(questionTitle, questionDescription);
      
      const { data, error } = await supabase
        .from('answers')
        .insert({
          content: aiContent,
          question_id: questionId,
          author_id: 'ai-assistant', // Special ID for AI
          is_ai_generated: true
        })
        .select()
        .single();

      if (error) throw error;

      await refreshQuestions();
    } catch (error) {
      console.error('Error adding AI answer:', error);
      throw error;
    }
  };

  const voteOnQuestion = async (questionId: string, value: 1 | -1) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const existingVote = votes.find(v => 
        v.userId === user.id && v.targetId === questionId && v.targetType === 'question'
      );

      if (existingVote) {
        if (existingVote.value === value) {
          // Remove vote
          await supabase.from('votes').delete().eq('id', existingVote.id);
          await supabase.rpc('update_question_votes', {
            question_id: questionId,
            vote_change: -value
          });
        } else {
          // Change vote
          await supabase
            .from('votes')
            .update({ value })
            .eq('id', existingVote.id);
          await supabase.rpc('update_question_votes', {
            question_id: questionId,
            vote_change: value - existingVote.value
          });
        }
      } else {
        // New vote
        await supabase
          .from('votes')
          .insert({
            user_id: user.id,
            target_id: questionId,
            target_type: 'question',
            value
          });
        await supabase.rpc('update_question_votes', {
          question_id: questionId,
          vote_change: value
        });
      }

      await fetchUserVotes();
      await refreshQuestions();
    } catch (error) {
      console.error('Error voting on question:', error);
      throw error;
    }
  };

  const voteOnAnswer = async (answerId: string, value: 1 | -1) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const existingVote = votes.find(v => 
        v.userId === user.id && v.targetId === answerId && v.targetType === 'answer'
      );

      if (existingVote) {
        if (existingVote.value === value) {
          // Remove vote
          await supabase.from('votes').delete().eq('id', existingVote.id);
          await supabase.rpc('update_answer_votes', {
            answer_id: answerId,
            vote_change: -value
          });
        } else {
          // Change vote
          await supabase
            .from('votes')
            .update({ value })
            .eq('id', existingVote.id);
          await supabase.rpc('update_answer_votes', {
            answer_id: answerId,
            vote_change: value - existingVote.value
          });
        }
      } else {
        // New vote
        await supabase
          .from('votes')
          .insert({
            user_id: user.id,
            target_id: answerId,
            target_type: 'answer',
            value
          });
        await supabase.rpc('update_answer_votes', {
          answer_id: answerId,
          vote_change: value
        });
      }

      await fetchUserVotes();
      await refreshQuestions();
    } catch (error) {
      console.error('Error voting on answer:', error);
      throw error;
    }
  };

  const acceptAnswer = async (questionId: string, answerId: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      // Update question with accepted answer
      await supabase
        .from('questions')
        .update({ accepted_answer_id: answerId })
        .eq('id', questionId);

      // Update answer as accepted
      await supabase
        .from('answers')
        .update({ is_accepted: true })
        .eq('id', answerId);

      await refreshQuestions();
    } catch (error) {
      console.error('Error accepting answer:', error);
      throw error;
    }
  };

  const incrementQuestionViews = async (questionId: string) => {
    try {
      await supabase.rpc('increment_question_views', {
        question_id: questionId
      });
      await refreshQuestions();
    } catch (error) {
      console.error('Error incrementing views:', error);
    }
  };

  const markNotificationRead = (notificationId: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === notificationId ? { ...n, isRead: true } : n
    ));
  };

  const getUnreadNotificationCount = () => {
    if (!user) return 0;
    return notifications.filter(n => n.userId === user.id && !n.isRead).length;
  };

  const value = {
    questions,
    notifications,
    votes,
    isLoading,
    addQuestion,
    addAnswer,
    addAIAnswer,
    voteOnQuestion,
    voteOnAnswer,
    acceptAnswer,
    markNotificationRead,
    getUnreadNotificationCount,
    refreshQuestions,
    incrementQuestionViews
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};