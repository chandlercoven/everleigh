import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Head from 'next/head';
import { useConversations, deleteConversation } from '../../lib/swr-api';
import Layout from '../../components/Layout';

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
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>Conversations - Everleigh</title>
      </Head>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6">
          <div className="sm:flex sm:items-center sm:justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Your Conversations</h1>
            <div className="mt-3 sm:mt-0 sm:ml-4">
              <button 
                onClick={handleNewConversation} 
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                New Conversation
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900 border-l-4 border-red-400 p-4 mb-6" role="alert">
              <p className="text-red-700 dark:text-red-200">{error}</p>
            </div>
          )}

          <div className="mb-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                aria-label="Search conversations"
              />
            </div>
          </div>

          {filteredConversations.length === 0 ? (
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg text-center py-12 px-4">
              {searchTerm ? (
                <div>
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No results found</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">No conversations match your search criteria.</p>
                  <div className="mt-6">
                    <button 
                      onClick={() => setSearchTerm('')} 
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Clear search
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No conversations yet</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Start talking to Everleigh to create your first conversation!</p>
                  <div className="mt-6">
                    <button 
                      onClick={handleNewConversation} 
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      New Conversation
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredConversations.map((conversation) => (
                <li key={conversation._id} className="py-4">
                  <div 
                    className="group flex items-start space-x-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded-md transition-colors"
                    onClick={() => handleConversationClick(conversation._id)}
                  >
                    <div className="flex-shrink-0 pt-1">
                      <svg className="h-6 w-6 text-gray-400 group-hover:text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <h2 className="text-lg font-medium text-gray-900 dark:text-white truncate">{conversation.title}</h2>
                        <div className="flex items-center">
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {formatDateTime(conversation.updatedAt)}
                          </span>
                          <button 
                            onClick={(e) => handleDeleteConversation(e, conversation._id)} 
                            className="ml-2 text-gray-400 hover:text-red-500 focus:outline-none p-1"
                            aria-label="Delete conversation"
                          >
                            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center">
                        {conversation.messages.length > 0 ? (
                          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                            <span className="font-medium">
                              {conversation.messages[0].role === 'user' ? 'You: ' : 'Everleigh: '}
                            </span>
                            {conversation.messages[0].content.substring(0, 100)}
                            {conversation.messages[0].content.length > 100 ? '...' : ''}
                          </p>
                        ) : (
                          <p className="text-sm text-gray-500 dark:text-gray-400 italic">No messages</p>
                        )}
                      </div>
                      <div className="mt-1">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                          {conversation.messages.length} messages
                        </span>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Layout>
  );
} 