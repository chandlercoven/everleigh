// Main VoiceChat component that combines all subcomponents
import React, { useEffect, useRef, useState, ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import dynamic from 'next/dynamic';
import { useVoiceChatStore } from '../../lib/store';

// Dynamically import client-side components with SSR disabled
const VoiceChatPanel = dynamic(() => import('./VoiceChatPanel'), { ssr: false });
const VoiceChatRecorder = dynamic(() => import('./VoiceChatRecorder'), { ssr: false });
const VoiceChatResponse = dynamic(() => import('./VoiceChatResponse'), { ssr: false });
const VoiceChatWorkflow = dynamic(() => import('./VoiceChatWorkflow'), { ssr: false });
const LiveKitIntegration = dynamic(() => import('./LiveKitIntegration'), { ssr: false });

/**
 * Props interface for SafeComponent
 */
interface SafeComponentProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Props interface for VoiceChat component
 */
interface VoiceChatProps {
  isVisible?: boolean;
  onToggle?: () => void;
}

/**
 * SafeComponent - Acts as an error boundary for child components
 * To handle potential errors when components load or render
 */
const SafeComponent: React.FC<SafeComponentProps> = ({ children, fallback }) => {
  const [hasError, setHasError] = useState<boolean>(false);
  
  useEffect(() => {
    const handleError = () => {
      setHasError(true);
      console.error('Error in VoiceChat component');
    };
    
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);
  
  if (hasError) {
    return fallback ? <>{fallback}</> : (
      <div className="p-4 bg-red-50 text-red-600 rounded-lg">
        Something went wrong loading this component.
      </div>
    );
  }
  
  return <>{children}</>;
};

/**
 * Create a client-side only wrapper for router-dependent code
 */
const ClientOnly = dynamic(() => 
  Promise.resolve(({ children }: { children: ReactNode }) => <>{children}</>),
  { ssr: false }
);

/**
 * VoiceChat - Main component for voice-based interactions
 * Combines panel, recorder, response handling, and workflow management
 */
const VoiceChat: React.FC<VoiceChatProps> = ({ isVisible = true, onToggle }) => {
  const { data: session, status } = useSession();
  const panelRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState<boolean>(false);
  
  const {
    conversationId,
    setConversationId,
    setError,
  } = useVoiceChatStore();
  
  // Safely handle session readiness with delay to ensure stability
  useEffect(() => {
    if (status === 'authenticated' && session) {
      // Small delay to ensure all React rendering is complete
      const timer = setTimeout(() => {
        setIsReady(true);
      }, 100);
      
      return () => clearTimeout(timer);
    } else {
      setIsReady(false);
    }
  }, [status, session]);

  // Display loading if session status is loading
  if (status === 'loading') {
    return (
      <div className="voice-chat-loading flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-2">Loading voice chat...</span>
      </div>
    );
  }

  // Show auth prompt if not authenticated
  if (status === 'unauthenticated') {
    return (
      <div className="voice-chat-auth p-8 bg-gray-50 rounded-lg text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Voice Chat requires authentication</h3>
        <p className="text-gray-600 mb-6">Please sign in to access voice chat features.</p>
        <a
          href="/api/auth/signin"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Sign in
        </a>
      </div>
    );
  }

  return (
    <div className="voice-chat-container relative bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
      {/* Render voice chat UI only when ready and visible */}
      {isReady && isVisible ? (
        <ClientOnly>
          <SafeComponent>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4" ref={panelRef}>
              {/* Main voice recorder interface */}
              <div className="md:col-span-8 lg:col-span-9">
                <VoiceChatPanel />
                <VoiceChatRecorder />
                <VoiceChatResponse />
              </div>
              
              {/* Workflow sidebar */}
              <div className="md:col-span-4 lg:col-span-3">
                <VoiceChatWorkflow />
              </div>
            </div>
            
            {/* LiveKit real-time communication */}
            <SafeComponent
              fallback={
                <div className="p-4 text-amber-600 bg-amber-50 rounded-md">
                  Audio streaming unavailable. Please refresh the page.
                </div>
              }
            >
              <LiveKitIntegration />
            </SafeComponent>
          </SafeComponent>
        </ClientOnly>
      ) : (
        <div className="flex items-center justify-center p-8">
          <div className="animate-pulse text-gray-400 dark:text-gray-600">
            Voice chat initializing...
          </div>
        </div>
      )}
    </div>
  );
};

// Export VoiceChat as a client-only component
export default dynamic(() => Promise.resolve(VoiceChat), { ssr: false }); 