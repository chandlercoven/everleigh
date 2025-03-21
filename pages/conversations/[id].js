import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Head from 'next/head';

export default function ConversationDetail() {
  const router = useRouter();
  const { id } = router.query;
  const { data: session, status } = useSession();
  
  const [conversation, setConversation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Redirect to login if not authenticated
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }

    // Fetch conversation if authenticated and ID is available
    if (status === 'authenticated' && id) {
      fetchConversation();
    }
  }, [status, router, id]);

  const fetchConversation = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/conversations/${id}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Conversation not found');
        }
        throw new Error('Failed to load conversation');
      }
      
      const data = await response.json();
      setConversation(data.data.conversation);
    } catch (error) {
      console.error('Error fetching conversation:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleString();
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this conversation?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/conversations/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete conversation');
      }
      
      router.push('/conversations');
    } catch (error) {
      console.error('Error deleting conversation:', error);
      setError(error.message);
    }
  };

  if (status === 'loading' || loading) {
    return <div className="loading">Loading conversation...</div>;
  }

  if (error) {
    return (
      <div className="container">
        <div className="error">{error}</div>
        <button className="back-button" onClick={() => router.push('/conversations')}>
          Back to Conversations
        </button>
      </div>
    );
  }

  if (!conversation) {
    return <div className="loading">Conversation not found</div>;
  }

  return (
    <div className="container">
      <Head>
        <title>{conversation.title} - Everleigh</title>
      </Head>

      <header>
        <div className="title-section">
          <h1>{conversation.title}</h1>
          <div className="conversation-date">
            {formatDateTime(conversation.createdAt)}
          </div>
        </div>
        <div className="action-buttons">
          <button className="back-button" onClick={() => router.push('/conversations')}>
            Back
          </button>
          <button className="delete-button" onClick={handleDelete}>
            Delete
          </button>
        </div>
      </header>

      <div className="messages-container">
        {conversation.messages.map((message, index) => (
          <div 
            key={message.id || index}
            className={`message ${message.role}`}
          >
            <div className="message-header">
              <strong>{message.role === 'user' ? 'You' : 'Everleigh'}</strong>
              <span className="message-time">{formatDateTime(message.createdAt)}</span>
            </div>
            <div className="message-content">{message.content}</div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .container {
          max-width: 800px;
          margin: 0 auto;
          padding: 2rem;
        }
        
        header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 2rem;
        }
        
        .title-section {
          flex: 1;
        }
        
        h1 {
          margin: 0 0 0.5rem 0;
        }
        
        .conversation-date {
          font-size: 0.8rem;
          color: #666;
        }
        
        .action-buttons {
          display: flex;
          gap: 0.5rem;
        }
        
        .back-button, .delete-button {
          padding: 0.5rem 1rem;
          border-radius: 4px;
          cursor: pointer;
        }
        
        .back-button {
          background-color: #f5f5f5;
          border: 1px solid #ddd;
          color: #333;
        }
        
        .delete-button {
          background-color: #ffebee;
          border: 1px solid #ffcdd2;
          color: #d32f2f;
        }
        
        .messages-container {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        
        .message {
          padding: 1rem;
          border-radius: 8px;
          max-width: 75%;
        }
        
        .message.user {
          align-self: flex-end;
          background-color: #e3f2fd;
          border: 1px solid #bbdefb;
        }
        
        .message.assistant {
          align-self: flex-start;
          background-color: #f5f5f5;
          border: 1px solid #e0e0e0;
        }
        
        .message-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.5rem;
        }
        
        .message-time {
          font-size: 0.7rem;
          color: #999;
        }
        
        .message-content {
          white-space: pre-wrap;
        }
        
        .loading {
          text-align: center;
          padding: 2rem;
        }
        
        .error {
          background-color: #ffebee;
          color: #d32f2f;
          padding: 1rem;
          border-radius: 4px;
          margin-bottom: 1rem;
        }
      `}</style>
    </div>
  );
} 