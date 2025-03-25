/**
 * Skills Management System
 * 
 * Manages and executes extensible assistant skills
 * Supports different skill types: JavaScript functions, API calls, n8n workflows
 */

class SkillManager {
  constructor(options = {}) {
    // Registered skills storage
    this.skills = {};
    
    // Integration with n8n for workflow automation
    this.n8nClient = new N8nWorkflowClient(options.n8nConfig);
    
    // Default skill categories
    this.skillCategories = [
      'communication',
      'productivity',
      'knowledge',
      'media',
      'home',
      'developer',
      'integrations'
    ];
    
    // Analytics tracking
    this.analytics = options.analytics || null;
    
    // Initialize with built-in skills if provided
    if (options.builtInSkills) {
      this.registerBuiltInSkills(options.builtInSkills);
    }
  }
  
  /**
   * Register a new skill
   * 
   * @param {string} skillId Unique skill identifier
   * @param {Object} skillConfig Skill configuration
   * @returns {boolean} Success status
   */
  registerSkill(skillId, skillConfig) {
    if (!skillId || !skillConfig) {
      console.error('Invalid skill registration: missing ID or config');
      return false;
    }
    
    if (this.skills[skillId]) {
      console.warn(`Skill ${skillId} already registered. Overwriting.`);
    }
    
    // Validate required skill properties
    if (!skillConfig.name || !skillConfig.type) {
      console.error(`Invalid skill config for ${skillId}: missing required properties`);
      return false;
    }
    
    // Add metadata
    this.skills[skillId] = {
      ...skillConfig,
      id: skillId,
      registered: new Date(),
      enabled: skillConfig.enabled !== false, // Default to enabled
      executionCount: 0,
      lastExecuted: null
    };
    
    console.log(`Skill "${skillConfig.name}" (${skillId}) registered successfully`);
    return true;
  }
  
  /**
   * Register multiple skills at once
   * 
   * @param {Object} skills Object mapping skill IDs to configs
   * @returns {number} Number of successfully registered skills
   */
  registerSkills(skills) {
    if (!skills || typeof skills !== 'object') {
      return 0;
    }
    
    let successCount = 0;
    
    for (const [skillId, skillConfig] of Object.entries(skills)) {
      if (this.registerSkill(skillId, skillConfig)) {
        successCount++;
      }
    }
    
    return successCount;
  }
  
  /**
   * Register built-in skills
   * 
   * @param {Array} skills Built-in skills to register
   * @returns {number} Number of successfully registered skills
   */
  registerBuiltInSkills(skills) {
    if (!Array.isArray(skills)) {
      return 0;
    }
    
    let successCount = 0;
    
    for (const skill of skills) {
      if (skill.id && skill.config) {
        if (this.registerSkill(skill.id, skill.config)) {
          successCount++;
        }
      }
    }
    
    return successCount;
  }
  
  /**
   * Execute a skill by ID
   * 
   * @param {string} skillId Skill identifier
   * @param {Object} params Parameters for the skill
   * @param {Object} context Execution context
   * @returns {Promise<Object>} Skill execution result
   */
  async executeSkill(skillId, params = {}, context = {}) {
    const skill = this.skills[skillId];
    
    if (!skill) {
      throw new Error(`Skill ${skillId} not found`);
    }
    
    if (!skill.enabled) {
      throw new Error(`Skill ${skillId} is disabled`);
    }
    
    // Track execution attempt
    if (this.analytics) {
      this.analytics.trackEvent('skill_execution_attempt', {
        skillId,
        skillName: skill.name,
        skillType: skill.type
      });
    }
    
    try {
      let result;
      
      const startTime = Date.now();
      
      // Execute based on skill type
      switch (skill.type) {
        case 'n8n':
          if (!skill.workflowId) {
            throw new Error(`Skill ${skillId} is missing workflowId`);
          }
          result = await this.n8nClient.triggerWorkflow(skill.workflowId, params);
          break;
          
        case 'function':
          if (!skill.handler || typeof skill.handler !== 'function') {
            throw new Error(`Skill ${skillId} has invalid handler`);
          }
          result = await skill.handler(params, context);
          break;
          
        case 'api':
          if (!skill.endpoint) {
            throw new Error(`Skill ${skillId} is missing endpoint`);
          }
          result = await this.callExternalApi(skill.endpoint, params, skill.apiOptions || {});
          break;
          
        default:
          throw new Error(`Unsupported skill type: ${skill.type}`);
      }
      
      const executionTime = Date.now() - startTime;
      
      // Update skill execution stats
      this.skills[skillId].executionCount++;
      this.skills[skillId].lastExecuted = new Date();
      this.skills[skillId].lastExecutionTime = executionTime;
      
      // Track successful execution
      if (this.analytics) {
        this.analytics.trackEvent('skill_execution_success', {
          skillId,
          skillName: skill.name,
          skillType: skill.type,
          executionTime
        });
      }
      
      return {
        success: true,
        result,
        skillId,
        executionTime
      };
    } catch (error) {
      console.error(`Failed to execute skill ${skillId}:`, error);
      
      // Track error
      if (this.analytics) {
        this.analytics.trackEvent('skill_execution_error', {
          skillId,
          skillName: skill.name,
          skillType: skill.type,
          error: error.message
        });
      }
      
      return {
        success: false,
        error: error.message,
        skillId
      };
    }
  }
  
