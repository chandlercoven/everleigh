import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import VoiceChat from '../components/VoiceChat';
import ModernConversationList from '../components/ModernConversationList';
import { usePreferencesStore } from '../lib/store';
import Layout from '../components/Layout';
import Head from 'next/head';

export default function ModernPage() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState('voice');
  const { uiPreferences, setUiPreferences } = usePreferencesStore();
  
  // Handle tab switching
  const handleTabChange = (tab) => {
    setActiveTab(tab);
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
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <Head>
        <title>Modern UI - Everleigh</title>
        <meta name="description" content="Everleigh Voice AI with a modern UI" />
      </Head>
    
      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 ${fontSizeClass}`}>
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden">
          {/* Tab navigation */}
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => handleTabChange('voice')}
              className={`${
                activeTab === 'voice'
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900 dark:bg-opacity-20'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              } flex-1 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-center transition-colors`}
              aria-current={activeTab === 'voice' ? 'page' : undefined}
            >
              Voice Assistant
            </button>
            <button
              onClick={() => handleTabChange('conversations')}
              className={`${
                activeTab === 'conversations'
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900 dark:bg-opacity-20'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              } flex-1 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-center transition-colors`}
              aria-current={activeTab === 'conversations' ? 'page' : undefined}
            >
              Conversations
            </button>
          </div>
          
          {/* Font size controls */}
          <div className="flex justify-end p-2 bg-gray-50 dark:bg-gray-700">
            <div className="flex items-center rounded-md bg-white dark:bg-gray-800 p-1 shadow-sm">
              <span className="text-xs text-gray-500 dark:text-gray-400 mr-2">Text size:</span>
              <button
                onClick={() => handleFontSizeChange('small')}
                className={`p-1 rounded ${uiPreferences.fontSize === 'small' ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300' : 'text-gray-400'}`}
                title="Small text"
                aria-pressed={uiPreferences.fontSize === 'small'}
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9 9a2 2 0 114 0 2 2 0 01-4 0z" clipRule="evenodd" />
                </svg>
              </button>
              <button
                onClick={() => handleFontSizeChange('medium')}
                className={`p-1 rounded ${uiPreferences.fontSize === 'medium' ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300' : 'text-gray-400'}`}
                title="Medium text"
                aria-pressed={uiPreferences.fontSize === 'medium'}
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9 9a2 2 0 114 0 2 2 0 01-4 0z" clipRule="evenodd" />
                </svg>
              </button>
              <button
                onClick={() => handleFontSizeChange('large')}
                className={`p-1 rounded ${uiPreferences.fontSize === 'large' ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300' : 'text-gray-400'}`}
                title="Large text"
                aria-pressed={uiPreferences.fontSize === 'large'}
              >
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9 9a2 2 0 114 0 2 2 0 01-4 0z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Content area */}
          <div className="p-4">
            {/* Require authentication */}
            {!session ? (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <h2 className="mt-2 text-xl font-semibold mb-4">Authentication Required</h2>
                <p className="mb-6 text-gray-500 dark:text-gray-400">Please sign in to access this page.</p>
                <a
                  href="/api/auth/signin"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
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
          </div>
        </div>
      </div>
    </Layout>
  );
} 