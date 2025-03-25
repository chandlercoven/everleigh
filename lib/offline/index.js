/**
 * Offline Manager
 * 
 * Handles offline functionality and sync when connectivity is restored
 */

class OfflineManager {
  constructor(options = {}) {
    this.dbName = 'everleigh_offline_db';
    this.dbVersion = 1;
    this.pendingActionsStore = 'pending_actions';
    this.offlineResultsStore = 'offline_results';
    
    this.isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    this.pendingActions = [];
    this.db = null;
    
    // Offline capabilities configuration
    this.offlineCapabilities = {
      vadEnabled: true,
      wakeWordEnabled: options.wakeWordEnabled ?? true,
      basicCommands: true,
      fullConversation: false,
      textProcessing: true
    };
    
    // Register handlers for online/offline events
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnlineStatus.bind(this));
      window.addEventListener('offline', this.handleOnlineStatus.bind(this));
    }
    
    // Initialize database and load pending actions
    this.initDatabase();
  }
  
  /**
   * Initialize the IndexedDB database
   */
  async initDatabase() {
    if (!window.indexedDB) {
      console.warn('IndexedDB not supported - offline functionality limited');
      return;
    }
    
    try {
      this.db = await this.openDatabase();
      await this.loadPendingActions();
    } catch (error) {
      console.error('Failed to initialize offline database:', error);
    }
  }
  
  /**
   * Open the IndexedDB database
   * 
   * @returns {Promise<IDBDatabase>} IndexedDB database instance
   */
  async openDatabase() {
    return new Promise((resolve, reject) => {
      const request = window.indexedDB.open(this.dbName, this.dbVersion);
      
      request.onerror = (event) => {
        reject(new Error('Failed to open offline database'));
      };
      
      request.onsuccess = (event) => {
        resolve(event.target.result);
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create stores if they don't exist
        if (!db.objectStoreNames.contains(this.pendingActionsStore)) {
          db.createObjectStore(this.pendingActionsStore, { keyPath: 'id' });
        }
        
        if (!db.objectStoreNames.contains(this.offlineResultsStore)) {
          db.createObjectStore(this.offlineResultsStore, { keyPath: 'id' });
        }
      };
    });
  }
  
  /**
   * Handle online/offline status changes
   */
  handleOnlineStatus(event) {
    const wasOnline = this.isOnline;
    this.isOnline = navigator.onLine;
    
    if (!wasOnline && this.isOnline) {
      // Just came back online
      console.log('Connectivity restored - syncing pending actions');
      this.syncPendingActions();
    } else if (wasOnline && !this.isOnline) {
      // Just went offline
      console.log('Connectivity lost - switching to offline mode');
    }
    
    // Dispatch custom event for other components to react
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('connection-change', { 
          detail: { isOnline: this.isOnline } 
        })
      );
    }
  }
  
  /**
   * Check if an intent can be handled offline
   * 
   * @param {string} intent Intent to check
   * @returns {boolean} Whether the intent can be handled offline
   */
  canHandleOffline(intent) {
    // Check if this intent can be handled offline
    const offlineIntents = [
      'time', 'date', 'basic_math', 'device_control',
      'local_reminder', 'local_note'
    ];
    
    return offlineIntents.includes(intent);
  }
  
  /**
   * Process a request in offline mode
   * 
   * @param {string} text User's text input
   * @returns {Promise<Object>} Offline response
   */
  async processOfflineRequest(text) {
    if (!text) {
      return {
        response: "I couldn't understand your request in offline mode.",
        handled: false
      };
    }
    
    // Simple NLU for offline mode
    const intent = this.detectOfflineIntent(text);
    
    if (intent === 'time') {
      const now = new Date();
      return {
        response: `It's ${now.toLocaleTimeString()}.`,
        handled: true,
        intent: 'time'
      };
    }
    
    if (intent === 'date') {
      const now = new Date();
      return {
        response: `Today is ${now.toLocaleDateString()}.`,
        handled: true,
        intent: 'date'
      };
    }
    
    if (intent === 'basic_math') {
      try {
        const expression = text.replace(/[^0-9+\-*/().]/g, '');
        // Use Function constructor with strict restrictions for safety
        const result = new Function(`"use strict"; return (${expression})`)();
        return {
          response: `The result is ${result}.`,
          handled: true,
          intent: 'basic_math'
        };
      } catch (error) {
        console.error('Error calculating math expression:', error);
      }
    }
    
    if (intent === 'local_reminder') {
      // Store reminder in IndexedDB
      const reminder = {
        text: text.replace(/remind me to|remind me about|reminder|set a reminder/gi, '').trim(),
        created: Date.now()
      };
      
      try {
        await this.storeOfflineReminder(reminder);
        return {
          response: `I've saved a reminder for when you're back online: "${reminder.text}"`,
          handled: true,
          intent: 'local_reminder'
        };
      } catch (error) {
        console.error('Error saving reminder:', error);
      }
    }
    
    // Queue request for when we're back online
    try {
      await this.queueForOnline(text);
      
      return {
        response: "I'll need to be online to help with that. I've saved your request and will process it when connection is restored.",
        handled: false,
        queued: true
      };
    } catch (error) {
      console.error('Error queueing request:', error);
      return {
        response: "I'm currently offline and can't process this request. Please try again when you have internet connectivity.",
        handled: false,
        queued: false
      };
    }
  }
  
  /**
   * Detect the intent of a message in offline mode
   * 
   * @param {string} text User's text input
   * @returns {string} Detected intent
   */
  detectOfflineIntent(text) {
    if (!text) return 'unknown';
    
    const lowerText = text.toLowerCase();
    
    if (
      lowerText.includes('time') || 
      lowerText.includes('what time') ||
      lowerText.includes('current time')
    ) {
      return 'time';
    }
    
    if (
      lowerText.includes('date') || 
      lowerText.includes('what day') ||
      lowerText.includes('what is today') ||
      lowerText.includes('today\'s date')
    ) {
      return 'date';
    }
    
    if (
      lowerText.includes('calculate') ||
      lowerText.includes(' + ') ||
      lowerText.includes(' - ') ||
      lowerText.includes(' * ') ||
      lowerText.includes(' / ') ||
      lowerText.includes('plus') ||
      lowerText.includes('minus') ||
      lowerText.includes('times') ||
      lowerText.includes('divided by')
    ) {
      return 'basic_math';
    }
    
    if (
      lowerText.includes('remind me to') ||
      lowerText.includes('remind me about') ||
      lowerText.includes('reminder') ||
      lowerText.includes('set a reminder')
    ) {
      return 'local_reminder';
    }
    
    // More intent detection patterns here
    
    return 'unknown';
  }
  
  /**
   * Queue a request for processing when back online
   * 
   * @param {string} text User's text input
   * @returns {Promise<boolean>} Success status
   */
  async queueForOnline(text) {
    if (!text) return false;
    
    const action = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      type: 'message',
      text,
      timestamp: Date.now()
    };
    
    this.pendingActions.push(action);
    
    // Store in IndexedDB for persistence
    try {
      await this.storePendingAction(action);
      return true;
    } catch (error) {
      console.error('Error storing pending action:', error);
      return false;
    }
  }
  
  /**
   * Store a pending action in IndexedDB
   * 
   * @param {Object} action Action to store
   * @returns {Promise<boolean>} Success status
   */
  async storePendingAction(action) {
    if (!this.db) {
      await this.initDatabase();
      if (!this.db) {
        throw new Error('Database not available');
      }
    }
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.pendingActionsStore], 'readwrite');
      const store = transaction.objectStore(this.pendingActionsStore);
      const request = store.add(action);
      
      request.onsuccess = () => {
        resolve(true);
      };
      
      request.onerror = (event) => {
        reject(new Error('Failed to store pending action'));
      };
    });
  }
  
  /**
   * Store an offline reminder
   * 
   * @param {Object} reminder Reminder to store
   * @returns {Promise<boolean>} Success status
   */
  async storeOfflineReminder(reminder) {
    if (!this.db) {
      await this.initDatabase();
      if (!this.db) {
        throw new Error('Database not available');
      }
    }
    
    const reminderObject = {
      id: `reminder-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      type: 'reminder',
      text: reminder.text,
      created: reminder.created,
      timestamp: Date.now()
    };
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.offlineResultsStore], 'readwrite');
      const store = transaction.objectStore(this.offlineResultsStore);
      const request = store.add(reminderObject);
      
      request.onsuccess = () => {
        resolve(true);
      };
      
      request.onerror = (event) => {
        reject(new Error('Failed to store offline reminder'));
      };
    });
  }
  
  /**
   * Load pending actions from IndexedDB
   * 
   * @returns {Promise<Array>} Loaded pending actions
   */
  async loadPendingActions() {
    if (!this.db) {
      await this.initDatabase();
      if (!this.db) {
        console.warn('Database not available - cannot load pending actions');
        return [];
      }
    }
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.pendingActionsStore], 'readonly');
      const store = transaction.objectStore(this.pendingActionsStore);
      const request = store.getAll();
      
      request.onsuccess = (event) => {
        this.pendingActions = event.target.result || [];
        resolve(this.pendingActions);
      };
      
      request.onerror = (event) => {
        console.error('Failed to load pending actions:', event.target.error);
        reject(new Error('Failed to load pending actions'));
      };
    });
  }
  
  /**
   * Sync pending actions when back online
   * 
   * @returns {Promise<boolean>} Success status
   */
  async syncPendingActions() {
    if (!this.isOnline) {
      return false;
    }
    
    console.log(`Syncing ${this.pendingActions.length} pending actions`);
    
    if (this.pendingActions.length === 0) {
      return true;
    }
    
    // Process each action in order
    for (const action of this.pendingActions) {
      try {
        await this.processPendingAction(action);
      } catch (error) {
        console.error('Error processing pending action:', error, action);
      }
    }
    
    // Clear the queue after processing
    try {
      await this.clearPendingActions();
      this.pendingActions = [];
      return true;
    } catch (error) {
      console.error('Error clearing pending actions:', error);
      return false;
    }
  }
  
  /**
   * Process a single pending action
   * 
   * @param {Object} action Pending action to process
   * @returns {Promise<void>}
   */
  async processPendingAction(action) {
    if (action.type === 'message') {
      // Emit event to let components know there's a pending message to process
      window.dispatchEvent(
        new CustomEvent('process-pending-message', { 
          detail: { message: action.text, id: action.id } 
        })
      );
    }
  }
  
  /**
   * Clear all pending actions
   * 
   * @returns {Promise<boolean>} Success status
   */
  async clearPendingActions() {
    if (!this.db) {
      return false;
    }
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.pendingActionsStore], 'readwrite');
      const store = transaction.objectStore(this.pendingActionsStore);
      const request = store.clear();
      
      request.onsuccess = () => {
        resolve(true);
      };
      
      request.onerror = (event) => {
        reject(new Error('Failed to clear pending actions'));
      };
    });
  }
  
  /**
   * Get offline reminders
   * 
   * @returns {Promise<Array>} Offline reminders
   */
  async getOfflineReminders() {
    if (!this.db) {
      await this.initDatabase();
      if (!this.db) {
        return [];
      }
    }
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.offlineResultsStore], 'readonly');
      const store = transaction.objectStore(this.offlineResultsStore);
      const request = store.getAll();
      
      request.onsuccess = (event) => {
        const allResults = event.target.result || [];
        const reminders = allResults.filter(item => item.type === 'reminder');
        resolve(reminders);
      };
      
      request.onerror = (event) => {
        reject(new Error('Failed to get offline reminders'));
      };
    });
  }
  
  /**
   * Check if there are pending actions
   * 
   * @returns {Promise<boolean>} Whether there are pending actions
   */
  async hasPendingActions() {
    if (this.pendingActions.length > 0) {
      return true;
    }
    
    try {
      const actions = await this.loadPendingActions();
      return actions.length > 0;
    } catch (error) {
      console.error('Error checking pending actions:', error);
      return false;
    }
  }
  
  /**
   * Get the count of pending actions
   * 
   * @returns {Promise<number>} Count of pending actions
   */
  async getPendingActionsCount() {
    try {
      const actions = await this.loadPendingActions();
      return actions.length;
    } catch (error) {
      console.error('Error counting pending actions:', error);
      return 0;
    }
  }
}

export default OfflineManager; 