  /**
   * Call an external API endpoint
   * 
   * @param {string} endpoint API endpoint URL
   * @param {Object} params Request parameters
   * @param {Object} options Request options
   * @returns {Promise<Object>} API response
   */
  async callExternalApi(endpoint, params = {}, options = {}) {
    try {
      const {
        method = 'POST',
        headers = { 'Content-Type': 'application/json' },
        timeout = 10000,
        useFormData = false
      } = options;
      
      // Prepare request options
      const fetchOptions = {
        method,
        headers: { ...headers },
        signal: AbortSignal.timeout(timeout)
      };
      
      // Handle body based on method and content type
      if (['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
        if (useFormData) {
          const formData = new FormData();
          for (const [key, value] of Object.entries(params)) {
            formData.append(key, value);
          }
          fetchOptions.body = formData;
          // Remove content-type header to let the browser set it with boundary
          delete fetchOptions.headers['Content-Type'];
        } else {
          fetchOptions.body = JSON.stringify(params);
        }
      }
      
      // Execute request
      const response = await fetch(endpoint, fetchOptions);
      
      if (!response.ok) {
        throw new Error(`API returned status ${response.status}: ${response.statusText}`);
      }
      
      // Parse response based on content type
      const contentType = response.headers.get('content-type');
      
      if (contentType?.includes('application/json')) {
        return await response.json();
      } else {
        return await response.text();
      }
    } catch (error) {
      console.error(`API call to ${endpoint} failed:`, error);
      throw error;
    }
  }
  
  /**
   * Get information about available skills
   * 
   * @param {string} category Optional category filter
   * @returns {Array} List of available skills
   */
  getAvailableSkills(category = null) {
    const skillList = Object.values(this.skills)
      .filter(skill => skill.enabled)
      .filter(skill => !category || (skill.category === category));
    
    return skillList.map(skill => ({
      id: skill.id,
      name: skill.name,
      description: skill.description,
      type: skill.type,
      category: skill.category,
      parameters: skill.parameters,
      usage: skill.usage || null,
      examples: skill.examples || []
    }));
  }
  
  /**
   * Get skill by ID
   * 
   * @param {string} skillId Skill identifier
   * @returns {Object} Skill information or null
   */
  getSkill(skillId) {
    if (!this.skills[skillId]) {
      return null;
    }
    
    const skill = this.skills[skillId];
    
    // Return non-sensitive information (don't expose handler function code)
    return {
      id: skill.id,
      name: skill.name,
      description: skill.description,
      type: skill.type,
      category: skill.category,
      parameters: skill.parameters,
      enabled: skill.enabled,
      usage: skill.usage || null,
      examples: skill.examples || [],
      executionStats: {
        count: skill.executionCount,
        lastExecuted: skill.lastExecuted,
        lastExecutionTime: skill.lastExecutionTime
      }
    };
  }
  
  /**
   * Enable or disable a skill
   * 
   * @param {string} skillId Skill identifier
   * @param {boolean} enabled Whether the skill should be enabled
   * @returns {boolean} Success status
   */
  setSkillEnabled(skillId, enabled) {
    if (!this.skills[skillId]) {
      return false;
    }
    
    this.skills[skillId].enabled = !!enabled;
    return true;
  }
  
  /**
   * Update skill configuration
   * 
   * @param {string} skillId Skill identifier
   * @param {Object} updates Configuration updates
   * @returns {boolean} Success status
   */
  updateSkill(skillId, updates) {
    if (!this.skills[skillId] || !updates) {
      return false;
    }
    
    // Don't allow changing the skill type
    const { type, handler, ...allowedUpdates } = updates;
    
    this.skills[skillId] = {
      ...this.skills[skillId],
      ...allowedUpdates,
      updated: new Date()
    };
    
    // Allow updating the handler only for function-type skills
    if (updates.handler && this.skills[skillId].type === 'function') {
      this.skills[skillId].handler = updates.handler;
    }
    
    return true;
  }
  
  /**
   * Unregister a skill
   * 
   * @param {string} skillId Skill identifier
   * @returns {boolean} Success status
   */
  unregisterSkill(skillId) {
    if (!this.skills[skillId]) {
      return false;
    }
    
    delete this.skills[skillId];
    return true;
  }
  
  /**
   * Get available skill categories
   * 
   * @returns {Array} List of skill categories
   */
  getSkillCategories() {
    return this.skillCategories;
  }
}

/**
 * n8n Workflow Client
 * 
 * Handles communication with n8n workflow automation platform
 */
class N8nWorkflowClient {
  constructor(config = {}) {
    this.apiUrl = config.apiUrl || process.env.N8N_API_URL || null;
    this.apiKey = config.apiKey || process.env.N8N_API_KEY || null;
    this.enabled = !!this.apiUrl && !!this.apiKey;
  }
  
  /**
   * Trigger an n8n workflow by ID
   * 
   * @param {string} workflowId n8n workflow ID
   * @param {Object} data Input data for the workflow
   * @returns {Promise<Object>} Workflow execution result
   */
  async triggerWorkflow(workflowId, data = {}) {
    if (!this.enabled) {
      throw new Error('n8n integration is not properly configured');
    }
    
    if (!workflowId) {
      throw new Error('Missing workflow ID');
    }
    
    try {
      const webhookUrl = `${this.apiUrl}/webhook/${workflowId}`;
      
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-N8N-API-KEY': this.apiKey
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error(`n8n workflow returned status ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`n8n workflow execution failed:`, error);
      throw error;
    }
  }
  
  /**
   * Check if n8n integration is enabled
   * 
   * @returns {boolean} Whether n8n integration is enabled
   */
  isEnabled() {
    return this.enabled;
  }
}

export { SkillManager, N8nWorkflowClient }; 