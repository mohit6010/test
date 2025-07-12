import React, { useState, useEffect } from 'react';
import { ArrowLeft, User, Award, Calendar, Star, MessageSquare, TrendingUp, Target, Crown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { badges, getBadgeForAnswerCount, getNextBadge } from '../utils/badges';
import { formatDistanceToNow } from 'date-fns';

interface ProfilePageProps {
  onBack: () => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ onBack }) => {
  const { user } = useAuth();
  const { questions } = useData();
  const [userQuestions, setUserQuestions] = useState<any[]>([]);
  const [userAnswers, setUserAnswers] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'questions' | 'answers' | 'badges'>('overview');

  useEffect(() => {
    if (user && questions) {
      const myQuestions = questions.filter(q => q.authorId === user.id);
      const myAnswers = questions.flatMap(q => 
        q.answers.filter(a => a.authorId === user.id).map(a => ({ ...a, questionTitle: q.title }))
      );
      
      setUserQuestions(myQuestions);
      setUserAnswers(myAnswers);
    }
  }, [user, questions]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 flex items-center justify-center p-4">
        <div className="text-center bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-gray-200/50">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please sign in to view your profile</h2>
          <button
            onClick={onBack}
            className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white px-6 py-3 rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  const currentBadge = getBadgeForAnswerCount(user.questionsAnswered);
  const nextBadge = getNextBadge(user.questionsAnswered);
  const progressToNext = nextBadge ? 
    ((user.questionsAnswered - currentBadge.requirement) / (nextBadge.requirement - currentBadge.requirement)) * 100 : 100;

  const stats = [
    { label: 'Questions Asked', value: userQuestions.length, icon: MessageSquare, color: 'text-blue-600' },
    { label: 'Answers Given', value: userAnswers.length, icon: Star, color: 'text-green-600' },
    { label: 'Reputation', value: user.reputation, icon: TrendingUp, color: 'text-purple-600' },
    { label: 'Accepted Answers', value: userAnswers.filter(a => a.isAccepted).length, icon: Award, color: 'text-yellow-600' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={onBack}
            className="flex items-center text-blue-600 hover:text-blue-700 font-medium mb-6 bg-white/90 backdrop-blur-sm px-4 py-2.5 rounded-2xl border border-gray-200/50 hover:bg-white/95 transition-all duration-300 shadow-sm hover:shadow-md"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Questions
          </button>
        </div>

        {/* Profile Header */}
        <div className="bg-white/90 backdrop-blur-sm border border-gray-200/50 rounded-3xl p-6 lg:p-8 mb-8 shadow-2xl">
          <div className="flex flex-col lg:flex-row lg:items-center gap-6">
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 lg:w-24 lg:h-24 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
                <User className="h-10 w-10 lg:h-12 lg:w-12 text-white" />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">{user.username}</h1>
                <p className="text-gray-600">{user.email}</p>
                <div className="flex items-center space-x-2 mt-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-500">
                    Joined {formatDistanceToNow(user.joinedAt, { addSuffix: true })}
                  </span>
                </div>
              </div>
            </div>

            {/* Current Badge */}
            <div className="lg:ml-auto">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-4 border border-gray-200/50">
                <div className="text-center">
                  <div className={`w-16 h-16 ${currentBadge.color} rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-lg`}>
                    <span className="text-2xl">{currentBadge.icon}</span>
                  </div>
                  <h3 className="font-semibold text-gray-900">{currentBadge.name}</h3>
                  <p className="text-xs text-gray-500">{currentBadge.description}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Progress to Next Badge */}
          {nextBadge && (
            <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 rounded-2xl border border-blue-200/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Progress to {nextBadge.name}</span>
                <span className="text-sm text-gray-500">
                  {user.questionsAnswered} / {nextBadge.requirement} answers
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(progressToNext, 100)}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white/90 backdrop-blur-sm border border-gray-200/50 rounded-2xl p-4 lg:p-6 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="bg-white/90 backdrop-blur-sm border border-gray-200/50 rounded-3xl shadow-2xl overflow-hidden">
          <div className="border-b border-gray-200/50">
            <nav className="flex space-x-8 px-6 lg:px-8">
              {[
                { id: 'overview', label: 'Overview', icon: User },
                { id: 'questions', label: 'Questions', icon: MessageSquare },
                { id: 'answers', label: 'Answers', icon: Star },
                { id: 'badges', label: 'Badges', icon: Crown }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-all duration-300 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  <span className="hidden sm:block">{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6 lg:p-8">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                  <div className="space-y-4">
                    {userAnswers.slice(0, 5).map((answer) => (
                      <div key={answer.id} className="flex items-center space-x-3 p-4 bg-gray-50/80 rounded-2xl">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <Star className="h-4 w-4 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">Answered: {answer.questionTitle}</p>
                          <p className="text-xs text-gray-500">{formatDistanceToNow(answer.createdAt, { addSuffix: true })}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'questions' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Your Questions ({userQuestions.length})</h3>
                {userQuestions.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">You haven't asked any questions yet.</p>
                  </div>
                ) : (
                  userQuestions.map((question) => (
                    <div key={question.id} className="p-4 bg-gray-50/80 rounded-2xl border border-gray-200/50">
                      <h4 className="font-semibold text-gray-900 mb-2">{question.title}</h4>
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center space-x-4">
                          <span>{question.votes} votes</span>
                          <span>{question.answers.length} answers</span>
                          <span>{question.views} views</span>
                        </div>
                        <span>{formatDistanceToNow(question.createdAt, { addSuffix: true })}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'answers' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Your Answers ({userAnswers.length})</h3>
                {userAnswers.length === 0 ? (
                  <div className="text-center py-8">
                    <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">You haven't answered any questions yet.</p>
                  </div>
                ) : (
                  userAnswers.map((answer) => (
                    <div key={answer.id} className="p-4 bg-gray-50/80 rounded-2xl border border-gray-200/50">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-900">{answer.questionTitle}</h4>
                        {answer.isAccepted && (
                          <div className="flex items-center space-x-1 text-green-600 bg-green-50 px-2 py-1 rounded-full text-xs">
                            <Award className="h-3 w-3" />
                            <span>Accepted</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>{answer.votes} votes</span>
                        <span>{formatDistanceToNow(answer.createdAt, { addSuffix: true })}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'badges' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Badge Collection</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {badges.map((badge) => {
                    const isEarned = user.questionsAnswered >= badge.requirement;
                    return (
                      <div
                        key={badge.name}
                        className={`p-6 rounded-2xl border transition-all duration-300 ${
                          isEarned
                            ? 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200 shadow-lg'
                            : 'bg-gray-50/50 border-gray-200/50 opacity-60'
                        }`}
                      >
                        <div className="text-center">
                          <div className={`w-16 h-16 ${isEarned ? badge.color : 'bg-gray-300'} rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg`}>
                            <span className="text-2xl">{badge.icon}</span>
                          </div>
                          <h4 className="font-semibold text-gray-900 mb-1">{badge.name}</h4>
                          <p className="text-sm text-gray-600 mb-2">{badge.description}</p>
                          <p className="text-xs text-gray-500">
                            {isEarned ? 'Earned!' : `${badge.requirement} answers required`}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;