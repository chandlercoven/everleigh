import { useState } from 'react';

const AgentWorkflow = () => {
  const [userMessage, setUserMessage] = useState('');
  const [agentResponse, setAgentResponse] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!userMessage.trim()) return;
    
    setIsLoading(true);
    
    try {
      // Call the API endpoint that would trigger the n8n workflow
      const response = await fetch('/api/process-voice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userMessage }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setAgentResponse(data.data);
      } else {
        console.error('Error processing message:', data.error);
        setAgentResponse({
          response: 'Sorry, I encountered an error processing your request.',
          intent: 'error',
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error calling API:', error);
      setAgentResponse({
        response: 'Sorry, I encountered an error processing your request.',
        intent: 'error',
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="agent-workflow">
      <h2>Agent Workflow Test</h2>
      <p>Test the agent workflow integration with n8n</p>
      
      <form onSubmit={handleSubmit} className="message-form">
        <input
          type="text"
          value={userMessage}
          onChange={(e) => setUserMessage(e.target.value)}
          placeholder="Type a message (e.g., 'What's the weather?' or 'What time is it?')"
          className="message-input"
        />
        <button 
          type="submit" 
          disabled={isLoading || !userMessage.trim()}
          className="send-button"
        >
          {isLoading ? 'Processing...' : 'Send'}
        </button>
      </form>
      
      {agentResponse && (
        <div className="response-container">
          <div className="response-header">
            <span className="intent-label">Intent: {agentResponse.intent}</span>
            <span className="timestamp">{new Date(agentResponse.timestamp).toLocaleTimeString()}</span>
          </div>
          <div className="response-content">
            {agentResponse.response}
          </div>
        </div>
      )}
      
      <style jsx>{`
        .agent-workflow {
          margin-top: 2rem;
          padding: 1.5rem;
          border-radius: 10px;
          background-color: #f8f9fa;
          max-width: 600px;
          width: 100%;
        }
        
        .message-form {
          display: flex;
          margin: 1.5rem 0;
          gap: 0.5rem;
        }
        
        .message-input {
          flex: 1;
          padding: 0.75rem;
          border: 1px solid #e0e0e0;
          border-radius: 4px;
          font-size: 1rem;
        }
        
        .send-button {
          padding: 0.75rem 1.25rem;
          background-color: #0070f3;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 1rem;
          white-space: nowrap;
        }
        
        .send-button:disabled {
          background-color: #99c4f8;
          cursor: not-allowed;
        }
        
        .response-container {
          margin-top: 1.5rem;
          padding: 1rem;
          border-radius: 8px;
          background-color: white;
          border: 1px solid #e0e0e0;
        }
        
        .response-header {
          display: flex;
          justify-content: space-between;
          font-size: 0.85rem;
          color: #666;
          margin-bottom: 0.5rem;
        }
        
        .intent-label {
          font-weight: bold;
          color: #0070f3;
        }
        
        .response-content {
          font-size: 1.1rem;
          line-height: 1.5;
        }
      `}</style>
    </div>
  );
};

export default AgentWorkflow; 