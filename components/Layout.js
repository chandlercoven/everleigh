import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/router';
import { usePreferencesStore } from '../lib/store';
import ModernVoiceChat from './VoiceChat';

// Import new component files
import Navigation from './layout/Navigation';
import MobileMenu from './layout/MobileMenu';
import Breadcrumbs from './layout/Breadcrumbs';
import VoicePanel from './layout/VoicePanel';
import AccessibilitySkipLink from './layout/AccessibilitySkipLink';

export default function Layout({ children }) {
  const { data: session } = useSession();
  const { theme, uiPreferences } = usePreferencesStore();
  const [isVoicePanelVisible, setIsVoicePanelVisible] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);
  
  // Get current path for breadcrumbs
  const pathSegments = router.asPath.split('/').filter(segment => segment);
  
  // Toggle voice panel visibility
  const toggleVoicePanel = () => {
    setIsVoicePanelVisible(prev => !prev);
  };
  
  // Apply theme to document
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (theme === 'dark' || 
         (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [theme]);
  
  // Check for reduced motion preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      const prefersReducedMotion = mediaQuery.matches;
      
      // Add a class to body so we can target with CSS
      if (prefersReducedMotion) {
        document.body.classList.add('reduced-motion');
      } else {
        document.body.classList.remove('reduced-motion');
      }
      
      // Listen for changes to user preference
      const handleChange = (e) => {
        if (e.matches) {
          document.body.classList.add('reduced-motion');
        } else {
          document.body.classList.remove('reduced-motion');
        }
      };
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, []);
  
  // Add navigation event listener for loading states
  useEffect(() => {
    const handleStart = () => setIsNavigating(true);
    const handleComplete = () => setIsNavigating(false);

    router.events.on('routeChangeStart', handleStart);
    router.events.on('routeChangeComplete', handleComplete);
    router.events.on('routeChangeError', handleComplete);

    return () => {
      router.events.off('routeChangeStart', handleStart);
      router.events.off('routeChangeComplete', handleComplete);
      router.events.off('routeChangeError', handleComplete);
    };
  }, [router]);

  // Define navigation links for the app
  const getNavigationLinks = (pathname) => [
    { name: 'Home', href: '/', current: pathname === '/' },
    { name: 'Conversations', href: '/conversations', current: pathname.startsWith('/conversations') },
    { name: 'Voice Assistant', href: '/modern', current: pathname === '/modern' },
    { name: 'Chat', href: '/conversation', current: pathname === '/conversation' },
  ];
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Skip to content link for accessibility */}
      <AccessibilitySkipLink />
      
      {/* Navigation */}
      <Navigation 
        navigationLinks={getNavigationLinks(router.pathname)}
        session={session}
        toggleVoicePanel={toggleVoicePanel}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        isMobileMenuOpen={isMobileMenuOpen}
      />

      {/* Mobile menu */}
      <MobileMenu 
        isOpen={isMobileMenuOpen}
        navigationLinks={getNavigationLinks(router.pathname)}
        session={session}
        toggleVoicePanel={toggleVoicePanel}
      />

      {/* Breadcrumbs */}
      {pathSegments.length > 0 && (
        <Breadcrumbs pathSegments={pathSegments} />
      )}
      
      {/* Loading indicator */}
      {isNavigating && (
        <div className="fixed top-0 left-0 w-full h-1 bg-indigo-600 animate-pulse z-50" />
      )}
      
      {/* Voice Chat panel */}
      <VoicePanel 
        isVisible={isVoicePanelVisible}
        onClose={toggleVoicePanel}
      />
      
      {/* Main content */}
      <main id="main-content" className="flex-grow p-4 sm:p-6">
        {children}
      </main>
      
      {/* Footer */}
      <footer className="mt-auto py-4 px-6 bg-white dark:bg-gray-800 shadow-inner text-center text-sm text-gray-500 dark:text-gray-400">
        <p>Everleigh © {new Date().getFullYear()} - An intelligent voice assistant</p>
      </footer>
    </div>
  );
} 