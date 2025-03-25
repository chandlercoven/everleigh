/**
 * SharedMemoryProvider
 * 
 * Manages persistent memory for the assistant across sessions
 * Stores user preferences, learned information, and agent-specific data
 */

class SharedMemoryProvider {
  constructor(options = {}) {
    this.userId = options.userId || 'guest';
    this.persistenceType = options.persistenceType || 'local';
    this.localStorageKey = `assistant_memory_${this.userId}`;
    
    // In-memory cache of the memory data
    this.memoryCache = null;
    
    // Initialize memory structure
    this.initializeMemory();
  }
  
  /**
   * Initialize memory structure
   */
  async initializeMemory() {
    try {
      // Try to load existing memory
      const existingMemory = await this.loadMemory();
      
      if (existingMemory) {
        this.memoryCache = existingMemory;
        return;
      }
      
      // Create new memory structure if none exists
      this.memoryCache = {
        userId: this.userId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        
        // Core memory sections
        profile: {
          name: null,
          preferences: {},
        },
        
        // Entities the assistant has learned about
        entities: {
          people: {},
          places: {},
          things: {},
        },
        
        // Agent-specific memory segments
        agentMemory: {},
        
        // Conversational long-term memory
        conversations: {
          // Recent important interactions
          recentInteractions: [], 
          // Key facts learned from conversations
          keyFacts: []
        },
        
        // Flag for whether memory contents are temporary or permanent
        isTemporary: this.userId === 'guest'
      };
      
      // Save initial memory
      await this.saveMemory();
    } catch (error) {
      console.error('Error initializing memory:', error);
      // Create minimal fallback memory if loading fails
      this.memoryCache = {
        userId: this.userId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        profile: { name: null, preferences: {} },
        entities: {},
        agentMemory: {},
        conversations: { recentInteractions: [], keyFacts: [] },
        isTemporary: true
      };
    }
  }
  
  /**
   * Get all memory data
   * 
   * @returns {Object} Complete memory data
   */
  async getMemory() {
    if (!this.memoryCache) {
      await this.loadMemory();
    }
    return this.memoryCache;
  }
  
  /**
   * Update memory with new data
   * 
   * @param {Object} updates Memory updates to apply
   * @returns {boolean} Success status
   */
  async updateMemory(updates) {
    try {
      if (!this.memoryCache) {
        await this.loadMemory();
      }
      
      // Deep merge updates into memory
      this.deepMerge(this.memoryCache, updates);
      
      // Update timestamp
      this.memoryCache.updatedAt = Date.now();
      
      // Save updated memory
      await this.saveMemory();
      
      return true;
    } catch (error) {
      console.error('Error updating memory:', error);
      return false;
    }
  }
  
  /**
   * Get memory for a specific agent
   * 
   * @param {string} agentId Agent identifier
   * @returns {Object} Agent-specific memory
   */
  async getAgentMemory(agentId) {
    if (!this.memoryCache) {
      await this.loadMemory();
    }
    
    if (!this.memoryCache.agentMemory[agentId]) {
      this.memoryCache.agentMemory[agentId] = {
        conversationHistory: [],
        preferences: {},
        knownTopics: []
      };
    }
    
    return this.memoryCache.agentMemory[agentId];
  }
  
  /**
   * Update memory for a specific agent
   * 
   * @param {string} agentId Agent identifier
   * @param {Object} updates Agent-specific memory updates
   * @returns {boolean} Success status
   */
  async updateAgentMemory(agentId, updates) {
    try {
      if (!this.memoryCache) {
        await this.loadMemory();
      }
      
      if (!this.memoryCache.agentMemory[agentId]) {
        this.memoryCache.agentMemory[agentId] = {};
      }
      
      // Deep merge updates into agent memory
      this.deepMerge(this.memoryCache.agentMemory[agentId], updates);
      
      // Update timestamp
      this.memoryCache.updatedAt = Date.now();
      
      // Save updated memory
      await this.saveMemory();
      
      return true;
    } catch (error) {
      console.error(`Error updating memory for agent ${agentId}:`, error);
      return false;
    }
  }
  
  /**
   * Remember user preference
   * 
   * @param {string} category Preference category
   * @param {string} key Preference key
   * @param {any} value Preference value
   * @returns {boolean} Success status
   */
  async rememberPreference(category, key, value) {
    try {
      if (!this.memoryCache) {
        await this.loadMemory();
      }
      
      if (!this.memoryCache.profile.preferences[category]) {
        this.memoryCache.profile.preferences[category] = {};
      }
      
      this.memoryCache.profile.preferences[category][key] = value;
      
      // Update timestamp
      this.memoryCache.updatedAt = Date.now();
      
      // Save updated memory
      await this.saveMemory();
      
      return true;
    } catch (error) {
      console.error('Error remembering preference:', error);
      return false;
    }
  }
  
  /**
   * Get user preferences
   * 
   * @param {string} category Optional category filter
   * @returns {Object} User preferences
   */
  async getPreferences(category = null) {
    if (!this.memoryCache) {
      await this.loadMemory();
    }
    
    if (category) {
      return this.memoryCache.profile.preferences[category] || {};
    }
    
    return this.memoryCache.profile.preferences;
  }
  
