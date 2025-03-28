import React from 'react';
import ModernVoiceChat from '../VoiceChat';

/**
 * Props interface for VoicePanel component
 */
interface VoicePanelProps {
  isVisible: boolean;
  onClose: () => void;
}

/**
 * VoicePanel - Component that displays the voice assistant panel
 */
const VoicePanel: React.FC<VoicePanelProps> = ({ isVisible, onClose }) => {
  if (!isVisible) return null;
  
  return (
    <div className="fixed inset-0 z-50 overflow-hidden" aria-labelledby="voice-panel-title" role="dialog" aria-modal="true">
      {/* Overlay */}
      <div className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>
      
      {/* Panel container */}
      <div className="absolute inset-y-0 right-0 max-w-full flex">
        <div className="relative w-screen max-w-md">
          {/* Panel */}
          <div className="h-full flex flex-col py-6 bg-white dark:bg-gray-800 shadow-xl overflow-y-auto">
            {/* Header */}
            <div className="px-4 sm:px-6">
              <div className="flex items-start justify-between">
                <h2 id="voice-panel-title" className="text-lg font-medium text-gray-900 dark:text-white">
                  Voice Assistant
                </h2>
                <button
                  className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  onClick={onClose}
                  aria-label="Close panel"
                >
                  <span className="sr-only">Close panel</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Content */}
            <div className="mt-6 relative flex-1 px-4 sm:px-6">
              <ModernVoiceChat isVisible={isVisible} onToggle={onClose} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoicePanel; 