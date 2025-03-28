/**
 * Types for the Voice Chat application
 */

// Message type for conversations
export interface Message {
  id: number;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  emotion?: 'neutral' | 'happy' | 'sad' | 'angry';
}

// Error information structure
export interface ErrorInfo {
  error: Error | null;
  message: string;
  type: string;
  source: string;
  details?: any;
  timestamp?: Date;
}

// Recording status type
export type RecordingStatus = 'inactive' | 'recording' | 'paused' | 'error';

// Voice settings for audio responses
export interface VoiceSettings {
  voice: string;
  speed: number;
  pitch: number;
  volume: number;
  emotion?: string;
}

// Props for VoiceChatProvider
export interface VoiceChatProviderProps {
  children: React.ReactNode;
}

// Return type for useVoiceRecording hook
export interface VoiceRecordingHook {
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  getAudioLevel: () => number;
  recordingStatus: RecordingStatus;
  checkPermissions: () => Promise<boolean>;
}

// Options for useVoiceRecording hook
export interface VoiceRecordingOptions {
  onData: (audioBlob: Blob) => void;
  onStatusChange?: (status: RecordingStatus, details?: any) => void;
  onError?: (error: Error) => void;
  debug?: boolean;
}

// Return type for useConversationManager hook
export interface ConversationManagerHook {
  messages: Message[];
  isTyping: boolean;
  currentEmotion: string;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  addMessage: (text: string, sender: 'user' | 'ai', emotion?: string) => void;
  setIsTyping: (isTyping: boolean) => void;
  detectEmotion: (text: string) => string;
  clearMessages: () => void;
}

// Return type for useAudioResponse hook
export interface AudioResponseHook {
  playAudioResponse: (text: string) => Promise<void>;
  isPlaying: boolean;
  stopAudio: () => void;
}

// Return type for useErrorHandler hook
export interface ErrorHandlerHook {
  errorInfo: ErrorInfo | null;
  handleError: (error: Error, metadata?: Partial<ErrorInfo>) => void;
  handleProcessingError: (error: Error, source: string) => void;
  handlePermissionError: (error: Error, device: string) => void;
  clearErrorState: () => void;
}

// Context value for VoiceChatContext
export interface VoiceChatContextValue {
  isRecording: boolean;
  isProcessing: boolean;
  recordingStatus: RecordingStatus;
  errorInfo: ErrorInfo | null;
  toggleRecording: () => Promise<void>;
  handleSubmit: (text: string) => Promise<void>;
  clearError: () => void;
  conversation: ConversationManagerHook;
  audioResponse: AudioResponseHook;
  getAudioLevel: () => number;
}

// Voice chat store state
export interface VoiceChatStore {
  isRecording: boolean;
  isProcessing: boolean;
  message: string | null;
  response: string | null;
  conversationId: string | null;
  setIsRecording: (isRecording: boolean) => void;
  setIsProcessing: (isProcessing: boolean) => void;
  setMessage: (message: string) => void;
  processMessage: (message: string, conversationId?: string | null) => Promise<void>;
  clearState: () => void;
}

// Preferences store state
export interface PreferencesStore {
  voiceSettings: VoiceSettings;
  updateVoiceSettings: (settings: Partial<VoiceSettings>) => void;
} 