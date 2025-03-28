// VoiceChatPanel component - handles the panel UI and interactions
import React, { forwardRef, useState, useEffect, ReactNode, ForwardedRef, TouchEvent } from 'react';
import { usePreferencesStore } from '../../lib/store';

/**
 * Props interface for VoiceChatPanel component
 */
interface VoiceChatPanelProps {
  children: ReactNode;
}

/**
 * VoiceChatPanel - Provides a draggable panel for voice chat interactions
 * The panel can be expanded or collapsed through touch gestures or button clicks
 */
const VoiceChatPanel = forwardRef<HTMLDivElement, VoiceChatPanelProps>(({ children }, ref) => {
  const [isPanelOpen, setIsPanelOpen] = useState<boolean>(true);
  const [panelTransform, setPanelTransform] = useState<string>('translate-y-0');
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(false);
  const [touchStartY, setTouchStartY] = useState<number>(0);
  const [touchDeltaY, setTouchDeltaY] = useState<number>(0);
  
  // Get theme preferences
  const { theme, uiPreferences } = usePreferencesStore();
  
  // Check for reduced motion preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mediaQuery.matches);
      
      const handleChange = (e: MediaQueryListEvent) => {
        setPrefersReducedMotion(e.matches);
      };
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, []);
  
  // Toggle panel open/closed
  const togglePanel = () => {
    setIsPanelOpen(!isPanelOpen);
    setPanelTransform(isPanelOpen ? 'translate-y-[85%]' : 'translate-y-0');
  };
  
  // Touch gesture handlers for mobile
  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    setTouchStartY(e.touches[0].clientY);
    setTouchDeltaY(0);
  };
  
  const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    const deltaY = e.touches[0].clientY - touchStartY;
    
    // Only update if movement is significant and in valid direction
    if (
      (isPanelOpen && deltaY > 0) || // Dragging down when open
      (!isPanelOpen && deltaY < 0)   // Dragging up when closed
    ) {
      setTouchDeltaY(deltaY);
      
      // Apply transform directly during drag for smooth feel
      if (!prefersReducedMotion && ref && 'current' in ref && ref.current) {
        const transformY = isPanelOpen ? Math.min(deltaY, 300) : Math.max(deltaY, -300);
        ref.current.style.transform = `translateY(${transformY}px)`;
      }
    }
  };
  
  const handleTouchEnd = () => {
    // Reset inline style
    if (ref && 'current' in ref && ref.current) {
      ref.current.style.transform = '';
    }
    
    // Toggle panel state if gesture was significant
    if (Math.abs(touchDeltaY) > 100) {
      togglePanel();
    } else {
      // Reset to current state
      setPanelTransform(isPanelOpen ? 'translate-y-0' : 'translate-y-[85%]');
    }
    
    setTouchDeltaY(0);
  };
  
  // Panel classes based on state
  const panelClasses = `
    voice-chat-panel 
    fixed bottom-0 left-0 right-0 
    bg-${theme === 'dark' ? 'gray-900' : 'white'} 
    border-t border-${theme === 'dark' ? 'gray-700' : 'gray-200'} 
    rounded-t-2xl 
    shadow-xl 
    z-50 
    ${prefersReducedMotion ? '' : 'transition-transform duration-300 ease-in-out'} 
    ${panelTransform}
  `.trim();
  
  const handleBarClasses = `
    handle-bar 
    w-10 h-1 
    bg-${theme === 'dark' ? 'gray-600' : 'gray-300'} 
    rounded-full 
    mx-auto 
    my-2
  `.trim();
  
  return (
    <div 
      ref={ref}
      className={panelClasses}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Drag handle for mobile */}
      <div 
        className="drag-handle cursor-pointer" 
        onClick={togglePanel}
      >
        <div className={handleBarClasses}></div>
      </div>
      
      {/* Panel content */}
      <div className="panel-content p-4">
        {children}
      </div>
    </div>
  );
});

VoiceChatPanel.displayName = 'VoiceChatPanel';

export default VoiceChatPanel; 