import React, { useState } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import Header from './components/Header';
import HomePage from './components/HomePage';
import AskQuestionPage from './components/AskQuestionPage';
import QuestionDetailPage from './components/QuestionDetailPage';
import ProfilePage from './components/ProfilePage';
import { Question } from './types';

type PageType = 'home' | 'ask' | 'question' | 'profile';

function App() {
  const [currentPage, setCurrentPage] = useState<PageType>('home');
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);

  const handleQuestionClick = (question: Question) => {
    setSelectedQuestion(question);
    setCurrentPage('question');
  };

  const handleAskQuestion = () => {
    setCurrentPage('ask');
  };

  const handleProfile = () => {
    setCurrentPage('profile');
  };

  const handleHome = () => {
    setCurrentPage('home');
    setSelectedQuestion(null);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'ask':
        return <AskQuestionPage onBack={handleHome} />;
      case 'question':
        return selectedQuestion ? (
          <QuestionDetailPage question={selectedQuestion} onBack={handleHome} />
        ) : (
          <HomePage onQuestionClick={handleQuestionClick} />
        );
      case 'profile':
        return <ProfilePage onBack={handleHome} />;
      case 'home':
      default:
        return <HomePage onQuestionClick={handleQuestionClick} />;
    }
  };

  return (
    <AuthProvider>
      <DataProvider>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30">
          <Header 
            onAskQuestion={handleAskQuestion} 
            onHome={handleHome} 
            onProfile={handleProfile}
          />
          <main>
            {renderPage()}
          </main>
        </div>
      </DataProvider>
    </AuthProvider>
  );
}

export default App;