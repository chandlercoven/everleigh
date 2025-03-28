import React from 'react';

/**
 * AccessibilitySkipLink - A skip link for keyboard users to bypass navigation
 */
const AccessibilitySkipLink = () => {
  return (
    <a 
      href="#main-content" 
      className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-indigo-600 focus:text-white"
    >
      Skip to content
    </a>
  );
};

export default AccessibilitySkipLink; 