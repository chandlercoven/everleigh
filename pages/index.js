import Head from 'next/head';
import { useState } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import VoiceChat from '../components/VoiceChat';
import VoiceLabChat from '../components/VoiceLabChat';
import AgentWorkflow from '../components/AgentWorkflow';
import { voiceAgentInfo } from '../lib/voiceAgent';
import { useRouter } from 'next/router';

export default function Home() {
  const { data: session } = useSession();
  const [showVoiceChat, setShowVoiceChat] = useState(false);
  const [showLabChat, setShowLabChat] = useState(true);
  const [showWorkflow, setShowWorkflow] = useState(false);
  const router = useRouter();

  return (
    <div className="container">
      <Head>
        <title>Everleigh - Voice AI Lab</title>
        <meta name="description" content="Voice AI project using LiveKit and Eleven Labs" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header className="header">
        <div className="logo">Everleigh</div>
        <nav className="nav-links">
          {session && (
            <button 
              onClick={() => router.push('/conversations')}
              className="nav-button"
            >
              My Conversations
            </button>
          )}
        </nav>
        <div className="auth-buttons">
          {session ? (
            <div className="user-section">
              <span className="user-name">
                {session.user && (session.user.name || session.user.email || 'User')}
              </span>
              <button 
                onClick={() => signOut({ callbackUrl: '/' })} 
                className="sign-out-button"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <button 
              onClick={() => signIn()} 
              className="sign-in-button"
            >
              Sign In
            </button>
          )}
        </div>
      </header>

      <main>
        <h1>Everleigh Voice AI Lab</h1>
        <p>Test voice interactions with animated speaking visualizations</p>

        <div className="action-buttons">
          <button 
            onClick={() => {
              setShowLabChat(!showLabChat);
              if (!showLabChat) {
                setShowVoiceChat(false);
                setShowWorkflow(false);
              }
            }}
            className={`action-button lab-button ${showLabChat ? 'active' : ''}`}
          >
            {showLabChat ? 'Hide Lab Interface' : 'Show Lab Interface'}
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
                className={`action-button voice-button ${showVoiceChat ? 'active' : ''}`}
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
                className={`action-button workflow-button ${showWorkflow ? 'active' : ''}`}
              >
                {showWorkflow ? 'Hide Workflow Test' : 'Try n8n Workflow'}
              </button>
              
              <button 
                onClick={() => router.push('/conversations')}
                className="action-button history-button"
              >
                View Conversation History
              </button>
            </>
          )}
        </div>

        {showLabChat && <VoiceLabChat />}
        {showVoiceChat && session && <VoiceChat />}
        {showWorkflow && session && <AgentWorkflow />}
      </main>

      <style jsx>{`
        .container {
          min-height: 100vh;
          padding: 0 1rem;
          display: flex;
          flex-direction: column;
          background-color: #f9fafb;
        }
        
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem 0;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .logo {
          font-size: 1.5rem;
          font-weight: bold;
          color: #4f46e5;
        }
        
        .nav-links {
          display: flex;
          gap: 1rem;
        }
        
        .nav-button {
          background: none;
          border: none;
          color: #4b5563;
          cursor: pointer;
          font-size: 1rem;
        }
        
        .auth-buttons {
          display: flex;
          align-items: center;
        }
        
        .user-section {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        
        .user-name {
          color: #4b5563;
          font-size: 0.9rem;
        }
        
        .sign-out-button, .sign-in-button {
          padding: 0.5rem 1rem;
          border-radius: 0.375rem;
          font-size: 0.875rem;
          cursor: pointer;
        }
        
        .sign-in-button {
          background-color: #4f46e5;
          color: white;
          border: none;
        }
        
        .sign-out-button {
          background-color: transparent;
          border: 1px solid #d1d5db;
          color: #4b5563;
        }
        
        main {
          flex: 1;
          display: flex;
          flex-direction: column;
          max-width: 1200px;
          margin: 0 auto;
          width: 100%;
          padding: 2rem 0;
        }
        
        h1 {
          margin: 0;
          font-size: 2.5rem;
          font-weight: 800;
          color: #111827;
        }
        
        p {
          margin-top: 0.5rem;
          font-size: 1.25rem;
          color: #6b7280;
        }
        
        .features {
          margin: 2rem 0;
        }
        
        .features h2 {
          font-size: 1.5rem;
          color: #111827;
          margin-bottom: 1rem;
        }
        
        .features ul {
          padding-left: 1.5rem;
        }
        
        .features li {
          margin-bottom: 0.5rem;
          color: #4b5563;
        }
        
        .action-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          margin: 2rem 0;
        }
        
        .action-button {
          padding: 0.75rem 1.5rem;
          border-radius: 0.5rem;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .action-button.active {
          transform: scale(0.98);
        }
        
        .voice-button {
          background-color: #4f46e5;
          color: white;
          border: none;
        }
        
        .voice-button:hover {
          background-color: #4338ca;
        }
        
        .voice-button.active {
          background-color: #3730a3;
        }
        
        .workflow-button {
          background-color: #7c3aed;
          color: white;
          border: none;
        }
        
        .workflow-button:hover {
          background-color: #6d28d9;
        }
        
        .workflow-button.active {
          background-color: #5b21b6;
        }
        
        .history-button {
          background-color: #10b981;
          color: white;
          border: none;
        }
        
        .history-button:hover {
          background-color: #059669;
        }
        
        .lab-button {
          background-color: #f97316;
          color: white;
          border: none;
        }
        
        .lab-button:hover {
          background-color: #ea580c;
        }
        
        .lab-button.active {
          background-color: #c2410c;
        }
      `}</style>
    </div>
  );
} 