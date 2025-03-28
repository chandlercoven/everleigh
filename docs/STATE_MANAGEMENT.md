# State Management Architecture

This document explains the state management architecture used in the Everleigh application, with a focus on recent improvements.

## Overview

We've implemented a hybrid state management solution that combines:

1. **Zustand Stores** - For global application state
2. **React Context** - For domain-specific state sharing 
3. **Custom Hooks** - For encapsulating related state and logic
4. **Local Component State** - For UI-specific state

This approach provides a good balance between maintainability, performance, and developer experience.

## Key Components

### Custom Hooks

We've created specialized hooks to encapsulate related functionality:

1. **`useConversationManager`** - Manages conversation messages, typing indicators, and emotion detection
   - Located in: `hooks/useConversationManager.js`
   - Responsibilities: Maintains messages array, handles typing states, detects emotions in text

2. **`useAudioResponse`** - Manages text-to-speech functionality
   - Located in: `hooks/useAudioResponse.js`
   - Responsibilities: Voice selection, audio playback, fetching available voices

3. **`useErrorHandler`** - Centralizes error handling
   - Located in: `hooks/useErrorHandler.js`
   - Responsibilities: Error categorization, uniform error object structure, error logging

4. **`useVoiceRecording`** (existing) - Handles microphone recording
   - Located in: `hooks/useVoiceRecording.js`
   - Responsibilities: Recording audio, managing permissions, providing audio level data

### Context Providers

We've implemented a context-based approach for components that need shared state:

1. **`VoiceChatContext`** - Provides voice chat functionality to components
   - Located in: `contexts/VoiceChatContext.js`
   - Responsibilities: Combines various hooks, provides a unified interface for components

### Zustand Stores

We continue to use Zustand for global state that needs to persist across navigation:

1. **`useVoiceChatStore`** - Stores voice chat state
   - Located in: `lib/store.js`
   - Responsibilities: Conversation ID, transcription results, processing state

2. **`usePreferencesStore`** - Stores user preferences
   - Located in: `lib/store.js`
   - Responsibilities: Theme, voice settings, UI preferences

## Data Flow

1. **User interactions** (clicks, form input) happen at the component level
2. **Component actions** are handled by context methods (`useVoiceChat` hook)
3. **Business logic** is executed in custom hooks or context providers
4. **Global state** is updated in Zustand stores when needed
5. **UI updates** happen automatically through React's rendering cycle

## Component Structure

We've refactored components to consume state directly from context rather than receiving props:

- **ConversationalUI** - Wraps everything in the `VoiceChatProvider`
- **MessageList** - Gets messages from context
- **InputBar** - Gets input handling from context
- **VoiceControls** - Gets recording controls from context
- **AudioPlayer** - Gets audio playback from context

## Benefits of this Architecture

1. **Reduced Prop Drilling** - Components can access state directly via context instead of passing props through multiple levels
2. **Better Separation of Concerns** - Logic is organized by domain and separated from UI
3. **Improved Reusability** - Hooks can be used across different components
4. **Easier Testing** - Isolated business logic is easier to test
5. **Simplified Components** - UI components focus on rendering without complex state logic

## Future Improvements

1. **TypeScript Migration** - Adding TypeScript would further improve type safety
2. **Performance Optimization** - Consider memoization for expensive calculations or renders
3. **State Machine Patterns** - For complex workflows, consider using state machines (e.g., XState)
4. **Testing Strategy** - Implement unit tests for hooks and integration tests for context providers

## Example Usage

```jsx
// Using the VoiceChat context in a component
import { useVoiceChat } from '../contexts/VoiceChatContext';

const MyComponent = () => {
  // Get what you need from the context
  const { isRecording, toggleRecording, conversation } = useVoiceChat();
  const { messages } = conversation;
  
  return (
    <div>
      <button onClick={toggleRecording}>
        {isRecording ? 'Stop Recording' : 'Start Recording'}
      </button>
      
      <div>
        {messages.map(msg => (
          <div key={msg.id}>{msg.text}</div>
        ))}
      </div>
    </div>
  );
};
``` 