import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import VoiceChat from '../components/VoiceChat';
import ModernConversationList from '../components/ModernConversationList';
import { usePreferencesStore } from '../lib/store';

export default function ModernPage() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState('voice');
  const { theme, setTheme, uiPreferences, setUiPreferences } = usePreferencesStore();
  
  // Apply theme on initial load and when theme changes
  useEffect(() => {
    // Apply theme to document
    if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Listen for system theme changes if using system preference
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e) => {
        if (e.matches) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      };
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);
  
  // Handle tab switching
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };
  
  // Handle theme switching
  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
  };
  
  // Handle font size change
  const handleFontSizeChange = (size) => {
    setUiPreferences({ ...uiPreferences, fontSize: size });
  };
  
  // Apply font size class to container
  const fontSizeClass = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg',
  }[uiPreferences.fontSize || 'medium'];
  
  // If loading
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600"></div>
      </div>
    );
  }
  
  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 ${fontSizeClass}`}>
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Everleigh Modern UI</h1>
            
            <div className="flex items-center space-x-4">
              {/* Theme switcher */}
              <div className="relative">
                <select
                  value={theme}
                  onChange={(e) => handleThemeChange(e.target.value)}
                  className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md py-1 px-3 appearance-none cursor-pointer pr-8"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="system">System</option>
                </select>
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              
              {/* Font size selector */}
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => handleFontSizeChange('small')}
                  className={`p-1 rounded ${uiPreferences.fontSize === 'small' ? 'bg-indigo-100 dark:bg-indigo-900' : ''}`}
                  title="Small text"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 12a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                </button>
                <button
                  onClick={() => handleFontSizeChange('medium')}
                  className={`p-1 rounded ${uiPreferences.fontSize === 'medium' ? 'bg-indigo-100 dark:bg-indigo-900' : ''}`}
                  title="Medium text"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 12a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                </button>
                <button
                  onClick={() => handleFontSizeChange('large')}
                  className={`p-1 rounded ${uiPreferences.fontSize === 'large' ? 'bg-indigo-100 dark:bg-indigo-900' : ''}`}
                  title="Large text"
                >
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 12a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              
              {/* User info */}
              {session ? (
                <div className="flex items-center">
                  {session.user.image && (
                    <img
                      src={session.user.image}
                      alt={session.user.name || 'User'}
                      className="w-8 h-8 rounded-full mr-2"
                    />
                  )}
                  <span className="font-medium">
                    {session.user.name || session.user.email}
                  </span>
                </div>
              ) : (
                <a
                  href="/api/auth/signin"
                  className="btn btn-primary"
                >
                  Sign in
                </a>
              )}
            </div>
          </div>
          
          {/* Tab navigation */}
          <div className="mt-4 border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => handleTabChange('voice')}
                className={`${
                  activeTab === 'voice'
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium`}
              >
                Voice Assistant
              </button>
              <button
                onClick={() => handleTabChange('conversations')}
                className={`${
                  activeTab === 'conversations'
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium`}
              >
                Conversations
              </button>
            </nav>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Require authentication */}
        {!session ? (
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-8 text-center">
            <h2 className="text-xl font-semibold mb-4">Authentication Required</h2>
            <p className="mb-6">Please sign in to access this page.</p>
            <a
              href="/api/auth/signin"
              className="btn btn-primary"
            >
              Sign in
            </a>
          </div>
        ) : (
          <>
            {activeTab === 'voice' && <VoiceChat />}
            {activeTab === 'conversations' && <ModernConversationList />}
          </>
        )}
      </main>
    </div>
  );
} 