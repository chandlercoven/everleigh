/**
 * Zustand-based state management for the application
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { processVoiceMessage, triggerWorkflow } from './swr-api';
import React, { createContext, useContext, ReactNode } from 'react';
import { VoiceChatStore, PreferencesStore, VoiceSettings } from '../types';

/**
 * Interface for workflow status
 */
interface WorkflowStatus {
  success: boolean;
  message: string;
  taskId?: string;
}

/**
 * Extended store type with workflow functionality
 */
interface ExtendedVoiceChatStore extends VoiceChatStore {
  error: Error | string | null;
  showWorkflowPanel: boolean;
  selectedWorkflow: string;
  workflowData: string;
  isWorkflowTriggering: boolean;
  workflowStatus: WorkflowStatus | null;
  resetState: () => void;
  clearError: () => void;
  toggleWorkflowPanel: () => void;
  setSelectedWorkflow: (workflow: string) => void;
  setWorkflowData: (data: string) => void;
  triggerWorkflow: () => Promise<void>;
  setConversationId: (id: string | null) => void;
  setResponse: (response: string) => void;
  setError: (error: Error | string | null) => void;
}

/**
 * Store for managing voice chat state
 */
export const useVoiceChatStore = create<ExtendedVoiceChatStore>(
  persist(
    (set, get) => ({
      // State
      isRecording: false,
      isProcessing: false,
      message: null,
      response: null,
      error: null,
      conversationId: null,
      showWorkflowPanel: false,
      selectedWorkflow: '',
      workflowData: '',
      isWorkflowTriggering: false,
      workflowStatus: null,
      
      // Actions
      setIsRecording: (isRecording: boolean) => set({ isRecording }),
      setIsProcessing: (isProcessing: boolean) => set({ isProcessing }),
      setMessage: (message: string) => set({ message }),
      setResponse: (response: string) => set({ response }),
      setError: (error: Error | string | null) => set({ error }),
      setConversationId: (conversationId: string | null) => set({ conversationId }),
      
      // Reset state
      resetState: () => set({
        isRecording: false,
        isProcessing: false,
        message: null,
        response: null,
        error: null,
        workflowStatus: null,
      }),
      
      // Clear error
      clearError: () => set({ error: null }),
      
      // Workflow actions
      toggleWorkflowPanel: () => {
        const currentState = get().showWorkflowPanel;
        set({ 
          showWorkflowPanel: !currentState,
          // Reset workflow state when closing panel
          ...(currentState ? {
            selectedWorkflow: '',
            workflowData: '',
            workflowStatus: null
          } : {})
        });
      },
      
      setSelectedWorkflow: (workflow: string) => set({ 
        selectedWorkflow: workflow,
        workflowStatus: null 
      }),
      
      setWorkflowData: (data: string) => set({ workflowData: data }),
      
      triggerWorkflow: async () => {
        const { selectedWorkflow, workflowData, conversationId } = get();
        
        if (!selectedWorkflow || !conversationId) {
          set({ error: 'Workflow or conversation not selected' });
          return;
        }
        
        set({ isWorkflowTriggering: true, workflowStatus: null });
        
        try {
          let parsedData: Record<string, any> = {};
          if (workflowData.trim()) {
            try {
              parsedData = JSON.parse(workflowData);
            } catch (e) {
              parsedData = { text: workflowData };
            }
          }
          
          const result = await triggerWorkflow(selectedWorkflow, conversationId, parsedData);
          
          set({ 
            workflowStatus: {
              success: true,
              message: result.message,
              taskId: result.taskId
            },
            isWorkflowTriggering: false
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to trigger workflow';
          set({ 
            workflowStatus: {
              success: false,
              message: errorMessage
            },
            isWorkflowTriggering: false
          });
        }
      },
      
      // Process transcribed message
      processMessage: async (transcribedText: string, conversationId?: string | null) => {
        const currentConversationId = conversationId || get().conversationId;
        
        set({ isProcessing: true, message: transcribedText, error: null });
        
        try {
          const processData = await processVoiceMessage(transcribedText, currentConversationId);
          
          set({ 
            response: processData.response,
            conversationId: processData.conversationId || get().conversationId,
            isProcessing: false
          });
          
          return processData;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Error processing your message';
          set({ 
            error: errorMessage,
            isProcessing: false
          });
          throw error;
        }
      },

      // Used to clear any state when changing screens
      clearState: () => set({
        isRecording: false,
        isProcessing: false,
        message: null,
        response: null,
        error: null,
        conversationId: null,
        showWorkflowPanel: false,
        selectedWorkflow: '',
        workflowData: '',
        isWorkflowTriggering: false,
        workflowStatus: null,
      })
    }),
    {
      name: 'voice-chat-storage',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state: ExtendedVoiceChatStore) => ({
        // Only persist these fields
        conversationId: state.conversationId,
        message: state.message,
        response: state.response
      }),
    }
  )
);

/**
 * Extended preferences store with UI preferences
 */
interface ExtendedPreferencesStore extends PreferencesStore {
  theme: 'light' | 'dark' | 'system';
  uiPreferences: {
    fontSize: 'small' | 'medium' | 'large';
    denseMode: boolean;
    enableAnimations: boolean;
  };
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setUiPreferences: (preferences: Partial<ExtendedPreferencesStore['uiPreferences']>) => void;
  resetPreferences: () => void;
}

/**
 * Store for managing user preferences
 */
export const usePreferencesStore = create<ExtendedPreferencesStore>(
  persist(
    (set) => ({
      // Theme
      theme: 'system' as const,
      
      // Voice settings
      voiceSettings: {
        volume: 1.0,
        speed: 1.0,
        pitch: 1.0,
        voice: 'default',
      },
      
      // UI preferences
      uiPreferences: {
        fontSize: 'medium' as const,
        denseMode: false,
        enableAnimations: true,
      },
      
      // Actions
      setTheme: (theme: 'light' | 'dark' | 'system') => set({ theme }),
      
      updateVoiceSettings: (settings: Partial<VoiceSettings>) => set((state) => ({
        voiceSettings: { ...state.voiceSettings, ...settings }
      })),
      
      setUiPreferences: (preferences: Partial<ExtendedPreferencesStore['uiPreferences']>) => set((state) => ({
        uiPreferences: { ...state.uiPreferences, ...preferences }
      })),
      
      resetPreferences: () => set({
        theme: 'system' as const,
        voiceSettings: {
          volume: 1.0,
          speed: 1.0,
          pitch: 1.0,
          voice: 'default',
        },
        uiPreferences: {
          fontSize: 'medium' as const,
          denseMode: false,
          enableAnimations: true,
        }
      })
    }),
    {
      name: 'user-preferences',
      storage: createJSONStorage(() => localStorage)
    }
  )
);

/**
 * Context and Provider for preferences
 */
const PreferencesContext = createContext<null>(null);

/**
 * Provider props interface
 */
interface PreferencesProviderProps {
  children: ReactNode;
}

/**
 * Provider component for preferences
 */
export const PreferencesProvider = ({ children }: PreferencesProviderProps) => {
  // This is just a wrapper component since we're using zustand
  // and don't actually need React context, but the _app.js expects a provider
  return (
    <PreferencesContext.Provider value={null}>
      {children}
    </PreferencesContext.Provider>
  );
} 