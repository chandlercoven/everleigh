import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Head from 'next/head';
import { useConversations, deleteConversation } from '../../lib/swr-api';

export default function Conversations() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [filteredConversations, setFilteredConversations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Use SWR hook for data fetching
  const { data, error, isLoading } = useConversations();
  const conversations = data?.conversations || [];

  useEffect(() => {
    // Redirect to login if not authenticated
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    // Filter conversations based on search term
    if (searchTerm.trim() === '') {
      setFilteredConversations(conversations);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = conversations.filter(
        conv => 
          conv.title.toLowerCase().includes(term) || 
          conv.messages.some(msg => msg.content.toLowerCase().includes(term))
      );
      setFilteredConversations(filtered);
    }
  }, [searchTerm, conversations]);

  const handleConversationClick = (id) => {
    router.push(`/conversations/${id}`);
  };

  const handleDeleteConversation = async (e, id) => {
    e.stopPropagation(); // Prevent triggering the click on the conversation card
    
    if (isDeleting) return; // Prevent multiple clicks
    
    if (!window.confirm('Are you sure you want to delete this conversation?')) {
      return;
    }
    
    try {
      setIsDeleting(true);
      await deleteConversation(id);
      // The SWR cache will be updated automatically
    } catch (err) {
      console.error('Error deleting conversation:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleNewConversation = () => {
    router.push('/');
  };

  const formatDateTime = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleString();
  };

  if (status === 'loading' || isLoading) {
    return <div className="loading">Loading conversations...</div>;
  }

  return (
    <div className="container">
      <Head>
        <title>Conversations - Everleigh</title>
      </Head>

      <header>
        <h1>Your Conversations</h1>
        <div className="header-actions">
          <button className="back-button" onClick={() => router.push('/')}>
            Back to Home
          </button>
          <button className="new-button" onClick={handleNewConversation}>
            New Conversation
          </button>
        </div>
      </header>

      {error && <div className="error">{error}</div>}

      <div className="search-container">
        <input
          type="text"
          placeholder="Search conversations..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      {filteredConversations.length === 0 ? (
        <div className="empty-state">
          {searchTerm ? (
            <p>No conversations match your search.</p>
          ) : (
            <>
              <p>You don't have any conversations yet.</p>
              <p>Start talking to Everleigh to create your first conversation!</p>
            </>
          )}
        </div>
      ) : (
        <div className="conversation-list">
          {filteredConversations.map((conversation) => (
            <div 
              key={conversation._id} 
              className="conversation-card"
              onClick={() => handleConversationClick(conversation._id)}
            >
              <div className="conversation-header">
                <h3>{conversation.title}</h3>
                <button 
                  className="delete-button"
                  onClick={(e) => handleDeleteConversation(e, conversation._id)}
                  disabled={isDeleting}
                >
                  Delete
                </button>
              </div>
              <div className="conversation-preview">
                {conversation.messages.length > 0 ? (
                  <>
                    <span className={`message-preview ${conversation.messages[0].role}`}>
                      {conversation.messages[0].role === 'user' ? 'You: ' : 'Everleigh: '}
                      {conversation.messages[0].content.substring(0, 60)}
                      {conversation.messages[0].content.length > 60 ? '...' : ''}
                    </span>
                    <div className="message-count">
                      {conversation.messages.length} messages
                    </div>
                  </>
                ) : (
                  <span className="no-messages">No messages</span>
                )}
              </div>
              <div className="conversation-date">
                {formatDateTime(conversation.updatedAt)}
              </div>
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .container {
          max-width: 800px;
          margin: 0 auto;
          padding: 2rem;
        }
        
        header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }
        
        .header-actions {
          display: flex;
          gap: 1rem;
        }
        
        h1 {
          margin: 0;
        }
        
        .back-button, .new-button {
          padding: 0.5rem 1rem;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.9rem;
        }
        
        .back-button {
          background-color: #f5f5f5;
          border: 1px solid #ddd;
          color: #333;
        }
        
        .new-button {
          background-color: #0070f3;
          border: none;
          color: white;
        }
        
        .search-container {
          margin-bottom: 1.5rem;
        }
        
        .search-input {
          width: 100%;
          padding: 0.8rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 1rem;
        }
        
        .empty-state {
          text-align: center;
          padding: 3rem;
          background-color: #f9f9f9;
          border-radius: 8px;
        }
        
        .conversation-list {
          display: grid;
          gap: 1rem;
        }
        
        .conversation-card {
          padding: 1rem;
          border: 1px solid #eaeaea;
          border-radius: 8px;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .conversation-card:hover {
          background-color: #f5f5f5;
        }
        
        .conversation-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }
        
        .delete-button {
          padding: 0.3rem 0.6rem;
          background-color: #ffebee;
          color: #d32f2f;
          border: 1px solid #ffcdd2;
          border-radius: 4px;
          font-size: 0.8rem;
          cursor: pointer;
        }
        
        .delete-button:hover {
          background-color: #ffcdd2;
        }
        
        .delete-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .conversation-preview {
          margin: 0.5rem 0;
          color: #666;
        }
        
        .message-preview.user {
          color: #0070f3;
        }
        
        .message-preview.assistant {
          color: #6200ea;
        }
        
        .message-count {
          font-size: 0.8rem;
          color: #999;
          margin-top: 0.5rem;
        }
        
        .conversation-date {
          font-size: 0.8rem;
          color: #999;
          text-align: right;
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