import { useConversations, deleteConversation, createConversation } from '../lib/swr-api';
import { useVoiceChatStore } from '../lib/store';
import { getSmartDate } from '../lib/date-utils';
import { useState } from 'react';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

// Define validation schema
const newConversationSchema = z.object({
  title: z.string().min(1, { message: 'Title is required' }).max(100)
});

const ModernConversationList = () => {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [isCreating, setIsCreating] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const setConversationId = useVoiceChatStore((state) => state.setConversationId);
  
  // Initialize form with validation
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(newConversationSchema),
    defaultValues: {
      title: ''
    }
  });

  // Fetch conversations with SWR
  const { data, error, isLoading, mutate } = useConversations({ page, limit: 10 });

  // Handle creating a new conversation
  const onCreateConversation = async (formData) => {
    setIsCreating(true);
    try {
      const conversation = await createConversation(formData.title);
      await mutate(); // Refresh the list
      setShowNewForm(false);
      reset();
      
      // Navigate to the new conversation
      router.push(`/conversations/${conversation._id}`);
    } catch (error) {
      console.error('Failed to create conversation:', error);
    } finally {
      setIsCreating(false);
    }
  };

  // Handle deleting a conversation
  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this conversation?')) {
      return;
    }
    
    try {
      await deleteConversation(id);
      await mutate(); // Refresh the list
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
  };

  // Handle selecting a conversation
  const handleSelect = (id) => {
    setConversationId(id);
    router.push(`/conversations/${id}`);
  };

  // Handle pagination
  const handleNextPage = () => {
    if (data && page < data.totalPages) {
      setPage(page + 1);
    }
  };

  const handlePrevPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="p-4">
        <div className="animate-pulse">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-gray-200 dark:bg-gray-700 h-16 mb-2 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="p-4 text-red-500">
        Error loading conversations: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold">Conversations</h1>
        <button 
          className="btn btn-primary"
          onClick={() => setShowNewForm(!showNewForm)}
        >
          {showNewForm ? 'Cancel' : 'New Conversation'}
        </button>
      </div>

      {/* New conversation form */}
      {showNewForm && (
        <form 
          onSubmit={handleSubmit(onCreateConversation)} 
          className="card mb-4 p-4"
        >
          <div className="mb-2">
            <label htmlFor="title" className="block text-sm font-medium mb-1">
              Conversation Title
            </label>
            <input
              id="title"
              type="text"
              className={`w-full px-3 py-2 border rounded-md ${
                errors.title ? 'border-red-500' : 'border-gray-300'
              }`}
              {...register('title')}
              placeholder="Enter a title for your conversation"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isCreating}
              className="btn btn-primary"
            >
              {isCreating ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      )}

      {/* Conversations list */}
      {data?.conversations && data.conversations.length > 0 ? (
        <div className="space-y-2">
          {data.conversations.map((conversation) => (
            <div 
              key={conversation._id} 
              className="card hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
            >
              <div 
                className="flex justify-between items-center"
                onClick={() => handleSelect(conversation._id)}
              >
                <div>
                  <h3 className="font-medium">{conversation.title}</h3>
                  <p className="text-sm text-gray-500">
                    {conversation.messages.length} messages • 
                    Last updated {getSmartDate(conversation.updatedAt)}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(conversation._id);
                  }}
                  className="text-red-500 hover:text-red-700 p-2"
                  aria-label="Delete conversation"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-8 text-center text-gray-500">
          <p>No conversations found.</p>
          <button 
            onClick={() => setShowNewForm(true)}
            className="mt-2 text-indigo-600 hover:text-indigo-800"
          >
            Create your first conversation
          </button>
        </div>
      )}

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex justify-between items-center mt-4">
          <button
            onClick={handlePrevPage}
            disabled={page === 1}
            className={`btn ${page === 1 ? 'bg-gray-300 cursor-not-allowed' : 'btn-secondary'}`}
          >
            Previous
          </button>
          <span>
            Page {page} of {data.totalPages}
          </span>
          <button
            onClick={handleNextPage}
            disabled={page === data.totalPages}
            className={`btn ${page === data.totalPages ? 'bg-gray-300 cursor-not-allowed' : 'btn-secondary'}`}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default ModernConversationList; 