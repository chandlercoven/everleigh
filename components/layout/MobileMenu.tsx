import React from 'react';
import { signOut } from 'next-auth/react';
import type { Session } from 'next-auth';

/**
 * Interface for navigation links
 */
interface NavigationLink {
  name: string;
  href: string;
  current: boolean;
}

/**
 * Props interface for MobileMenu component
 */
interface MobileMenuProps {
  isOpen: boolean;
  navigationLinks: NavigationLink[];
  session: Session | null;
  toggleVoicePanel: () => void;
}

/**
 * MobileMenu - Mobile navigation menu
 * Displays navigation links and user information on mobile devices
 */
const MobileMenu: React.FC<MobileMenuProps> = ({ 
  isOpen, 
  navigationLinks, 
  session, 
  toggleVoicePanel 
}) => {
  return (
    <div className={`${isOpen ? 'block' : 'hidden'} sm:hidden`} id="mobile-menu">
      <div className="pt-2 pb-3 space-y-1">
        {navigationLinks.map((link) => (
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
      {/* Mobile user menu */}
      {session && session.user && (
        <div className="pt-4 pb-3 border-t border-gray-200 dark:border-gray-600">
          <div className="flex items-center px-4">
            {/* User avatar */}
            {session.user?.image && (
              <div className="flex-shrink-0">
                <img className="h-10 w-10 rounded-full" src={session.user.image} alt="" />
              </div>
            )}
            <div className="ml-3">
              <div className="text-base font-medium text-gray-800 dark:text-white">
                {session.user?.name || 'User'}
              </div>
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {session.user?.email || ''}
              </div>
            </div>
          </div>
          
          {/* Mobile sign out */}
          <div className="mt-3 space-y-1">
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="w-full text-left px-4 py-2 text-base font-medium text-gray-500 dark:text-gray-300 hover:text-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileMenu; 