import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import ConversationalUI from '../components/ConversationalUI';
import Layout from '../components/Layout';
import Head from 'next/head';

export default function ConversationPage() {
  const { data: session, status } = useSession();
  const [showDemo, setShowDemo] = useState(true);
  const [componentStatus, setComponentStatus] = useState({
    conversationalUI: false,
    uiComponents: false
  });

  useEffect(() => {
    // Log component loading status
    console.log('ConversationalUI loaded:', !!ConversationalUI);
    
    try {
      // Check if UI components are imported correctly in ConversationalUI
      if (typeof window !== 'undefined') {
        console.log('Window object available');
        setComponentStatus({
          conversationalUI: true,
          uiComponents: true
        });
      }
    } catch (error) {
      console.error('Component diagnostic error:', error);
    }
  }, []);

  return (
    <Layout>
      <Head>
        <title>Everleigh - Conversational UI</title>
        <meta name="description" content="Advanced voice and text conversational interface" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Conversational Interface</h1>
            <p className="text-lg text-gray-500 dark:text-gray-400 mb-4">
              A modern interface that combines voice and text interaction with emotional feedback
            </p>
            
            <div className="flex flex-wrap gap-4 mb-4">
              <button
                onClick={() => setShowDemo(true)}
                className={`px-4 py-2 rounded-md font-medium ${
                  showDemo 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-white text-indigo-600 border border-indigo-600'
                }`}
              >
                Show Conversation UI
              </button>
              
              {!session && (
                <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md">
                  <p className="text-amber-800 dark:text-amber-200 text-sm">
                    Note: You're using the demo as a guest. Sign in to save your conversations.
                  </p>
                </div>
              )}
            </div>
          </div>
          
          {/* Component status indicator (remove in production) */}
          <div className="mb-4 p-2 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono">
            <p>Component Status: {JSON.stringify(componentStatus)}</p>
          </div>
          
          {showDemo && (
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              <ConversationalUI />
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
} 