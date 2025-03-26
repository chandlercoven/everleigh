import { useState, useEffect } from 'react';
import { usePreferencesStore } from '../lib/store';

export default function TestPage() {
  const [apiResponse, setApiResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const { theme, setTheme, uiPreferences, setUiPreferences } = usePreferencesStore();
  
  // Test the modernized API
  const testApi = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/test-modernization');
      const data = await response.json();
      setApiResponse(data);
    } catch (err) {
      setError(err.message || 'An error occurred');
      console.error('API test error:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Toggle theme between light and dark
  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };
  
  // Apply theme effect
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [theme]);
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Modernization Test</h1>
        
        <div className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Theme Switcher (Zustand)</h2>
          <div className="flex items-center gap-4">
            <span>Current theme: <strong>{theme}</strong></span>
            <button 
              onClick={toggleTheme}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
            >
              Toggle Theme
            </button>
          </div>
        </div>
        
        <div className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Redis Cache Test</h2>
          <button 
            onClick={testApi}
            disabled={loading}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Redis Cache'}
          </button>
          
          {error && (
            <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">
              <strong>Error:</strong> {error}
            </div>
          )}
          
          {apiResponse && (
            <div className="mt-4">
              <h3 className="font-medium mb-2">API Response:</h3>
              <pre className="p-4 bg-gray-100 dark:bg-gray-700 rounded overflow-auto">
                {JSON.stringify(apiResponse, null, 2)}
              </pre>
            </div>
          )}
        </div>
        
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Tailwind CSS Showcase</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-indigo-100 dark:bg-indigo-900 rounded">
              <h3 className="font-medium mb-2">Indigo</h3>
              <div className="flex flex-wrap gap-2">
                {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((shade) => (
                  <div 
                    key={shade}
                    className={`w-8 h-8 rounded bg-indigo-${shade} flex items-center justify-center`}
                    title={`indigo-${shade}`}
                  />
                ))}
              </div>
            </div>
            
            <div className="p-4 bg-emerald-100 dark:bg-emerald-900 rounded">
              <h3 className="font-medium mb-2">Emerald</h3>
              <div className="flex flex-wrap gap-2">
                {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((shade) => (
                  <div 
                    key={shade}
                    className={`w-8 h-8 rounded bg-emerald-${shade} flex items-center justify-center`}
                    title={`emerald-${shade}`}
                  />
                ))}
              </div>
            </div>
            
            <div className="p-4 bg-gray-100 dark:bg-gray-900 rounded">
              <h3 className="font-medium mb-2">Gray</h3>
              <div className="flex flex-wrap gap-2">
                {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((shade) => (
                  <div 
                    key={shade}
                    className={`w-8 h-8 rounded bg-gray-${shade} flex items-center justify-center`}
                    title={`gray-${shade}`}
                  />
                ))}
              </div>
            </div>
            
            <div className="p-4 bg-red-100 dark:bg-red-900 rounded">
              <h3 className="font-medium mb-2">Red</h3>
              <div className="flex flex-wrap gap-2">
                {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((shade) => (
                  <div 
                    key={shade}
                    className={`w-8 h-8 rounded bg-red-${shade} flex items-center justify-center`}
                    title={`red-${shade}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 