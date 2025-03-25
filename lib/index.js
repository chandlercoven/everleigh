/**
 * Everleigh - Advanced Voice Assistant Platform
 * 
 * Main application entry point that initializes and connects all systems
 */

import AssistantOrchestrator from './orchestrator';
import { SkillManager } from './skills';
import TelephonyService from './telephony';
import OfflineManager from './offline';
import builtInSkills from './skills/builtInSkills';

/**
 * Main application class that initializes and manages all subsystems
 */
class EverleighApp {
  constructor(config = {}) {
    this.config = this.loadConfig(config);
    
    // Initialize subsystems in dependency order
    this.setupSubsystems();
    
    // Setup event listeners
    this.setupEventListeners();
    
    console.log('Everleigh application initialized');
  }
  
  /**
   * Load configuration with defaults
   * 
   * @param {Object} overrides Configuration overrides
   * @returns {Object} Complete configuration
   */
  loadConfig(overrides = {}) {
    // Default configuration
    const defaultConfig = {
      environment: process.env.NODE_ENV || 'development',
      server: {
        port: process.env.PORT || 3000,
        domain: process.env.SERVER_DOMAIN || 'localhost:3000'
      },
      twilio: {
        accountSid: process.env.TWILIO_ACCOUNT_SID,
        authToken: process.env.TWILIO_AUTH_TOKEN,
        personalNumber: process.env.TWILIO_PERSONAL_NUMBER,
        workNumber: process.env.TWILIO_WORK_NUMBER,
        defaultNumber: process.env.TWILIO_DEFAULT_NUMBER
      },
      n8n: {
        apiUrl: process.env.N8N_API_URL,
        apiKey: process.env.N8N_API_KEY
      },
      offline: {
        wakeWordEnabled: true
      },
      agents: {
        // Agent-specific configs would go here
      }
    };
    
    // Deep merge configs
    return this.deepMerge(defaultConfig, overrides);
  }
  
  /**
   * Initialize all subsystems
   */
  setupSubsystems() {
    // Initialize analytics (if available)
    this.analytics = this.config.analytics || {
      trackEvent: (event, data) => {
        if (this.config.environment === 'development') {
          console.log(`[Analytics] ${event}:`, data);
        }
      }
    };
    
    // Initialize skill system first (needed by orchestrator)
    this.skillManager = new SkillManager({
      n8nConfig: this.config.n8n,
      analytics: this.analytics,
      builtInSkills
    });
    
    // Initialize offline functionality
    this.offlineManager = new OfflineManager(this.config.offline);
    
    // Initialize orchestrator with skill system
    this.orchestrator = new AssistantOrchestrator({
      skills: this.skillManager,
      memoryOptions: {
        userId: this.config.userId,
        persistenceType: 'local'
      },
      analytics: this.analytics,
      offlineManager: this.offlineManager
    });
    
    // Initialize telephony service with orchestrator
    this.telephonyService = new TelephonyService({
      accountSid: this.config.twilio.accountSid,
      authToken: this.config.twilio.authToken,
      serverDomain: this.config.server.domain,
      personalNumber: this.config.twilio.personalNumber,
      workNumber: this.config.twilio.workNumber,
      defaultNumber: this.config.twilio.defaultNumber,
      orchestrator: this.orchestrator
    });
  }
  
  /**
   * Setup event listeners for cross-system communication
   */
  setupEventListeners() {
    // Listen for online/offline events (browser only)
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnlineStatusChange.bind(this));
      window.addEventListener('offline', this.handleOnlineStatusChange.bind(this));
      
