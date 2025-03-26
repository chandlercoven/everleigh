import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import {
  LiveKitRoom,
  VideoConference,
} from '@livekit/components-react';
import '@livekit/components-styles';
import { useVoiceChatStore, usePreferencesStore } from '../lib/store';
import { getSmartDate } from '../lib/date-utils';

const ModernVoiceChat = ({ isVisible, onToggle }) => {
  const router = useRouter();
  const { data: session } = useSession();
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const panelRef = useRef(null);
  const audioFeedbackRef = useRef(null);
  const touchStartYRef = useRef(0);
  const touchDeltaYRef = useRef(0);
  
  // Use the Zustand store for state management
  const {
    isRecording,
    isProcessing,
    message,
    response,
    error,
    conversationId,
    showWorkflowPanel,
    selectedWorkflow,
    workflowData,
    isWorkflowTriggering,
    workflowStatus,
    setIsRecording,
    setIsProcessing,
    setMessage,
    setResponse,
    setError,
    setConversationId,
    resetState,
    clearError,
    toggleWorkflowPanel,
    setSelectedWorkflow,
    setWorkflowData,
    triggerWorkflow,
    processMessage
  } = useVoiceChatStore();
  
  // Get theme preferences
  const { theme, uiPreferences } = usePreferencesStore();
  
  const [token, setToken] = useState('');
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [waveformHeights, setWaveformHeights] = useState([0, 0, 0, 0, 0]);
  const [panelTransform, setPanelTransform] = useState('translate-y-0');
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  
  // Available workflow types
  const workflowTypes = ['weather', 'calendar', 'reminder', 'email'];

  // Check for reduced motion preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mediaQuery.matches);
      
      const handleChange = (e) => {
        setPrefersReducedMotion(e.matches);
      };
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, []);

  // Animate waveform when recording
  useEffect(() => {
    if (isRecording && !prefersReducedMotion) {
      let animationFrame;
      const animateWaveform = () => {
        setWaveformHeights(
          Array(5).fill().map(() => Math.max(4, Math.floor(Math.random() * 24)))
        );
        animationFrame = requestAnimationFrame(animateWaveform);
      };
      animationFrame = requestAnimationFrame(animateWaveform);
      
      return () => {
        if (animationFrame) {
          cancelAnimationFrame(animationFrame);
        }
      };
    }
  }, [isRecording, prefersReducedMotion]);

  // Handle haptic feedback and sound effects
  useEffect(() => {
    // Initialize audio elements for feedback
    if (typeof window !== 'undefined') {
      audioFeedbackRef.current = {
        startRecording: new Audio('/audio/start-recording.mp3'),
        stopRecording: new Audio('/audio/stop-recording.mp3'),
        error: new Audio('/audio/error.mp3'),
        success: new Audio('/audio/success.mp3')
      };
      
      // Preload audio
      Object.values(audioFeedbackRef.current).forEach(audio => {
        audio.load();
        audio.volume = 0.5;
      });
    }
  }, []);

  // Effect for haptic feedback on recording state change
  useEffect(() => {
    if (isRecording) {
      // Vibration API for haptic feedback
      if (navigator.vibrate && !prefersReducedMotion) {
        navigator.vibrate(100);
      }
      
      // Sound effect
      if (audioFeedbackRef.current?.startRecording && !prefersReducedMotion) {
        audioFeedbackRef.current.startRecording.play().catch(e => console.error('Error playing audio', e));
      }
    } else if (isRecording === false && mediaRecorderRef.current) {
      // When stopping recording (not initial state)
      
      // Vibration API for haptic feedback - double pulse
      if (navigator.vibrate && !prefersReducedMotion) {
        navigator.vibrate([100, 50, 100]);
      }
      
      // Sound effect
      if (audioFeedbackRef.current?.stopRecording && !prefersReducedMotion) {
        audioFeedbackRef.current.stopRecording.play().catch(e => console.error('Error playing audio', e));
      }
    }
  }, [isRecording, prefersReducedMotion]);

  // Play success sound when response is received
  useEffect(() => {
    if (response && !isProcessing && audioFeedbackRef.current?.success && !prefersReducedMotion) {
      audioFeedbackRef.current.success.play().catch(e => console.error('Error playing audio', e));
    }
  }, [response, isProcessing, prefersReducedMotion]);

  // Play error sound when error occurs
  useEffect(() => {
    if (error && audioFeedbackRef.current?.error && !prefersReducedMotion) {
      audioFeedbackRef.current.error.play().catch(e => console.error('Error playing audio', e));
    }
  }, [error, prefersReducedMotion]);

  useEffect(() => {
    // Fetch a LiveKit token for the user
    const getToken = async () => {
      try {
        // Check if session exists and has user data
        if (!session || !session.user) {
          console.warn('No active session or user data found for token generation');
          setToken(''); // Clear any existing token
          return; // Don't proceed with token generation for unauthenticated users
        }
        
        // Use optional chaining to safely access user properties
        const username = session?.user?.name || session?.user?.email || 'anonymous_' + Math.floor(Math.random() * 10000);
        console.log(`Attempting to get LiveKit token for user: ${username}`);
        
        const response = await fetch('/api/get-livekit-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username,
            room: 'everleigh-voice-room',
          }),
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`Failed to get token: ${response.status} ${errorData.error || ''}`);
        }
        
        const data = await response.json();
        setToken(data.token);
        console.log('LiveKit token obtained successfully');
      } catch (error) {
        console.error('Error fetching token:', error);
        setError(`Failed to connect to voice service: ${error.message}`);
      }
    };

    getToken();
    
    // Get conversation ID from URL if provided
    if (router.query.conversationId) {
      setConversationId(router.query.conversationId);
    }
  }, [session, router.query.conversationId, setConversationId, setError]);

  // Start voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        await processAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      setError('Failed to access microphone');
    }
  };

  // Stop voice recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsProcessing(true);
    }
  };

  // Process recorded audio
  const processAudio = async (audioBlob) => {
    try {
      // Create a form to send the audio file
      const formData = new FormData();
      formData.append('audio', audioBlob);

      // Transcribe the audio
      const transcribeResponse = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!transcribeResponse.ok) {
        throw new Error('Failed to transcribe audio');
      }

      const transcribeData = await transcribeResponse.json();
      const transcribedText = transcribeData.data.transcription;
      
      // Process the transcribed text using our Zustand action
      try {
        const processData = await processMessage(transcribedText);
        
        // Update URL with conversation ID without reloading page
        if (processData.conversationId) {
          router.push(
            {
              pathname: router.pathname,
              query: { ...router.query, conversationId: processData.conversationId }
            },
            undefined,
            { shallow: true }
          );
        }

        // Convert the response to speech
        const audioResponse = await fetch('/api/text-to-speech', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: processData.response,
          }),
        });

        if (!audioResponse.ok) {
          throw new Error('Failed to convert response to speech');
        }

        // Play the audio response
        const audioBlob = await audioResponse.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audio.play();
      } catch (error) {
        if (error.message === 'Please sign in to use voice features') {
          setError(error.message);
        } else {
          throw error;
        }
      }
    } catch (error) {
      console.error('Error processing audio:', error);
      setError('Error processing your message');
    } finally {
      setIsProcessing(false);
    }
  };

  // View conversation history
  const viewConversationHistory = () => {
    if (conversationId) {
      router.push(`/conversations/${conversationId}`);
    } else {
      router.push('/conversations');
    }
  };

  // Handle workflow data input
  const handleWorkflowDataChange = (e) => {
    setWorkflowData(e.target.value);
  };

  // Toggle panel open/closed state
  const togglePanel = () => {
    setIsPanelOpen(!isPanelOpen);
  };
  
  // Swipe gesture handling
  const handleTouchStart = (e) => {
    touchStartYRef.current = e.touches[0].clientY;
    touchDeltaYRef.current = 0;
  };
  
  const handleTouchMove = (e) => {
    const currentY = e.touches[0].clientY;
    touchDeltaYRef.current = currentY - touchStartYRef.current;
    
    // Only allow downward swipe when panel is open
    if (isPanelOpen && touchDeltaYRef.current > 0) {
      // Limit the drag to 200px
      const translateY = Math.min(touchDeltaYRef.current, 200);
      setPanelTransform(`translateY(${translateY}px)`);
      e.preventDefault();
    }
  };
  
  const handleTouchEnd = () => {
    // If dragged more than 100px down, close the panel
    if (touchDeltaYRef.current > 100) {
      setIsPanelOpen(false);
    }
    
    // Reset transform
    setPanelTransform('translate-y-0');
  };

  return (
    <div className="relative h-full">
      {/* Main content area */}
      <div className="pb-24 md:pb-32">
        {/* Page content here if needed */}
      </div>
      
      {/* Voice Interaction Panel - Mobile-first bottom sheet */}
      <div 
        ref={panelRef}
        className={`fixed bottom-0 left-0 right-0 z-50 
        ${!prefersReducedMotion ? 'transition-all duration-300 ease-out' : ''}
        ${isPanelOpen ? 'translate-y-0' : 'translate-y-full'}
        md:left-auto md:max-w-md md:right-4 md:bottom-4 md:rounded-xl 
        bg-white dark:bg-gray-800 shadow-xl rounded-t-2xl overflow-hidden
        dark:shadow-[0_-4px_20px_rgba(0,0,0,0.3)]`}
        style={{ transform: isPanelOpen ? panelTransform : 'translateY(100%)' }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="voicePanelTitle"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Handle/Drag Indicator */}
        <div className="flex justify-center pt-2 pb-1">
          <button 
            onClick={togglePanel}
            className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full mb-2"
            aria-label={isPanelOpen ? "Minimize voice panel" : "Expand voice panel"}
          />
        </div>
        
        {/* Panel Header */}
        <div className="px-4 py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 dark:from-indigo-800 dark:to-indigo-700">
          <div className="flex justify-between items-center">
            <h2 id="voicePanelTitle" className="text-xl font-semibold text-white">Voice Assistant</h2>
            <div className="flex space-x-2">
              <button 
                onClick={viewConversationHistory}
                className="p-2 h-10 w-10 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-colors"
                aria-label="View conversation history"
                disabled={!conversationId}
              >
                <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                  <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                </svg>
              </button>
              <button 
                onClick={toggleWorkflowPanel}
                className="p-2 h-10 w-10 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-colors"
                aria-label={showWorkflowPanel ? "Hide workflows" : "Show workflows"}
              >
                <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        {/* Error Messages */}
        {error && (
          <div className="px-4 py-3 mb-1 bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 dark:border-red-500 text-red-700 dark:text-red-200">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{error}</p>
              <button 
                onClick={clearError}
                className="p-1 h-6 w-6 rounded-full bg-red-200 dark:bg-red-800 text-red-700 dark:text-red-200 hover:bg-red-300 dark:hover:bg-red-700 transition-colors"
                aria-label="Dismiss error"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        )}
        
        {/* Panel Body with Max Height and Scrolling */}
        <div className="max-h-[70vh] md:max-h-[60vh] overflow-y-auto">
          {/* Conversation Content */}
          {(message || response) && (
            <div className="p-4 space-y-4" aria-live="polite">
              {message && (
                <div className="ml-auto max-w-[85%] bg-indigo-100 dark:bg-indigo-900/60 p-3 rounded-2xl rounded-tr-sm">
                  <div className="flex items-center mb-1">
                    <p className="text-xs font-medium text-indigo-600 dark:text-indigo-300">You</p>
                  </div>
                  <p className="text-gray-800 dark:text-gray-100">{message}</p>
                </div>
              )}
              
              {isProcessing && (
                <div className="mr-auto max-w-[85%] bg-white dark:bg-gray-700 p-3 rounded-2xl rounded-tl-sm">
                  <div className="flex items-center mb-1">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Assistant</p>
                  </div>
                  <div className="flex space-x-1 items-end py-2">
                    <div className={`bg-indigo-500 dark:bg-indigo-400 h-2 w-2 rounded-full ${!prefersReducedMotion ? 'animate-bounce' : ''}`} style={{ animationDelay: '0ms' }}></div>
                    <div className={`bg-indigo-500 dark:bg-indigo-400 h-2 w-2 rounded-full ${!prefersReducedMotion ? 'animate-bounce' : ''}`} style={{ animationDelay: '150ms' }}></div>
                    <div className={`bg-indigo-500 dark:bg-indigo-400 h-2 w-2 rounded-full ${!prefersReducedMotion ? 'animate-bounce' : ''}`} style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              )}
              
              {response && !isProcessing && (
                <div className="mr-auto max-w-[85%] bg-white dark:bg-gray-700 p-3 rounded-2xl rounded-tl-sm">
                  <div className="flex items-center mb-1">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Assistant</p>
                  </div>
                  <p className="text-gray-800 dark:text-gray-100 leading-relaxed">{response}</p>
                </div>
              )}
            </div>
          )}
          
          {/* Workflow Panel */}
          {showWorkflowPanel && (
            <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium mb-3 text-gray-900 dark:text-gray-100">Workflows</h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="workflow" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    Select Workflow
                  </label>
                  <select
                    id="workflow"
                    value={selectedWorkflow}
                    onChange={(e) => setSelectedWorkflow(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="">-- Select a workflow --</option>
                    {workflowTypes.map((type) => (
                      <option key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="workflowData" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    Workflow Data
                  </label>
                  <textarea
                    id="workflowData"
                    value={workflowData}
                    onChange={handleWorkflowDataChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder='{"key": "value"} or plain text'
                  />
                </div>
                
                <button
                  onClick={triggerWorkflow}
                  disabled={!selectedWorkflow || !conversationId || isWorkflowTriggering}
                  className={`w-full py-2 px-4 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 text-white font-medium transition-colors ${
                    !selectedWorkflow || !conversationId || isWorkflowTriggering
                    ? 'opacity-50 cursor-not-allowed'
                    : ''
                  }`}
                  aria-busy={isWorkflowTriggering}
                >
                  {isWorkflowTriggering ? 'Triggering...' : 'Trigger Workflow'}
                </button>
                
                {workflowStatus && (
                  <div
                    className={`mt-4 p-3 rounded-lg ${
                      workflowStatus.success
                      ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                      : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                    }`}
                    aria-live="polite"
                  >
                    <p className="font-medium">
                      {workflowStatus.success ? 'Success' : 'Error'}
                    </p>
                    <p>{workflowStatus.message}</p>
                    {workflowStatus.taskId && (
                      <p className="text-sm mt-1">Task ID: {workflowStatus.taskId}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Empty State */}
          {!message && !response && !showWorkflowPanel && (
            <div className="px-4 py-8 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <p className="text-gray-500 dark:text-gray-400 max-w-xs">
                Tap the microphone button below to start speaking with your AI assistant.
              </p>
            </div>
          )}
        </div>
        
        {/* Microphone Control Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="flex flex-col items-center">
            {/* Voice Waveform Animation (only visible when recording) */}
            {isRecording && (
              <div className="flex items-end justify-center h-8 mb-3 space-x-1">
                {waveformHeights.map((height, index) => (
                  <div 
                    key={index}
                    className={`bg-red-500 dark:bg-red-400 w-1.5 rounded-full ${!prefersReducedMotion ? 'transition-all duration-150' : ''}`}
                    style={{ height: `${height}px` }}
                  />
                ))}
              </div>
            )}
            
            {/* Mic Button */}
            <button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isProcessing}
              className={`
                h-14 w-14 rounded-full shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 
                ${!prefersReducedMotion ? 'transition-all duration-300' : ''}
                ${isRecording 
                  ? `bg-red-500 hover:bg-red-600 focus:ring-red-500 ${!prefersReducedMotion ? 'scale-110 animate-pulse' : ''}` 
                  : 'bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 focus:ring-indigo-500'
                }
                ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
                flex items-center justify-center
              `}
              aria-label={isRecording ? "Stop Recording" : "Start Recording"}
            >
              {isRecording ? (
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
              )}
            </button>
            
            {/* Status Text */}
            <p 
              className="mt-3 text-sm text-gray-600 dark:text-gray-400"
              aria-live="polite"
            >
              {isRecording
                ? "Listening... Tap to stop"
                : isProcessing
                ? "Processing your request..."
                : "Tap to speak"}
            </p>
          </div>
        </div>
      </div>
      
      {/* LiveKit room (hidden) */}
      {token && (
        <div className="hidden">
          <LiveKitRoom
            serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
            token={token}
            connect={true}
            connectOptions={{ autoSubscribe: true }}
          >
            <VideoConference />
          </LiveKitRoom>
        </div>
      )}
    </div>
  );
};

export default ModernVoiceChat; 