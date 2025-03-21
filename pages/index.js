import Head from 'next/head';
import { useState } from 'react';
import VoiceChat from '../components/VoiceChat';
import AgentWorkflow from '../components/AgentWorkflow';
import { voiceAgentInfo } from '../lib/voiceAgent';

export default function Home() {
  const [showVoiceChat, setShowVoiceChat] = useState(false);
  const [showWorkflow, setShowWorkflow] = useState(false);

  return (
    <div className="container">
      <Head>
        <title>Everleigh - Voice AI Project</title>
        <meta name="description" content="Voice AI project using LiveKit" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

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
        </div>

        {showVoiceChat && <VoiceChat />}
        {showWorkflow && <AgentWorkflow />}
      </main>

      <style jsx>{`
        .container {
          padding: 2rem;
          max-width: 800px;
          margin: 0 auto;
        }
        main {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2rem;
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
      `}</style>
    </div>
  );
} 