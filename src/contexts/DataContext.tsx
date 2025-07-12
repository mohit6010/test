import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Question, Answer, Notification, Vote } from '../types';
import { useAuth } from './AuthContext';
import { generateAIAnswer } from '../lib/gemini';

interface DataContextType {
  questions: Question[];
  notifications: Notification[];
  votes: Vote[];
  isLoading: boolean;
  error: string | null;
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
  clearError: () => void;
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
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const handleError = useCallback((error: any, operation: string) => {
    console.error(`Error in ${operation}:`, error);
    setError(`Failed to ${operation}. Please try again.`);
  }, []);

  const fetchUserVotes = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('votes')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      const userVotes: Vote[] = (data || []).map(vote => ({
        id: vote.id,
        userId: vote.user_id,
        targetId: vote.target_id,
        targetType: vote.target_type as 'question' | 'answer',
        value: vote.value as 1 | -1
      }));

      setVotes(userVotes);
    } catch (error) {
      handleError(error, 'fetch user votes');
    }
  }, [user, handleError]);

  const refreshQuestions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch questions with author info
      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select(`
          *,
          author:users(*)
        `)
        .order('created_at', { ascending: false });

      if (questionsError) throw questionsError;

      if (!questionsData) {
        setQuestions([]);
        return;
      }

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
        const questionAnswers = (answersData || [])
          .filter(a => a.question_id === q.id)
          .map(a => ({
            id: a.id,
            content: a.content,
            questionId: a.question_id,
            authorId: a.author_id,
            author: a.author ? {
              id: a.author.id,
              username: a.author.username,
              email: a.author.email,
              avatar: a.author.avatar_url,
              role: a.author.role,
              reputation: a.author.reputation || 0,
              questionsAnswered: a.author.questions_answered || 0,
              badge: a.author.badge || 'Newcomer',
              joinedAt: new Date(a.author.created_at)
            } : {
              id: 'ai-assistant',
              username: 'AI Assistant',
              email: '',
              avatar: null,
              role: 'user' as const,
              reputation: 0,
              questionsAnswered: 0,
              badge: 'AI',
              joinedAt: new Date()
            },
            createdAt: new Date(a.created_at),
            updatedAt: new Date(a.updated_at),
            votes: a.votes || 0,
            isAccepted: a.is_accepted || false,
            isAIGenerated: a.is_ai_generated || false
          }));

        return {
          id: q.id,
          title: q.title,
          description: q.description,
          tags: q.tags || [],
          authorId: q.author_id,
          author: {
            id: q.author.id,
            username: q.author.username,
            email: q.author.email,
            avatar: q.author.avatar_url,
            role: q.author.role,
            reputation: q.author.reputation || 0,
            questionsAnswered: q.author.questions_answered || 0,
            badge: q.author.badge || 'Newcomer',
            joinedAt: new Date(q.author.created_at)
          },
          createdAt: new Date(q.created_at),
          updatedAt: new Date(q.updated_at),
          votes: q.votes || 0,
          views: q.views || 0,
          answers: questionAnswers,
          acceptedAnswerId: q.accepted_answer_id
        };
      });

      setQuestions(questionsWithAnswers);
    } catch (error) {
      handleError(error, 'fetch questions');
    } finally {
      setIsLoading(false);
    }
  }, [handleError]);

  useEffect(() => {
    refreshQuestions();
    if (user) {
      fetchUserVotes();
    }
  }, [user, refreshQuestions, fetchUserVotes]);

  const addQuestion = useCallback(async (questionData: Omit<Question, 'id' | 'createdAt' | 'updatedAt' | 'votes' | 'views' | 'answers' | 'author'>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      setError(null);
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
      handleError(error, 'add question');
      throw error;
    }
  }, [user, refreshQuestions, handleError]);

  const addAnswer = useCallback(async (answerData: Omit<Answer, 'id' | 'createdAt' | 'updatedAt' | 'votes' | 'isAccepted' | 'author'>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      setError(null);
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

      // Update user stats and refresh data
      await Promise.all([
        updateUserStats(user.id),
        refreshQuestions()
      ]);
    } catch (error) {
      handleError(error, 'add answer');
      throw error;
    }
  }, [user, updateUserStats, refreshQuestions, handleError]);

  const addAIAnswer = useCallback(async (questionId: string, questionTitle: string, questionDescription: string) => {
    try {
      setError(null);
      const aiContent = await generateAIAnswer(questionTitle, questionDescription);
      
      const { data, error } = await supabase
        .from('answers')
        .insert({
          content: aiContent,
          question_id: questionId,
          author_id: 'ai-assistant',
          is_ai_generated: true
        })
        .select()
        .single();

      if (error) throw error;

      await refreshQuestions();
    } catch (error) {
      handleError(error, 'generate AI answer');
      throw error;
    }
  }, [refreshQuestions, handleError]);

  const updateVoteCount = useCallback(async (targetId: string, targetType: 'question' | 'answer', change: number) => {
    const table = targetType === 'question' ? 'questions' : 'answers';
    
    const { data: current, error: fetchError } = await supabase
      .from(table)
      .select('votes')
      .eq('id', targetId)
      .single();

    if (fetchError) throw fetchError;

    const newVotes = (current.votes || 0) + change;

    const { error: updateError } = await supabase
      .from(table)
      .update({ votes: newVotes })
      .eq('id', targetId);

    if (updateError) throw updateError;
  }, []);

  const voteOnQuestion = useCallback(async (questionId: string, value: 1 | -1) => {
    if (!user) throw new Error('User not authenticated');

    try {
      setError(null);
      const existingVote = votes.find(v => 
        v.userId === user.id && v.targetId === questionId && v.targetType === 'question'
      );

      if (existingVote) {
        if (existingVote.value === value) {
          // Remove vote
          await supabase.from('votes').delete().eq('id', existingVote.id);
          await updateVoteCount(questionId, 'question', -value);
        } else {
          // Change vote
          await supabase
            .from('votes')
            .update({ value })
            .eq('id', existingVote.id);
          await updateVoteCount(questionId, 'question', value - existingVote.value);
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
        await updateVoteCount(questionId, 'question', value);
      }

      await Promise.all([
        fetchUserVotes(),
        refreshQuestions()
      ]);
    } catch (error) {
      handleError(error, 'vote on question');
      throw error;
    }
  }, [user, votes, updateVoteCount, fetchUserVotes, refreshQuestions, handleError]);

  const voteOnAnswer = useCallback(async (answerId: string, value: 1 | -1) => {
    if (!user) throw new Error('User not authenticated');

    try {
      setError(null);
      const existingVote = votes.find(v => 
        v.userId === user.id && v.targetId === answerId && v.targetType === 'answer'
      );

      if (existingVote) {
        if (existingVote.value === value) {
          // Remove vote
          await supabase.from('votes').delete().eq('id', existingVote.id);
          await updateVoteCount(answerId, 'answer', -value);
        } else {
          // Change vote
          await supabase
            .from('votes')
            .update({ value })
            .eq('id', existingVote.id);
          await updateVoteCount(answerId, 'answer', value - existingVote.value);
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
        await updateVoteCount(answerId, 'answer', value);
      }

      await Promise.all([
        fetchUserVotes(),
        refreshQuestions()
      ]);
    } catch (error) {
      handleError(error, 'vote on answer');
      throw error;
    }
  }, [user, votes, updateVoteCount, fetchUserVotes, refreshQuestions, handleError]);

  const acceptAnswer = useCallback(async (questionId: string, answerId: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      setError(null);
      
      // Update question with accepted answer
      const { error: questionError } = await supabase
        .from('questions')
        .update({ accepted_answer_id: answerId })
        .eq('id', questionId);

      if (questionError) throw questionError;

      // Update answer as accepted
      const { error: answerError } = await supabase
        .from('answers')
        .update({ is_accepted: true })
        .eq('id', answerId);

      if (answerError) throw answerError;

      await refreshQuestions();
    } catch (error) {
      handleError(error, 'accept answer');
      throw error;
    }
  }, [user, refreshQuestions, handleError]);

  const incrementQuestionViews = useCallback(async (questionId: string) => {
    try {
      const { data: current, error: fetchError } = await supabase
        .from('questions')
        .select('views')
        .eq('id', questionId)
        .single();

      if (fetchError) throw fetchError;

      const { error: updateError } = await supabase
        .from('questions')
        .update({ views: (current.views || 0) + 1 })
        .eq('id', questionId);

      if (updateError) throw updateError;

      // Update local state without full refresh
      setQuestions(prev => prev.map(q => 
        q.id === questionId ? { ...q, views: q.views + 1 } : q
      ));
    } catch (error) {
      console.error('Error incrementing views:', error);
      // Don't show error to user for view tracking
    }
  }, []);

  const markNotificationRead = useCallback((notificationId: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === notificationId ? { ...n, isRead: true } : n
    ));
  }, []);

  const getUnreadNotificationCount = useCallback(() => {
    if (!user) return 0;
    return notifications.filter(n => n.userId === user.id && !n.isRead).length;
  }, [user, notifications]);

  const value = {
    questions,
    notifications,
    votes,
    isLoading,
    error,
    addQuestion,
    addAnswer,
    addAIAnswer,
    voteOnQuestion,
    voteOnAnswer,
    acceptAnswer,
    markNotificationRead,
    getUnreadNotificationCount,
    refreshQuestions,
    incrementQuestionViews,
    clearError
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};