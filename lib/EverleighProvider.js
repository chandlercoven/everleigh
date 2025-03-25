import { createContext, useContext, useState, useEffect } from 'react';
import EverleighApp from './index';

// Create context
const EverleighContext = createContext(null);

// Custom hook for using the Everleigh app
export const useEverleigh = () => {
  const context = useContext(EverleighContext);
  if (!context) {
    throw new Error('useEverleigh must be used within an EverleighProvider');
  }
  return context;
};

// Provider component
export const EverleighProvider = ({ children }) => {
  const [app, setApp] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState(null);

  // Initialize the Everleigh app on component mount
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Get user data for configuration (if available)
        let userData = {};
        try {
          const userResponse = await fetch('/api/user');
          if (userResponse.ok) {
            userData = await userResponse.json();
          }
        } catch (err) {
          console.warn('Could not fetch user data, continuing as guest:', err);
        }

        // Create configuration based on user data or environment
        const config = {
          userId: userData.id || 'guest',
          environment: process.env.NODE_ENV,
          analytics: {
            trackEvent: (event, data) => {
              console.log(`[Analytics] ${event}:`, data);
              // Implement actual analytics tracking here if available
            }
          }
        };

        // Create app instance
        const everleighApp = new EverleighApp(config);
        setApp(everleighApp);
        setIsInitialized(true);
      } catch (err) {
        console.error('Failed to initialize Everleigh:', err);
        setError(err.message);
        setIsInitialized(true); // Consider initialized even with error
      }
    };

    initializeApp();

    // Cleanup
    return () => {
      // Add any necessary cleanup here
    };
  }, []);

  // Context value
  const value = {
    app,
    isInitialized,
    error,
    // Helper methods
    processMessage: async (message, context = {}) => {
      if (!app) return { error: 'App not initialized' };
      return app.processMessage(message, context);
    },
    executeSkill: async (skillId, params = {}, context = {}) => {
      if (!app) return { error: 'App not initialized' };
      return app.executeSkill(skillId, params, context);
    },
    placeCall: async (phoneNumber, options = {}) => {
      if (!app) return { error: 'App not initialized' };
      return app.placeCall(phoneNumber, options);
    },
    sendSMS: async (phoneNumber, message, options = {}) => {
      if (!app) return { error: 'App not initialized' };
      return app.sendSMS(phoneNumber, message, options);
    },
    getActiveAgent: () => {
      if (!app) return null;
      return app.getActiveAgent();
    },
    getAvailableAgents: () => {
      if (!app) return [];
      return app.getAvailableAgents();
    },
    getAvailableSkills: (category = null) => {
      if (!app) return [];
      return app.getAvailableSkills(category);
    }
  };

  return (
    <EverleighContext.Provider value={value}>
      {children}
    </EverleighContext.Provider>
  );
};

export default EverleighProvider; 