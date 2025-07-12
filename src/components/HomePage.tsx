import React, { useState } from 'react';
import { Filter, ChevronDown, TrendingUp, Clock, MessageSquare, Sparkles, Star, Users } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import QuestionCard from './QuestionCard';
import { Question } from '../types';

interface HomePageProps {
  onQuestionClick: (question: Question) => void;
}

const HomePage: React.FC<HomePageProps> = ({ onQuestionClick }) => {
  const { questions, isLoading, error, clearError } = useData();
  const { user } = useAuth();
  const [sortBy, setSortBy] = useState<'newest' | 'votes' | 'views'>('newest');
  const [filterBy, setFilterBy] = useState<'all' | 'unanswered' | 'answered'>('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const allTags = Array.from(new Set(questions.flatMap(q => q.tags)));

  const filteredQuestions = questions
    .filter(question => {
      if (filterBy === 'unanswered' && question.answers.length > 0) return false;
      if (filterBy === 'answered' && question.answers.length === 0) return false;
      if (selectedTags.length > 0 && !selectedTags.some(tag => question.tags.includes(tag))) return false;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'votes':
          return b.votes - a.votes;
        case 'views':
          return b.views - a.views;
        case 'newest':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const getSortIcon = (sort: string) => {
    switch (sort) {
      case 'votes': return <TrendingUp className="h-4 w-4" />;
      case 'views': return <MessageSquare className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30">
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-5 h-5 bg-red-500 rounded-full flex-shrink-0"></div>
              <span>{error}</span>
            </div>
            <button
              onClick={clearError}
              className="text-red-600 hover:text-red-800 font-medium"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="flex flex-col xl:flex-row gap-6 lg:gap-8">
          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 lg:mb-8 gap-4">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
                  Questions
                </h1>
                <p className="text-gray-600 mt-1 text-sm lg:text-base">
                  {filteredQuestions.length} question{filteredQuestions.length !== 1 ? 's' : ''} found
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                {/* Sort dropdown */}
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="appearance-none bg-white/90 backdrop-blur-sm border border-gray-200/50 rounded-2xl pl-4 pr-12 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all duration-300 shadow-sm hover:shadow-md w-full sm:w-auto"
                  >
                    <option value="newest">Newest</option>
                    <option value="votes">Most Votes</option>
                    <option value="views">Most Views</option>
                  </select>
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1 pointer-events-none">
                    {getSortIcon(sortBy)}
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  </div>
                </div>

                {/* Filter dropdown */}
                <div className="relative">
                  <select
                    value={filterBy}
                    onChange={(e) => setFilterBy(e.target.value as any)}
                    className="appearance-none bg-white/90 backdrop-blur-sm border border-gray-200/50 rounded-2xl pl-4 pr-12 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all duration-300 shadow-sm hover:shadow-md w-full sm:w-auto"
                  >
                    <option value="all">All Questions</option>
                    <option value="unanswered">Unanswered</option>
                    <option value="answered">Answered</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Questions List */}
            <div className="space-y-4 lg:space-y-6">
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="bg-white/90 backdrop-blur-sm border border-gray-200/50 rounded-3xl p-6 lg:p-8 animate-pulse">
                      <div className="h-6 bg-gray-200 rounded-2xl mb-4"></div>
                      <div className="h-4 bg-gray-200 rounded-xl mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded-xl w-3/4"></div>
                    </div>
                  ))}
                </div>
              ) : filteredQuestions.length === 0 ? (
                <div className="text-center py-12 lg:py-16">
                  <div className="w-20 h-20 lg:w-24 lg:h-24 bg-gradient-to-r from-blue-100 via-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <MessageSquare className="h-10 w-10 lg:h-12 lg:w-12 text-gray-400" />
                  </div>
                  <div className="text-gray-500 max-w-md mx-auto">
                    {questions.length === 0 ? (
                      <>
                        <h3 className="text-xl font-semibold mb-2">No questions yet!</h3>
                        {user && (
                          <p className="text-sm">Be the first to ask a question and start the conversation.</p>
                        )}
                      </>
                    ) : (
                      <>
                        <h3 className="text-xl font-semibold mb-2">No questions match your filters</h3>
                        <p className="text-sm">Try adjusting your search criteria or clearing the filters.</p>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                filteredQuestions.map((question) => (
                  <QuestionCard
                    key={question.id}
                    question={question}
                    onClick={() => onQuestionClick(question)}
                  />
                ))
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="w-full xl:w-80 space-y-6">
            {/* Filter by Tags */}
            <div className="bg-white/90 backdrop-blur-sm border border-gray-200/50 rounded-3xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center mr-3 shadow-lg">
                  <Filter className="h-4 w-4 text-white" />
                </div>
                Filter by Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ${
                      selectedTags.includes(tag)
                        ? 'bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white shadow-lg transform scale-105'
                        : 'bg-gray-100/80 text-gray-700 hover:bg-gray-200/80 hover:scale-105'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
              {selectedTags.length > 0 && (
                <button
                  onClick={() => setSelectedTags([])}
                  className="mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  Clear all filters
                </button>
              )}
            </div>

            {/* Statistics */}
            <div className="bg-white/90 backdrop-blur-sm border border-gray-200/50 rounded-3xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center mr-3 shadow-lg">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                Community Stats
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 rounded-2xl border border-blue-100/50">
                  <span className="text-gray-700 font-medium flex items-center">
                    <MessageSquare className="h-4 w-4 mr-2 text-blue-600" />
                    Total Questions
                  </span>
                  <span className="text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                    {questions.length}
                  </span>
                </div>
                <div className="flex justify-between items-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-100/50">
                  <span className="text-gray-700 font-medium flex items-center">
                    <Star className="h-4 w-4 mr-2 text-green-600" />
                    Answered
                  </span>
                  <span className="text-xl font-bold text-green-600">
                    {questions.filter(q => q.answers.length > 0).length}
                  </span>
                </div>
                <div className="flex justify-between items-center p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl border border-orange-100/50">
                  <span className="text-gray-700 font-medium flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-orange-600" />
                    Unanswered
                  </span>
                  <span className="text-xl font-bold text-orange-600">
                    {questions.filter(q => q.answers.length === 0).length}
                  </span>
                </div>
              </div>
            </div>

            {/* Popular Tags */}
            <div className="bg-white/90 backdrop-blur-sm border border-gray-200/50 rounded-3xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mr-3 shadow-lg">
                  <Users className="h-4 w-4 text-white" />
                </div>
                Popular Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {allTags.slice(0, 8).map((tag) => (
                  <span
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 hover:from-blue-100 hover:to-purple-100 hover:text-blue-700 transition-all duration-300 cursor-pointer hover:scale-105 shadow-sm hover:shadow-md"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Welcome Message for New Users */}
            {!user && (
              <div className="bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 border border-blue-200/50 rounded-3xl p-6 shadow-lg">
                <div className="text-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <Sparkles className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Join StackIt</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Sign up to ask questions, provide answers, and build your reputation in the community.
                  </p>
                  <div className="space-y-2 text-xs text-gray-500">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>Ask unlimited questions</span>
                    </div>
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span>Vote on answers</span>
                    </div>
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                      <span>Build your reputation</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;