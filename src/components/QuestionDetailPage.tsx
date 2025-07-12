import React, { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ArrowLeft, ArrowUp, ArrowDown, User, Check, Eye, MessageSquare, Award, Clock, Star, Bot, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { Question, Answer } from '../types';
import RichTextEditor from './RichTextEditor';

interface QuestionDetailPageProps {
  question: Question;
  onBack: () => void;
}

const QuestionDetailPage: React.FC<QuestionDetailPageProps> = ({ question, onBack }) => {
  const { user } = useAuth();
  const { voteOnQuestion, voteOnAnswer, acceptAnswer, addAnswer, addAIAnswer, votes, incrementQuestionViews } = useData();
  const [answerContent, setAnswerContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  useEffect(() => {
    // Increment views when question is viewed
    incrementQuestionViews(question.id);
  }, [question.id, incrementQuestionViews]);

  const getUserVote = (targetId: string, targetType: 'question' | 'answer') => {
    if (!user) return null;
    return votes.find(v => 
      v.userId === user.id && 
      v.targetId === targetId && 
      v.targetType === targetType
    );
  };

  const handleVote = async (targetId: string, targetType: 'question' | 'answer', value: 1 | -1) => {
    if (!user) return;
    
    try {
      if (targetType === 'question') {
        await voteOnQuestion(targetId, value);
      } else {
        await voteOnAnswer(targetId, value);
      }
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  const handleAcceptAnswer = async (answerId: string) => {
    if (!user || user.id !== question.authorId) return;
    
    try {
      await acceptAnswer(question.id, answerId);
    } catch (error) {
      console.error('Error accepting answer:', error);
    }
  };

  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !answerContent.trim()) return;

    setIsSubmitting(true);
    try {
      await addAnswer({
        content: answerContent,
        questionId: question.id,
        authorId: user.id,
        isAIGenerated: false
      });
      setAnswerContent('');
    } catch (error) {
      console.error('Failed to submit answer:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerateAIAnswer = async () => {
    setIsGeneratingAI(true);
    try {
      await addAIAnswer(question.id, question.title, question.description);
    } catch (error) {
      console.error('Failed to generate AI answer:', error);
      alert('Failed to generate AI answer. Please check your API configuration.');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const questionVote = getUserVote(question.id, 'question');
  const isQuestionOwner = user?.id === question.authorId;
  const hasAIAnswer = question.answers.some(answer => answer.isAIGenerated);

  const VoteButton: React.FC<{ 
    direction: 'up' | 'down'; 
    onClick: () => void; 
    active: boolean; 
    disabled: boolean 
  }> = ({ direction, onClick, active, disabled }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`p-2 sm:p-3 rounded-xl sm:rounded-2xl transition-all duration-300 ${
        active
          ? direction === 'up' 
            ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg transform scale-110'
            : 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg transform scale-110'
          : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900 hover:scale-105'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {direction === 'up' ? <ArrowUp className="h-4 w-4 sm:h-5 sm:w-5" /> : <ArrowDown className="h-4 w-4 sm:h-5 sm:w-5" />}
    </button>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <button
            onClick={onBack}
            className="flex items-center text-blue-600 hover:text-blue-700 font-medium mb-4 sm:mb-6 bg-white/90 backdrop-blur-sm px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl border border-gray-200/50 hover:bg-white/95 transition-all duration-300 shadow-sm hover:shadow-md text-sm sm:text-base"
          >
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            Back to Questions
          </button>
        </div>

        {/* Question */}
        <div className="bg-white/90 backdrop-blur-sm border border-gray-200/50 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8 shadow-2xl">
          <div className="flex flex-col lg:flex-row lg:items-start gap-4 sm:gap-6">
            {/* Voting - Desktop */}
            <div className="hidden lg:flex flex-col items-center space-y-4 bg-gray-50/80 rounded-3xl p-6 shadow-sm border border-gray-200/50">
              <VoteButton
                direction="up"
                onClick={() => handleVote(question.id, 'question', 1)}
                active={questionVote?.value === 1}
                disabled={!user}
              />
              <span className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                {question.votes}
              </span>
              <VoteButton
                direction="down"
                onClick={() => handleVote(question.id, 'question', -1)}
                active={questionVote?.value === -1}
                disabled={!user}
              />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight">{question.title}</h1>
              
              <div 
                className="prose prose-sm sm:prose-lg max-w-none text-gray-700 mb-6 sm:mb-8 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: question.description }}
              />

              <div className="flex flex-wrap gap-2 mb-6 sm:mb-8">
                {question.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium bg-gradient-to-r from-blue-100 via-purple-100 to-pink-100 text-blue-800 border border-blue-200 hover:from-blue-200 hover:via-purple-200 hover:to-pink-200 transition-all duration-300 shadow-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Mobile Voting */}
              <div className="lg:hidden flex items-center justify-center space-x-4 sm:space-x-6 mb-6 sm:mb-8 bg-gray-50/80 rounded-xl sm:rounded-2xl p-3 sm:p-4">
                <VoteButton
                  direction="up"
                  onClick={() => handleVote(question.id, 'question', 1)}
                  active={questionVote?.value === 1}
                  disabled={!user}
                />
                <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {question.votes}
                </span>
                <VoteButton
                  direction="down"
                  onClick={() => handleVote(question.id, 'question', -1)}
                  active={questionVote?.value === -1}
                  disabled={!user}
                />
              </div>

              <div className="flex flex-col sm:flex-row lg:items-center justify-between gap-4 sm:gap-6">
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500">
                  <div className="flex items-center space-x-1 sm:space-x-2 bg-gray-100/80 px-2 sm:px-3 py-1.5 sm:py-2 rounded-full">
                    <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>{question.views} views</span>
                  </div>
                  <div className="flex items-center space-x-1 sm:space-x-2 bg-gray-100/80 px-2 sm:px-3 py-1.5 sm:py-2 rounded-full">
                    <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>{question.answers.length} answers</span>
                  </div>
                  <div className="flex items-center space-x-1 sm:space-x-2 bg-gray-100/80 px-2 sm:px-3 py-1.5 sm:py-2 rounded-full">
                    <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">{formatDistanceToNow(question.createdAt, { addSuffix: true })}</span>
                    <span className="sm:hidden">{formatDistanceToNow(question.createdAt, { addSuffix: true }).replace('about ', '')}</span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 sm:space-x-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2 sm:py-3 border border-gray-200/50">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
                    <User className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold text-gray-900 text-sm sm:text-base">{question.author.username}</span>
                    <div className="flex items-center space-x-1 text-xs sm:text-sm text-gray-500">
                      <Award className="h-3 w-3" />
                      <span>{question.author.reputation} rep</span>
                      <span className="hidden sm:inline">• {question.author.badge}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* AI Answer Button */}
        {!hasAIAnswer && (
          <div className="mb-6 sm:mb-8">
            <button
              onClick={handleGenerateAIAnswer}
              disabled={isGeneratingAI}
              className="w-full sm:w-auto bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 hover:from-purple-700 hover:via-pink-700 hover:to-red-700 disabled:from-purple-400 disabled:via-pink-400 disabled:to-red-400 text-white px-4 sm:px-6 py-3 rounded-xl sm:rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2 text-sm sm:text-base"
            >
              {isGeneratingAI ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Generating AI Answer...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span>Get AI Answer</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Answers */}
        <div className="mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center">
            <Star className="h-5 w-5 sm:h-6 sm:w-6 mr-2 text-yellow-500" />
            {question.answers.length} Answer{question.answers.length !== 1 ? 's' : ''}
          </h2>

          <div className="space-y-4 sm:space-y-6">
            {question.answers
              .sort((a, b) => {
                if (a.isAccepted && !b.isAccepted) return -1;
                if (!a.isAccepted && b.isAccepted) return 1;
                return b.votes - a.votes;
              })
              .map((answer) => {
                const answerVote = getUserVote(answer.id, 'answer');
                
                return (
                  <div
                    key={answer.id}
                    className={`bg-white/90 backdrop-blur-sm border rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-2xl transition-all duration-300 ${
                      answer.isAccepted 
                        ? 'border-green-300 bg-gradient-to-r from-green-50/50 via-emerald-50/50 to-green-50/50' 
                        : 'border-gray-200/50'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start gap-4 sm:gap-6">
                      {/* Voting - Desktop */}
                      <div className="hidden lg:flex flex-col items-center space-y-4 bg-gray-50/80 rounded-3xl p-6 shadow-sm border border-gray-200/50">
                        <VoteButton
                          direction="up"
                          onClick={() => handleVote(answer.id, 'answer', 1)}
                          active={answerVote?.value === 1}
                          disabled={!user || answer.authorId === user?.id}
                        />
                        <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                          {answer.votes}
                        </span>
                        <VoteButton
                          direction="down"
                          onClick={() => handleVote(answer.id, 'answer', -1)}
                          active={answerVote?.value === -1}
                          disabled={!user || answer.authorId === user?.id}
                        />
                        
                        {/* Accept Answer Button */}
                        {isQuestionOwner && !question.acceptedAnswerId && !answer.isAIGenerated && (
                          <button
                            onClick={() => handleAcceptAnswer(answer.id)}
                            className="p-3 rounded-2xl hover:bg-green-100 text-gray-600 hover:text-green-600 transition-all duration-300 border-2 border-dashed border-gray-300 hover:border-green-300"
                            title="Accept this answer"
                          >
                            <Check className="h-5 w-5" />
                          </button>
                        )}
                        
                        {answer.isAccepted && (
                          <div className="p-3 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg">
                            <Check className="h-5 w-5" />
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-4">
                          {answer.isAccepted && (
                            <div className="flex items-center text-green-600 font-semibold bg-green-50 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl border border-green-200 text-xs sm:text-sm">
                              <Check className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                              Accepted Answer
                            </div>
                          )}
                          {answer.isAIGenerated && (
                            <div className="flex items-center text-purple-600 font-semibold bg-purple-50 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl border border-purple-200 text-xs sm:text-sm">
                              <Bot className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                              AI Generated
                            </div>
                          )}
                        </div>

                        {/* Mobile Voting */}
                        <div className="lg:hidden flex items-center justify-between mb-4 sm:mb-6">
                          <div className="flex items-center space-x-3 sm:space-x-4">
                            <VoteButton
                              direction="up"
                              onClick={() => handleVote(answer.id, 'answer', 1)}
                              active={answerVote?.value === 1}
                              disabled={!user || answer.authorId === user?.id}
                            />
                            <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                              {answer.votes}
                            </span>
                            <VoteButton
                              direction="down"
                              onClick={() => handleVote(answer.id, 'answer', -1)}
                              active={answerVote?.value === -1}
                              disabled={!user || answer.authorId === user?.id}
                            />
                          </div>
                          
                          {isQuestionOwner && !question.acceptedAnswerId && !answer.isAIGenerated && (
                            <button
                              onClick={() => handleAcceptAnswer(answer.id)}
                              className="p-2 rounded-xl hover:bg-green-100 text-gray-600 hover:text-green-600 transition-all duration-300 border border-gray-300 hover:border-green-300"
                              title="Accept this answer"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                        
                        <div 
                          className="prose prose-sm sm:prose-lg max-w-none text-gray-700 mb-4 sm:mb-6 leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: answer.content }}
                        />

                        <div className="flex items-center justify-end">
                          <div className="flex items-center space-x-2 sm:space-x-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2 sm:py-3 border border-gray-200/50">
                            {answer.isAIGenerated ? (
                              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
                                <Bot className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                              </div>
                            ) : (
                              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
                                <User className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                              </div>
                            )}
                            <div className="flex flex-col">
                              <span className="font-semibold text-gray-900 text-xs sm:text-sm">
                                {answer.isAIGenerated ? 'AI Assistant' : answer.author.username}
                              </span>
                              <div className="flex items-center space-x-1 sm:space-x-2 text-xs text-gray-500">
                                {!answer.isAIGenerated && (
                                  <>
                                    <Award className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                    <span>{answer.author.reputation} rep</span>
                                    <span>•</span>
                                  </>
                                )}
                                <span className="hidden sm:inline">{formatDistanceToNow(answer.createdAt, { addSuffix: true })}</span>
                                <span className="sm:hidden">{formatDistanceToNow(answer.createdAt, { addSuffix: true }).replace('about ', '')}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Answer Form */}
        {user ? (
          <div className="bg-white/90 backdrop-blur-sm border border-gray-200/50 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-2xl">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6 flex items-center">
              <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-blue-600" />
              Your Answer
            </h3>
            <form onSubmit={handleSubmitAnswer}>
              <div className="mb-4 sm:mb-6">
                <RichTextEditor
                  value={answerContent}
                  onChange={setAnswerContent}
                  placeholder="Write your answer here. Be clear and provide examples if possible."
                  minHeight="200px"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting || !answerContent.trim()}
                  className="w-full sm:w-auto px-6 sm:px-8 py-3 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 disabled:from-blue-400 disabled:via-purple-400 disabled:to-pink-400 text-white rounded-xl sm:rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl font-semibold text-sm sm:text-base"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Submitting...</span>
                    </div>
                  ) : (
                    'Submit Answer'
                  )}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-gray-50 via-blue-50 to-purple-50 border border-gray-200/50 rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-center shadow-2xl">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <User className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
            </div>
            <p className="text-gray-600 text-base sm:text-lg mb-4">Please sign in to submit an answer.</p>
            <p className="text-gray-500 text-sm">Join our community to help others and share your knowledge.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionDetailPage;