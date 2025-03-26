/**
 * Zustand-based state management for the application
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { processVoiceMessage, triggerWorkflow } from './swr-api';
import React, { createContext, useContext } from 'react';

/**
 * Store for managing voice chat state
 */
export const useVoiceChatStore = create(
  persist(
    (set, get) => ({
      // State
      isRecording: false,
      isProcessing: false,
      message: '',
      response: '',
      error: null,
      conversationId: null,
      showWorkflowPanel: false,
      selectedWorkflow: '',
      workflowData: '',
      isWorkflowTriggering: false,
      workflowStatus: null,
      
      // Actions
      setIsRecording: (isRecording) => set({ isRecording }),
      setIsProcessing: (isProcessing) => set({ isProcessing }),
      setMessage: (message) => set({ message }),
      setResponse: (response) => set({ response }),
      setError: (error) => set({ error }),
      setConversationId: (conversationId) => set({ conversationId }),
      
      // Reset state
      resetState: () => set({
        isRecording: false,
        isProcessing: false,
        message: '',
        response: '',
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
      
      setSelectedWorkflow: (workflow) => set({ 
        selectedWorkflow: workflow,
        workflowStatus: null 
      }),
      
      setWorkflowData: (data) => set({ workflowData: data }),
      
      triggerWorkflow: async () => {
        const { selectedWorkflow, workflowData, conversationId } = get();
        
        if (!selectedWorkflow || !conversationId) {
          set({ error: 'Workflow or conversation not selected' });
          return;
        }
        
        set({ isWorkflowTriggering: true, workflowStatus: null });
        
        try {
          let parsedData = {};
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
          set({ 
            workflowStatus: {
              success: false,
              message: error.message || 'Failed to trigger workflow'
            },
            isWorkflowTriggering: false
          });
        }
      },
      
      // Process transcribed message
      processMessage: async (transcribedText) => {
        const { conversationId } = get();
        
        set({ isProcessing: true, message: transcribedText, error: null });
        
        try {
          const processData = await processVoiceMessage(transcribedText, conversationId);
          
          set({ 
            response: processData.response,
            conversationId: processData.conversationId || get().conversationId,
            isProcessing: false
          });
          
          return processData;
        } catch (error) {
          set({ 
            error: error.message || 'Error processing your message',
            isProcessing: false
          });
          throw error;
        }
      }
    }),
    {
      name: 'voice-chat-storage',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        // Only persist these fields
        conversationId: state.conversationId,
        message: state.message,
        response: state.response
      }),
    }
  )
);

/**
 * Store for managing user preferences
 */
export const usePreferencesStore = create(
  persist(
    (set) => ({
      // Theme
      theme: 'system', // 'light', 'dark', or 'system'
      
      // Voice settings
      voiceSettings: {
        volume: 1.0,
        rate: 1.0,
        voice: 'default',
      },
      
      // UI preferences
      uiPreferences: {
        fontSize: 'medium', // 'small', 'medium', 'large'
        denseMode: false,
        enableAnimations: true,
      },
      
      // Actions
      setTheme: (theme) => set({ theme }),
      
      setVoiceSettings: (settings) => set((state) => ({
        voiceSettings: { ...state.voiceSettings, ...settings }
      })),
      
      setUiPreferences: (preferences) => set((state) => ({
        uiPreferences: { ...state.uiPreferences, ...preferences }
      })),
      
      resetPreferences: () => set({
        theme: 'system',
        voiceSettings: {
          volume: 1.0,
          rate: 1.0,
          voice: 'default',
        },
        uiPreferences: {
          fontSize: 'medium',
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
const PreferencesContext = createContext(null);

/**
 * Provider component for preferences
 */
export const PreferencesProvider = ({ children }) => {
  // This is just a wrapper component since we're using zustand
  // and don't actually need React context, but the _app.js expects a provider
  return (
    <PreferencesContext.Provider value={null}>
      {children}
    </PreferencesContext.Provider>
  );
}; 