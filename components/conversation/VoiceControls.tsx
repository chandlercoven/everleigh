import React, { useEffect, useState } from 'react';
import VoiceVisualizer from '../ui/VoiceVisualizer';
import { useVoiceChat } from '../../contexts/VoiceChatContext';

/**
 * VoiceControls - Component for voice recording controls and visualization
 * Uses VoiceChatContext for state management instead of props
 */
const VoiceControls: React.FC = () => {
  const { 
    isRecording, 
    isProcessing, 
    toggleRecording,
    getAudioLevel
  } = useVoiceChat();
  
  const [audioLevel, setAudioLevel] = useState<number>(0);
  
  // Update audio level when recording
  useEffect(() => {
    if (isRecording) {
      const interval = setInterval(() => {
        const level = getAudioLevel();
        setAudioLevel(level);
      }, 100);
      
      return () => clearInterval(interval);
    } else {
      setAudioLevel(0);
    }
  }, [isRecording, getAudioLevel]);
  
  return (
    <div className="voice-controls p-4 border-t border-gray-200 dark:border-gray-700">
      {/* Recording visualizer */}
      <div className="mb-4 flex justify-center">
        <VoiceVisualizer 
          isActive={isRecording} 
          audioLevel={audioLevel}
          status={isRecording ? 'recording' : isProcessing ? 'processing' : 'idle'}
        />
      </div>
      
      {/* Status indicator */}
      <div className="text-center mb-2 text-sm">
        {isProcessing && (
          <span className="text-blue-500 dark:text-blue-400 animate-pulse">
            Processing your message...
          </span>
        )}
        {isRecording && (
          <span className="text-red-500 dark:text-red-400">
            Listening... Tap to stop
          </span>
        )}
      </div>
      
      {/* Record button */}
      <div className="flex justify-center">
        <button
          type="button"
          onClick={toggleRecording}
          disabled={isProcessing}
          className={`
            record-button
            flex-shrink-0
            rounded-full
            w-12
            h-12
            flex
            items-center
            justify-center
            transition-all
            ${isRecording ? 'bg-red-500 dark:bg-red-600' : 'bg-blue-500 dark:bg-blue-600'}
            disabled:opacity-50
            disabled:cursor-not-allowed
          `}
          aria-label={isRecording ? 'Stop recording' : 'Start recording'}
        >
          {isRecording ? (
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <rect x="6" y="6" width="12" height="12" strokeWidth="2" />
            </svg>
          ) : (
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
};

export default VoiceControls; 