import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { usePreferencesStore } from '../lib/store';
import ModernVoiceChat from './VoiceChat';

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

  // Navigation links
  const navLinks = [
    { name: 'Home', href: '/', current: router.pathname === '/' },
    { name: 'Conversations', href: '/conversations', current: router.pathname.startsWith('/conversations') },
    { name: 'Modern UI', href: '/modern', current: router.pathname === '/modern' },
  ];
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Skip to content link for accessibility */}
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-indigo-600 focus:text-white">
        Skip to content
      </a>
      
      {/* Navigation */}
      <nav className="bg-white dark:bg-gray-800 shadow w-full" aria-label="Main navigation">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <a href="/" className="text-lg font-bold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">Everleigh</a>
              </div>
              {/* Desktop navigation */}
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {navLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.href}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      link.current
                        ? 'border-indigo-500 text-gray-900 dark:text-white'
                        : 'border-transparent text-gray-500 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                    aria-current={link.current ? 'page' : undefined}
                  >
                    {link.name}
                  </a>
                ))}
              </div>
            </div>
            
            <div className="hidden sm:ml-6 sm:flex sm:items-center sm:space-x-4">
              {/* Session status */}
              {session && (
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {session.user.name || session.user.email}
                </span>
              )}
              
              {/* Voice Assistant Button */}
              <button
                onClick={toggleVoicePanel}
                className="h-10 px-4 rounded-md shadow
                        bg-gradient-to-r from-indigo-600 to-indigo-500 
                        hover:from-indigo-700 hover:to-indigo-600
                        flex items-center justify-center
                        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
                        transition-all duration-300"
                aria-label="Toggle voice assistant"
                aria-expanded={isVoicePanelVisible}
              >
                <svg className="w-5 h-5 text-white mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
                <span className="text-white text-sm font-medium">Voice</span>
              </button>
            </div>
            
            {/* Mobile menu button */}
            <div className="flex items-center sm:hidden">
              <button
                type="button"
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                aria-controls="mobile-menu"
                aria-expanded={isMobileMenuOpen}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                <span className="sr-only">Open main menu</span>
                {isMobileMenuOpen ? (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <div className={`${isMobileMenuOpen ? 'block' : 'hidden'} sm:hidden`} id="mobile-menu">
          <div className="pt-2 pb-3 space-y-1">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                  link.current
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-gray-700 text-indigo-700 dark:text-indigo-300'
                    : 'border-transparent text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
                aria-current={link.current ? 'page' : undefined}
              >
                {link.name}
              </a>
            ))}
            {/* Mobile voice assistant button */}
            <button
              onClick={toggleVoicePanel}
              className="w-full text-left pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              aria-label="Toggle voice assistant"
            >
              Voice Assistant
            </button>
          </div>
          {/* Mobile session info */}
          {session && (
            <div className="pt-4 pb-3 border-t border-gray-200 dark:border-gray-600">
              <div className="flex items-center px-4">
                {session.user.image && (
                  <div className="flex-shrink-0">
                    <img className="h-10 w-10 rounded-full" src={session.user.image} alt="" />
                  </div>
                )}
                <div className="ml-3">
                  <div className="text-base font-medium text-gray-800 dark:text-white">
                    {session.user.name || 'User'}
                  </div>
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {session.user.email}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Breadcrumbs */}
      {pathSegments.length > 0 && (
        <nav className="bg-gray-50 dark:bg-gray-800 px-4 py-3 w-full" aria-label="Breadcrumb">
          <ol className="max-w-7xl mx-auto flex space-x-2 text-sm">
            <li>
              <a href="/" className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                Home
              </a>
            </li>
            {pathSegments.map((segment, index) => {
              const href = `/${pathSegments.slice(0, index + 1).join('/')}`;
              const isLast = index === pathSegments.length - 1;
              
              return (
                <li key={segment} className="flex items-center">
                  <svg className="h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  {isLast ? (
                    <span className="ml-2 text-gray-700 dark:text-gray-300 font-medium" aria-current="page">
                      {segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ')}
                    </span>
                  ) : (
                    <a href={href} className="ml-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                      {segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ')}
                    </a>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
      )}
      
      {/* Loading indicator */}
      {isNavigating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-20" aria-live="polite" role="status">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg flex items-center">
            <div className="animate-spin h-5 w-5 border-t-2 border-b-2 border-indigo-600 rounded-full mr-3"></div>
            <span>Loading...</span>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main id="main-content" className="relative">
        {children}
      </main>
      
      {/* Fixed Voice Assistant Button for mobile */}
      <button
        onClick={toggleVoicePanel}
        className="sm:hidden fixed z-50 bottom-6 right-6 h-14 w-14 rounded-full shadow-lg 
                  bg-gradient-to-r from-indigo-600 to-indigo-500 
                  hover:from-indigo-700 hover:to-indigo-600
                  flex items-center justify-center
                  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
                  transition-all duration-300"
        aria-label="Toggle voice assistant"
        aria-expanded={isVoicePanelVisible}
      >
        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
      </button>
      
      {/* Voice Chat Panel */}
      {session && <ModernVoiceChat />}
    </div>
  );
} 