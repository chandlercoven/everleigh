import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import VoiceChat from '../components/VoiceChat/index';
import VoiceLabChat from '../components/VoiceLabChat';
import AgentWorkflow from '../components/AgentWorkflow';
import { voiceAgentInfo } from '../lib/voiceAgent';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import type { NextPage } from 'next';

/**
 * Home - Main landing page of the application
 */
const Home: NextPage = () => {
  const { data: session } = useSession();
  const [showVoiceChat, setShowVoiceChat] = useState<boolean>(false);
  const [showLabChat, setShowLabChat] = useState<boolean>(true);
  const [showWorkflow, setShowWorkflow] = useState<boolean>(false);
  const [isBrowser, setIsBrowser] = useState<boolean>(false);
  
  // Initialize router only on client side
  const router = typeof window !== 'undefined' ? useRouter() : null;
  
  // Client-side initialization
  useEffect(() => {
    setIsBrowser(true);
  }, []);
  
  // Navigate to conversation page - client-side only
  const navigateToConversation = () => {
    if (router) {
      router.push('/conversation');
    } else if (isBrowser) {
      window.location.href = '/conversation';
    }
  };
  
  // Navigate to conversations history page - client-side only
  const navigateToHistory = () => {
    if (router) {
      router.push('/conversations');
    } else if (isBrowser) {
      window.location.href = '/conversations';
    }
  };

  return (
    <Layout>
      <Head>
        <title>Everleigh - Voice AI Lab</title>
        <meta name="description" content="Voice AI project using LiveKit and Eleven Labs" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Everleigh Voice AI Lab</h1>
          <p className="text-lg text-gray-500 dark:text-gray-400 mb-8">Test voice interactions with animated speaking visualizations</p>

          <div className="flex flex-wrap gap-4 mb-8">
            <button 
              onClick={() => {
                setShowLabChat(!showLabChat);
                if (!showLabChat) {
                  setShowVoiceChat(false);
                  setShowWorkflow(false);
                }
              }}
              className={`px-4 py-2 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500
                ${showLabChat 
                  ? 'bg-orange-600 text-white hover:bg-orange-700' 
                  : 'bg-white text-orange-600 border border-orange-600 hover:bg-orange-50'}`}
              aria-pressed={showLabChat}
            >
              {showLabChat ? 'Hide Lab Interface' : 'Show Lab Interface'}
            </button>

            <button 
              onClick={navigateToConversation}
              className="px-4 py-2 rounded-md font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Try New Conversational UI
            </button>

            {session && (
              <>
                <button 
                  onClick={() => {
                    setShowVoiceChat(!showVoiceChat);
                    if (!showVoiceChat) {
                      setShowLabChat(false);
                      setShowWorkflow(false);
                    }
                  }}
                  className={`px-4 py-2 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
                    ${showVoiceChat 
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                      : 'bg-white text-indigo-600 border border-indigo-600 hover:bg-indigo-50'}`}
                  aria-pressed={showVoiceChat}
                >
                  {showVoiceChat ? 'Hide Voice Chat' : 'Try Voice Chat'}
                </button>

                <button 
                  onClick={() => {
                    setShowWorkflow(!showWorkflow);
                    if (!showWorkflow) {
                      setShowVoiceChat(false);
                      setShowLabChat(false);
                    }
                  }}
                  className={`px-4 py-2 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500
                    ${showWorkflow 
                      ? 'bg-purple-600 text-white hover:bg-purple-700' 
                      : 'bg-white text-purple-600 border border-purple-600 hover:bg-purple-50'}`}
                  aria-pressed={showWorkflow}
                >
                  {showWorkflow ? 'Hide Workflow Test' : 'Try n8n Workflow'}
                </button>
                
                <button 
                  onClick={navigateToHistory}
                  className="px-4 py-2 rounded-md font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                >
                  View Conversation History
                </button>
              </>
            )}
          </div>

          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            {showLabChat && <VoiceLabChat />}
            {showVoiceChat && session && <VoiceChat onToggle={() => setShowVoiceChat(!showVoiceChat)} />}
            {showWorkflow && session && <AgentWorkflow />}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Home; 