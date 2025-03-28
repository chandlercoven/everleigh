import React from 'react';
import { signOut } from 'next-auth/react';

/**
 * Navigation - Main navigation bar component
 */
const Navigation = ({ navigationLinks, session, toggleVoicePanel, setIsMobileMenuOpen, isMobileMenuOpen }) => {
  return (
    <nav className="bg-white dark:bg-gray-800 shadow w-full" aria-label="Main navigation">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <a href="/" className="text-lg font-bold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">Everleigh</a>
            </div>
            {/* Desktop navigation */}
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navigationLinks.map((link) => (
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
            {/* User info display */}
            {session && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {session.user?.name || session.user?.email || 'User'}
              </span>
            )}
            
            {/* Sign out button */}
            <button
              onClick={async () => {
                await signOut({ callbackUrl: '/' });
              }}
              className="h-10 px-4 rounded-md shadow
                bg-red-600 hover:bg-red-700 text-white
                flex items-center justify-center"
            >
              Sign out
            </button>
          </div>
          
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
            aria-expanded={false}
          >
            <svg className="w-5 h-5 text-white mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
            <span className="text-white text-sm font-medium">Voice</span>
          </button>
          
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
    </nav>
  );
};

export default Navigation; 