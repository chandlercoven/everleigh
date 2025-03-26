// Main VoiceChat component that combines all subcomponents
import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';

import { useVoiceChatStore } from '../../lib/store';
import VoiceChatPanel from './VoiceChatPanel';
import VoiceChatRecorder from './VoiceChatRecorder';
import VoiceChatResponse from './VoiceChatResponse';
import VoiceChatWorkflow from './VoiceChatWorkflow';
import LiveKitIntegration from './LiveKitIntegration';

const VoiceChat = ({ isVisible, onToggle }) => {
  const router = useRouter();
  const { data: session } = useSession();
  const panelRef = useRef(null);
  
  const {
    conversationId,
    setConversationId,
  } = useVoiceChatStore();
  
  // Set conversation ID from URL if provided
  useEffect(() => {
    if (router.query.conversationId) {
      setConversationId(router.query.conversationId);
    }
  }, [router.query.conversationId, setConversationId]);

  // Main view for the voice chat component
  return (
    <div 
      className={`voice-chat-container ${isVisible ? 'visible' : 'hidden'}`}
      aria-hidden={!isVisible}
    >
      <VoiceChatPanel ref={panelRef}>
        <LiveKitIntegration session={session} />
        <VoiceChatResponse />
        <VoiceChatRecorder panelRef={panelRef} />
        <VoiceChatWorkflow />
      </VoiceChatPanel>
    </div>
  );
};

export default VoiceChat; 