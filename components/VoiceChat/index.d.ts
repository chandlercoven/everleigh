import { ReactNode } from 'react';

/**
 * Props for the SafeComponent
 */
interface SafeComponentProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Props for the VoiceChat component
 */
interface VoiceChatProps {
  isVisible?: boolean;
  onToggle: () => void;
}

/**
 * SafeComponent - A memory-efficient error boundary
 */
export function SafeComponent(props: SafeComponentProps): JSX.Element;

/**
 * VoiceChat - Main component that combines all voice chat subcomponents
 */
export default function VoiceChat(props: VoiceChatProps): JSX.Element; 