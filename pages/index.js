import Head from 'next/head';
import { useState } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import VoiceChat from '../components/VoiceChat';
import AgentWorkflow from '../components/AgentWorkflow';
import { voiceAgentInfo } from '../lib/voiceAgent';
import { useRouter } from 'next/router';

export default function Home() {
  const { data: session } = useSession();
  const [showVoiceChat, setShowVoiceChat] = useState(false);
  const [showWorkflow, setShowWorkflow] = useState(false);
  const router = useRouter();

  return (
    <div className="container">
      <Head>
        <title>Everleigh - Voice AI Project</title>
        <meta name="description" content="Voice AI project using LiveKit" />
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
                {session.user.name || session.user.email}
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
        <h1>Welcome to Everleigh</h1>
        <p>A voice AI project powered by LiveKit</p>

        <div className="features">
          <h2>Capabilities</h2>
          <ul>
            {voiceAgentInfo.capabilities.map((capability, index) => (
              <li key={index}>{capability}</li>
            ))}
          </ul>
        </div>

        <div className="action-buttons">
          <button 
            onClick={() => setShowVoiceChat(!showVoiceChat)}
            className="action-button voice-button"
          >
            {showVoiceChat ? 'Hide Voice Chat' : 'Try Voice Chat'}
          </button>

          <button 
            onClick={() => setShowWorkflow(!showWorkflow)}
            className="action-button workflow-button"
          >
            {showWorkflow ? 'Hide Workflow Test' : 'Try n8n Workflow'}
          </button>
          
          {session && (
            <button 
              onClick={() => router.push('/conversations')}
              className="action-button history-button"
            >
              View Conversation History
            </button>
          )}
        </div>

        {showVoiceChat && <VoiceChat />}
        {showWorkflow && <AgentWorkflow />}
      </main>

      <style jsx>{`
        .container {
          padding: 0;
          max-width: 800px;
          margin: 0 auto;
        }
        
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 2rem;
          border-bottom: 1px solid #eaeaea;
        }
        
        .logo {
          font-size: 1.5rem;
          font-weight: bold;
          color: #0070f3;
        }
        
        .nav-links {
          display: flex;
          gap: 1rem;
        }
        
        .nav-button {
          background: none;
          border: none;
          color: #666;
          cursor: pointer;
          padding: 0.5rem;
          font-size: 0.9rem;
        }
        
        .nav-button:hover {
          color: #0070f3;
          text-decoration: underline;
        }
        
        .user-section {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        
        .user-name {
          font-size: 0.9rem;
          color: #666;
        }
        
        .sign-in-button, .sign-out-button {
          padding: 0.5rem 1rem;
          border-radius: 4px;
          font-size: 0.9rem;
          cursor: pointer;
          border: none;
        }
        
        .sign-in-button {
          background-color: #0070f3;
          color: white;
        }
        
        .sign-out-button {
          background-color: #f5f5f5;
          color: #333;
          border: 1px solid #ddd;
        }
        
        main {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2rem;
          padding: 2rem;
        }
        
        h1 {
          font-size: 2.5rem;
          margin-bottom: 0.5rem;
        }
        
        .features {
          width: 100%;
          padding: 1.5rem;
          border-radius: 10px;
          background-color: #f5f5f5;
        }
        
        .action-buttons {
          display: flex;
          gap: 1rem;
          margin-top: 1rem;
          flex-wrap: wrap;
          justify-content: center;
        }
        
        .action-button {
          padding: 0.8rem 1.5rem;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          font-size: 1rem;
          transition: background-color 0.3s;
        }
        
        .voice-button {
          background-color: #0070f3;
          color: white;
        }
        
        .voice-button:hover {
          background-color: #0051a2;
        }
        
        .workflow-button {
          background-color: #6200ea;
          color: white;
        }
        
        .workflow-button:hover {
          background-color: #4b00b5;
        }
        
        .history-button {
          background-color: #00c853;
          color: white;
        }
        
        .history-button:hover {
          background-color: #00a846;
        }
      `}</style>
    </div>
  );
} 