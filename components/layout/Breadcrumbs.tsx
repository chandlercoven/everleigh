import React from 'react';

/**
 * Props interface for Breadcrumbs component
 */
interface BreadcrumbsProps {
  pathSegments: string[];
}

/**
 * Breadcrumbs - Component to display navigation breadcrumbs
 * Renders a hierarchical path with links to parent pages
 */
const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ pathSegments }) => {
  return (
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
  );
};

export default Breadcrumbs; 