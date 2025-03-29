feat(typescript): Migrate core components and APIs to TypeScript

Progress: 36% complete (34/93 files converted)

This commit implements a significant portion of our TypeScript migration, focusing on:

1. Core UI components:
   - Layout component with proper prop typing
   - Conversation components (AudioPlayer, InputBar, MessageList)
   - Layout components (Navigation, VoicePanel, AccessibilitySkipLink, Breadcrumbs, MobileMenu)
   - UI components (ConversationBubble, ErrorFeedback, VoiceVisualizer)
   - VoiceChat components (VoiceChatPanel, VoiceChatRecorder, VoiceChatResponse, LiveKitIntegration)

2. Custom React hooks:
   - useAudioResponse
   - useConversationManager
   - useErrorHandler
   - useVoiceRecording

3. Key pages and APIs:
   - Main app wrapper (_app.tsx)
   - Index and conversation pages
   - Authentication endpoints (login, session)
   - Conversation management API (conversations index)
   - Critical API endpoints (process-voice, transcribe)

Key improvements:
- Added comprehensive TypeScript interfaces for props, state, and API requests/responses
- Improved error handling with typed error classes
- Enhanced type safety for API handlers
- Properly typed React components with FC typing
- Safer refs handling with proper HTML element types
- Better MediaRecorder and audio element typing in voice components
- Improved type safety in event handlers
- Strongly typed authentication flows

Remaining work:
- VoiceChatWorkflow component
- Additional authentication APIs
- Specific conversation API endpoints
- Additional page components

This migration improves code quality, developer experience, and maintainability while reducing potential runtime errors.

Closes #123

---

## Detailed Migration Report

### Converted Files (34)
- components/ConversationalUI.tsx
- components/ErrorBoundary.tsx
- components/Layout.tsx
- components/VoiceChat/LiveKitIntegration.tsx
- components/VoiceChat/VoiceChatPanel.tsx
- components/VoiceChat/VoiceChatRecorder.tsx
- components/VoiceChat/VoiceChatResponse.tsx
- components/VoiceChat/index.d.ts
- components/VoiceChat/index.tsx
- components/conversation/AudioPlayer.tsx
- components/conversation/InputBar.tsx
- components/conversation/MessageList.tsx
- components/conversation/VoiceControls.tsx
- components/layout/AccessibilitySkipLink.tsx
- components/layout/Breadcrumbs.tsx
- components/layout/MobileMenu.tsx
- components/layout/Navigation.tsx
- components/layout/VoicePanel.tsx
- components/ui/ConversationBubble.tsx
- components/ui/ErrorFeedback.tsx
- components/ui/VoiceVisualizer.tsx
- hooks/useAudioResponse.ts
- hooks/useConversationManager.ts
- hooks/useErrorHandler.ts
- hooks/useVoiceRecording.ts
- pages/_app.tsx
- pages/api/auth/login.ts
- pages/api/auth/session.ts
- pages/api/conversations/index.ts
- pages/api/ping.ts
- pages/api/process-voice.ts
- pages/api/transcribe.ts
- pages/conversation.tsx
- pages/index.tsx

### Next Priority Files
- components/VoiceChat/VoiceChatWorkflow.js
- pages/api/auth/[...nextauth].js
- pages/api/conversations/[id].js
- pages/conversations/* pages (2 files) 