  /**
   * Remember entity information
   * 
   * @param {string} entityType Entity type (people, places, things)
   * @param {string} entityId Entity identifier
   * @param {Object} data Entity data
   * @returns {boolean} Success status
   */
  async rememberEntity(entityType, entityId, data) {
    try {
      if (!this.memoryCache) {
        await this.loadMemory();
      }
      
      if (!this.memoryCache.entities[entityType]) {
        this.memoryCache.entities[entityType] = {};
      }
      
      const existingEntity = this.memoryCache.entities[entityType][entityId] || {};
      
      // Update entity with new data
      this.memoryCache.entities[entityType][entityId] = {
        ...existingEntity,
        ...data,
        updatedAt: Date.now()
      };
      
      // Add createdAt if it's a new entity
      if (!existingEntity.createdAt) {
        this.memoryCache.entities[entityType][entityId].createdAt = Date.now();
      }
      
      // Update timestamp
      this.memoryCache.updatedAt = Date.now();
      
      // Save updated memory
      await this.saveMemory();
      
      return true;
    } catch (error) {
      console.error('Error remembering entity:', error);
      return false;
    }
  }
  
  /**
   * Get entity information
   * 
   * @param {string} entityType Entity type
   * @param {string} entityId Entity identifier
   * @returns {Object} Entity data
   */
  async getEntity(entityType, entityId) {
    if (!this.memoryCache) {
      await this.loadMemory();
    }
    
    if (!this.memoryCache.entities[entityType]) {
      return null;
    }
    
    return this.memoryCache.entities[entityType][entityId] || null;
  }
  
  /**
   * Clear all memory data
   * 
   * @returns {boolean} Success status
   */
  async clearMemory() {
    try {
      this.memoryCache = {
        userId: this.userId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        profile: { name: null, preferences: {} },
        entities: {},
        agentMemory: {},
        conversations: { recentInteractions: [], keyFacts: [] },
        isTemporary: this.userId === 'guest'
      };
      
      // Clear from storage
      switch (this.persistenceType) {
        case 'local':
          localStorage.removeItem(this.localStorageKey);
          break;
        case 'server':
          await fetch('/api/memory/clear', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: this.userId })
          });
          break;
        default:
          break;
      }
      
      return true;
    } catch (error) {
      console.error('Error clearing memory:', error);
      return false;
    }
  }
  
  /**
   * Add a key fact to memory
   * 
   * @param {string} fact Key fact text
   * @param {Object} metadata Optional metadata
   * @returns {boolean} Success status
   */
  async addKeyFact(fact, metadata = {}) {
    try {
      if (!this.memoryCache) {
        await this.loadMemory();
      }
      
      this.memoryCache.conversations.keyFacts.push({
        fact,
        metadata,
        timestamp: Date.now()
      });
      
      // Limit key facts to last 50
      if (this.memoryCache.conversations.keyFacts.length > 50) {
        this.memoryCache.conversations.keyFacts = 
          this.memoryCache.conversations.keyFacts.slice(-50);
      }
      
      // Update timestamp
      this.memoryCache.updatedAt = Date.now();
      
      // Save updated memory
      await this.saveMemory();
      
      return true;
    } catch (error) {
      console.error('Error adding key fact:', error);
      return false;
    }
  }
  
  /**
   * Load memory from storage
   * 
   * @returns {Object} Memory data
   */
  async loadMemory() {
    try {
      let memoryData = null;
      
      switch (this.persistenceType) {
        case 'local':
          const storedData = localStorage.getItem(this.localStorageKey);
          if (storedData) {
            memoryData = JSON.parse(storedData);
          }
          break;
          
        case 'server':
          const response = await fetch(`/api/memory?userId=${this.userId}`);
          if (response.ok) {
            memoryData = await response.json();
          }
          break;
          
        default:
          break;
      }
      
      if (memoryData) {
        this.memoryCache = memoryData;
        return memoryData;
      }
      
      return null;
    } catch (error) {
      console.error('Error loading memory:', error);
      return null;
    }
  }
  
  /**
   * Save memory to storage
   * 
   * @returns {boolean} Success status
   */
  async saveMemory() {
    try {
      if (!this.memoryCache) {
        return false;
      }
      
      switch (this.persistenceType) {
        case 'local':
          localStorage.setItem(
            this.localStorageKey, 
            JSON.stringify(this.memoryCache)
          );
          break;
          
        case 'server':
          await fetch('/api/memory', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(this.memoryCache)
          });
          break;
          
        default:
          break;
      }
      
      return true;
    } catch (error) {
      console.error('Error saving memory:', error);
      return false;
    }
  }
  
  /**
   * Helper method to deep merge objects
   * 
   * @param {Object} target Target object
   * @param {Object} source Source object
   * @returns {Object} Merged object
   */
  deepMerge(target, source) {
    if (!source) return target;
    
    for (const key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        if (source[key] instanceof Object && key in target) {
          this.deepMerge(target[key], source[key]);
        } else {
          target[key] = source[key];
        }
      }
    }
    
    return target;
  }
}

export default SharedMemoryProvider; 