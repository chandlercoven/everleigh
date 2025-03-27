// Main VoiceChat component that combines all subcomponents
import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';

import { useVoiceChatStore } from '../../lib/store';
import VoiceChatPanel from './VoiceChatPanel';
import VoiceChatRecorder from './VoiceChatRecorder';
import VoiceChatResponse from './VoiceChatResponse';
import VoiceChatWorkflow from './VoiceChatWorkflow';
import LiveKitIntegration from './LiveKitIntegration';

// Memory-efficient error boundary
const SafeComponent = ({ children, fallback = null }) => {
  const [hasError, setHasError] = useState(false);
  
  if (hasError) {
    return fallback;
  }
  
  try {
    return children;
  } catch (error) {
    console.error("Component error:", error);
    setHasError(true);
    return fallback;
  }
};

const VoiceChat = ({ isVisible = true, onToggle }) => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const panelRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  
  const {
    conversationId,
    setConversationId,
    setError,
  } = useVoiceChatStore();
  
  // Set conversation ID from URL if provided
  useEffect(() => {
    if (router.query && router.query.conversationId) {
      setConversationId(router.query.conversationId);
    }
  }, [router.query, setConversationId]);
  
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

  // Main view for the voice chat component
  return (
    <div 
      className={`voice-chat-container ${isVisible ? 'visible' : 'hidden'}`}
      aria-hidden={!isVisible}
    >
      <SafeComponent fallback={
        <div className="p-4 text-red-500">Failed to load voice chat. Please refresh the page.</div>
      }>
        <VoiceChatPanel ref={panelRef}>
          {/* Only render LiveKit component when session is confirmed ready */}
          {isReady && session && (
            <SafeComponent>
              <LiveKitIntegration session={session} />
            </SafeComponent>
          )}
          <VoiceChatResponse />
          <VoiceChatRecorder panelRef={panelRef} />
          <VoiceChatWorkflow />
        </VoiceChatPanel>
      </SafeComponent>
    </div>
  );
};

export default VoiceChat; 