      // Custom event listeners
      window.addEventListener('process-pending-message', this.handlePendingMessage.bind(this));
    }
  }
  
  /**
   * Handle online/offline status changes
   * 
   * @param {Event} event Browser event object
   */
  handleOnlineStatusChange(event) {
    const isOnline = navigator.onLine;
    console.log(`Application is now ${isOnline ? 'online' : 'offline'}`);
    
    // Notify orchestrator of connectivity change
    if (this.orchestrator && typeof this.orchestrator.handleConnectivityChange === 'function') {
      this.orchestrator.handleConnectivityChange(isOnline);
    }
  }
  
  /**
   * Handle pending messages from offline queue
   * 
   * @param {CustomEvent} event Custom event with message details
   */
  handlePendingMessage(event) {
    const { message, id } = event.detail;
    
    if (this.orchestrator) {
      console.log(`Processing queued message: ${message}`);
      this.orchestrator.routeMessage(message, { 
        source: 'offline_queue',
        messageId: id
      });
    }
  }
  
  /**
   * Process a message through the assistant
   * 
   * @param {string} message User message
   * @param {Object} context Message context
   * @returns {Promise<Object>} Assistant response
   */
  async processMessage(message, context = {}) {
    if (!message) {
      return { error: 'No message provided' };
    }
    
    // Check if we're offline
    const isOffline = typeof navigator !== 'undefined' ? !navigator.onLine : false;
    
    if (isOffline) {
      console.log('Device is offline, using offline processing');
      return this.offlineManager.processOfflineRequest(message);
    }
    
    try {
      // Process through orchestrator
      const response = await this.orchestrator.routeMessage(message, context);
      return response;
    } catch (error) {
      console.error('Error processing message:', error);
      return {
        error: 'Failed to process message',
        message: error.message
      };
    }
  }
  
  /**
   * Execute a skill by ID
   * 
   * @param {string} skillId Skill identifier
   * @param {Object} params Skill parameters
   * @param {Object} context Execution context
   * @returns {Promise<Object>} Skill execution result
   */
  async executeSkill(skillId, params = {}, context = {}) {
    try {
      return await this.skillManager.executeSkill(skillId, params, context);
    } catch (error) {
      console.error(`Error executing skill ${skillId}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Place an outbound call
   * 
   * @param {string} phoneNumber Destination phone number
   * @param {Object} options Call options
   * @returns {Promise<Object>} Call result
   */
  async placeCall(phoneNumber, options = {}) {
    try {
      return await this.telephonyService.placeCall(phoneNumber, options);
    } catch (error) {
      console.error('Error placing call:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Send an SMS message
   * 
   * @param {string} phoneNumber Destination phone number
   * @param {string} message Message text
   * @param {Object} options Message options
   * @returns {Promise<Object>} Message sending result
   */
  async sendSMS(phoneNumber, message, options = {}) {
    try {
      return await this.telephonyService.sendSMS(phoneNumber, message, options);
    } catch (error) {
      console.error('Error sending SMS:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Set up webhooks and event handlers
   * 
   * @param {Express} app Express application instance
   */
  setupWebhooks(app) {
    if (!app) {
      console.warn('No Express app provided for webhooks');
      return;
    }
    
    // Set up telephony webhooks
    if (this.telephonyService) {
      this.telephonyService.setupWebhooks(app);
    }
    
    // Setup mediastream handler on HTTP server
    app.on('ready', (server) => {
      if (this.telephonyService) {
        this.telephonyService.setupMediaStreamHandler(server);
      }
    });
  }
  
  /**
   * Get active agent information
   * 
   * @returns {Object} Active agent info
   */
  getActiveAgent() {
    if (!this.orchestrator) {
      return null;
    }
    
    return this.orchestrator.getActiveAgent();
  }
  
  /**
   * Get all available agents
   * 
   * @returns {Array} List of available agents
   */
  getAvailableAgents() {
    if (!this.orchestrator) {
      return [];
    }
    
    return this.orchestrator.getAvailableAgents();
  }
  
  /**
   * Get all available skills
   * 
   * @param {string} category Optional category filter
   * @returns {Array} List of available skills
   */
  getAvailableSkills(category = null) {
    if (!this.skillManager) {
      return [];
    }
    
    return this.skillManager.getAvailableSkills(category);
  }
  
  /**
   * Deep merge utility for configurations
   * 
   * @param {Object} target Target object
   * @param {Object} source Source object
   * @returns {Object} Merged object
   */
  deepMerge(target, source) {
    const output = Object.assign({}, target);
    
    if (this.isObject(target) && this.isObject(source)) {
      Object.keys(source).forEach(key => {
        if (this.isObject(source[key])) {
          if (!(key in target)) {
            Object.assign(output, { [key]: source[key] });
          } else {
            output[key] = this.deepMerge(target[key], source[key]);
          }
        } else {
          Object.assign(output, { [key]: source[key] });
        }
      });
    }
    
    return output;
  }
  
  /**
   * Check if value is an object
   * 
   * @param {any} item Value to check
   * @returns {boolean} Whether value is an object
   */
  isObject(item) {
    return (item && typeof item === 'object' && !Array.isArray(item));
  }
}

export default EverleighApp; 