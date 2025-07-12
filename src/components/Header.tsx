import React, { useState } from 'react';
import { Bell, User, LogOut, Search, Sparkles, Menu, X, Award } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import NotificationDropdown from './NotificationDropdown';
import AuthModal from './AuthModal';

interface HeaderProps {
  onAskQuestion: () => void;
  onHome: () => void;
  onProfile: () => void;
}

const Header: React.FC<HeaderProps> = ({ onAskQuestion, onHome, onProfile }) => {
  const { user, logout } = useAuth();
  const { getUnreadNotificationCount } = useData();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const unreadCount = getUnreadNotificationCount();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Search:', searchQuery);
  };

  return (
    <>
      <header className="bg-white/90 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16 lg:h-20">
            {/* Logo */}
            <div className="flex items-center">
              <button
                onClick={onHome}
                className="flex items-center space-x-2 text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 transition-all duration-300"
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-white" />
                </div>
                <span className="hidden sm:block">StackIt</span>
              </button>
            </div>

            {/* Desktop Search Bar */}
            <div className="hidden md:flex flex-1 max-w-2xl mx-8">
              <form onSubmit={handleSearch} className="relative w-full">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search questions, tags, or users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-12 pr-4 py-2.5 sm:py-3 bg-gray-50/80 backdrop-blur-sm border border-gray-200/50 rounded-xl sm:rounded-2xl leading-5 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 focus:bg-white/90 transition-all duration-300 text-sm sm:text-base"
                />
              </form>
            </div>

            {/* Desktop Right side */}
            <div className="hidden md:flex items-center space-x-2 lg:space-x-3">
              {user ? (
                <>
                  {/* Ask Question Button */}
                  <button
                    onClick={onAskQuestion}
                    className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white px-4 lg:px-6 py-2 lg:py-2.5 rounded-xl lg:rounded-2xl text-sm font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                  >
                    Ask Question
                  </button>

                  {/* Notifications */}
                  <div className="relative">
                    <button
                      onClick={() => setShowNotifications(!showNotifications)}
                      className="relative p-2.5 lg:p-3 text-gray-600 hover:text-gray-900 hover:bg-gray-100/80 rounded-xl lg:rounded-2xl transition-all duration-300"
                    >
                      <Bell className="h-5 w-5" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 h-5 w-5 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full flex items-center justify-center font-semibold animate-pulse">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </button>
                    {showNotifications && (
                      <NotificationDropdown onClose={() => setShowNotifications(false)} />
                    )}
                  </div>

                  {/* User Menu */}
                  <div className="flex items-center space-x-2 lg:space-x-3 bg-gray-50/80 backdrop-blur-sm rounded-xl lg:rounded-2xl px-3 lg:px-4 py-2 border border-gray-200/50">
                    <button
                      onClick={onProfile}
                      className="flex items-center space-x-2 text-sm hover:bg-gray-100/80 rounded-lg px-2 py-1 transition-all duration-300"
                    >
                      <div className="w-7 h-7 lg:w-8 lg:h-8 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                        <User className="h-3.5 w-3.5 lg:h-4 lg:w-4 text-white" />
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="text-gray-900 font-semibold text-xs lg:text-sm">{user.username}</span>
                        <div className="flex items-center space-x-1 text-xs text-gray-500">
                          <Award className="h-2.5 w-2.5" />
                          <span>{user.reputation} • {user.badge}</span>
                        </div>
                      </div>
                    </button>
                    <button
                      onClick={logout}
                      className="p-1.5 lg:p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg lg:rounded-xl transition-all duration-300"
                      title="Logout"
                    >
                      <LogOut className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
                    </button>
                  </div>
                </>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white px-4 lg:px-6 py-2 lg:py-2.5 rounded-xl lg:rounded-2xl text-sm font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  Sign In
                </button>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center space-x-2">
              {user && (
                <div className="relative">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100/80 rounded-lg transition-all duration-300"
                  >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 h-4 w-4 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full flex items-center justify-center font-semibold animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>
                  {showNotifications && (
                    <NotificationDropdown onClose={() => setShowNotifications(false)} />
                  )}
                </div>
              )}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100/80 rounded-lg transition-all duration-300"
              >
                {showMobileMenu ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {showMobileMenu && (
            <div className="md:hidden border-t border-gray-200/50 py-4 space-y-4 bg-white/95 backdrop-blur-xl">
              {/* Mobile Search */}
              <form onSubmit={handleSearch} className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search questions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-12 pr-4 py-3 bg-gray-50/80 border border-gray-200/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </form>

              {user ? (
                <div className="space-y-3">
                  <button
                    onClick={() => {
                      onAskQuestion();
                      setShowMobileMenu(false);
                    }}
                    className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300"
                  >
                    Ask Question
                  </button>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50/80 rounded-xl">
                    <button
                      onClick={() => {
                        onProfile();
                        setShowMobileMenu(false);
                      }}
                      className="flex items-center space-x-3 flex-1"
                    >
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-white" />
                      </div>
                      <div className="text-left">
                        <div className="font-semibold text-gray-900">{user.username}</div>
                        <div className="text-sm text-gray-500 flex items-center space-x-1">
                          <Award className="h-3 w-3" />
                          <span>{user.reputation} reputation • {user.badge}</span>
                        </div>
                      </div>
                    </button>
                    <button
                      onClick={() => {
                        logout();
                        setShowMobileMenu(false);
                      }}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-300"
                    >
                      <LogOut className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setShowAuthModal(true);
                    setShowMobileMenu(false);
                  }}
                  className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300"
                >
                  Sign In
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}
    </>
  );
};

export default Header;