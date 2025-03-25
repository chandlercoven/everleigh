/**
 * Assistant Orchestrator
 * 
 * Manages multiple agent personas and routes requests to the appropriate agent
 * Handles context sharing and memory management between agents
 */

import SharedMemoryProvider from './SharedMemoryProvider';
import { 
  PrimaryAgent, 
  ResearchAgent, 
  TaskAgent, 
  HomeAutomationAgent 
} from './agents';

class AssistantOrchestrator {
  constructor(options = {}) {
    // Initialize agents
    this.agents = {
      // Default general purpose assistant
      primary: new PrimaryAgent(),
      
      // Specialized agents for different tasks
      research: new ResearchAgent(),
      task: new TaskAgent(),
      homeAutomation: new HomeAutomationAgent(),
      
      // Register additional agents if provided
      ...(options.agents || {})
    };
    
    // Track the currently active agent
    this.activeAgent = 'primary';
    
    // Store conversation context
    this.conversationContext = {
      currentTopic: null,
      lastQuery: null,
      continuingConversation: false,
      sessionStart: Date.now(),
      messageCount: 0
    };
    
    // Initialize shared memory for agents
    this.sharedMemory = new SharedMemoryProvider(options.memoryOptions);
    
    // Analytics tracking
    this.analytics = options.analytics || null;
  }
  
  /**
   * Process a message and route to the appropriate agent
   * 
   * @param {string} message User's message text
   * @param {Object} sessionContext Context for the current session
   * @returns {Object} Response with text, actions, and metadata
   */
  async routeMessage(message, sessionContext = {}) {
    // Update conversation context
    this.conversationContext.lastQuery = message;
    this.conversationContext.messageCount++;
    this.conversationContext.continuingConversation = 
      this.conversationContext.messageCount > 1;
    
    // Track event if analytics available
    if (this.analytics) {
      this.analytics.trackEvent('message_received', {
        message_text: message,
        active_agent: this.activeAgent
      });
    }
    
    try {
      // Determine intent and route to appropriate agent
      const intent = await this.classifyIntent(message, sessionContext);
      
      // Get routing decision
      const routingDecision = this.makeRoutingDecision(
        intent, 
        message, 
        {
          ...sessionContext,
          ...this.conversationContext
        }
      );
      
      // Track agent switching if applicable
      const isAgentSwitch = this.activeAgent !== routingDecision.targetAgent;
      if (isAgentSwitch && this.analytics) {
        this.analytics.trackEvent('agent_switch', {
          from: this.activeAgent,
          to: routingDecision.targetAgent,
          intent
        });
      }
      
      // Set active agent based on routing
      this.activeAgent = routingDecision.targetAgent;
      
      // Get the agent instance
      const agentInstance = this.agents[this.activeAgent];
      
      if (!agentInstance) {
        throw new Error(`Agent "${this.activeAgent}" not found`);
      }
      
      // Process the message with the selected agent
      const response = await agentInstance.processMessage(
        message, 
        {
          ...sessionContext,
          ...this.conversationContext,
          sharedMemory: this.sharedMemory,
          previousAgent: routingDecision.previousAgent,
          isAgentSwitch
        }
      );
      
      // Update shared memory if needed
      if (response.memoryUpdates) {
        await this.sharedMemory.updateMemory(response.memoryUpdates);
      }
      
      // Update conversation context based on response
      if (response.newTopic) {
        this.conversationContext.currentTopic = response.newTopic;
      }
      
      // Track response if analytics available
      if (this.analytics) {
        this.analytics.trackEvent('message_processed', {
          active_agent: this.activeAgent,
          response_length: response.text.length,
          has_actions: response.actions?.length > 0,
          processing_time: response.processingTime
        });
      }
      
      // Return the response with additional metadata
      return {
        response: response.text,
        voice: agentInstance.getVoiceSettings(),
        actions: response.actions || [],
        activeAgent: this.activeAgent,
        suggestedFollowups: response.suggestions || [],
        sentiment: response.sentiment || 'neutral',
        isAgentSwitch,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Error in orchestrator:', error);
      
      // Track error if analytics available
      if (this.analytics) {
        this.analytics.trackEvent('orchestrator_error', {
          error: error.message,
          active_agent: this.activeAgent
        });
      }
      
      // Fall back to primary agent for error handling
      this.activeAgent = 'primary';
      
      return {
        response: `I'm sorry, I encountered an issue processing your request. ${
          error.message.includes('not found') 
            ? 'Please try again with a different question.'
            : 'Please try again in a moment.'
        }`,
        voice: this.agents.primary.getVoiceSettings(),
        activeAgent: 'primary',
        error: error.message,
        timestamp: Date.now()
      };
    }
  }
  
  /**
   * Classify the intent of a message
   * 
   * @param {string} message User's message
   * @param {Object} context Session context
   * @returns {string} Intent classification
   */
  async classifyIntent(message, context = {}) {
    // Simple keyword/pattern matching for MVP
    // Later, use a more sophisticated NLU system or LLM-based classifier
    const lowerMessage = message.toLowerCase();
    
    // Research intent - knowledge-seeking questions
    if (
      lowerMessage.includes('research') || 
      lowerMessage.includes('find information') ||
      lowerMessage.includes('what is') ||
      lowerMessage.includes('how does') ||
      lowerMessage.includes('explain') ||
      lowerMessage.includes('tell me about')
    ) {
      return 'research';
    }
    
    // Task automation intent
    if (
      lowerMessage.includes('schedule') || 
      lowerMessage.includes('reminder') ||
      lowerMessage.includes('set a task') ||
      lowerMessage.includes('make a note') ||
      lowerMessage.includes('create a') ||
      lowerMessage.includes('add to my') ||
      lowerMessage.includes('remind me')
    ) {
      return 'task';
    }
    
    // Home automation intent
    if (
      lowerMessage.includes('turn on') || 
      lowerMessage.includes('turn off') ||
      lowerMessage.includes('dim the') ||
      lowerMessage.includes('set temperature') ||
      lowerMessage.includes('lights') ||
      lowerMessage.includes('thermostat') ||
      lowerMessage.includes('smart home')
    ) {
      return 'homeAutomation';
    }
    
    // Continue with current intent/agent if in a conversation
    if (context.continuingConversation && context.currentTopic) {
      return context.currentTopic;
    }
    
    // Default to general purpose
    return 'general';
  }
  
  /**
   * Determine which agent should handle the message
   * 
   * @param {string} intent Classified intent
   * @param {string} message Original message
   * @param {Object} context Session context
   * @returns {Object} Routing decision with target agent
   */
  makeRoutingDecision(intent, message, context) {
    const previousAgent = context.currentAgent || 'primary';
    
    // Intent-based routing
    switch (intent) {
      case 'research':
        return { targetAgent: 'research', previousAgent };
        
      case 'task':
        return { targetAgent: 'task', previousAgent };
        
      case 'homeAutomation':
        return { targetAgent: 'homeAutomation', previousAgent };
        
      default:
        // Check if we should maintain continuity with previous agent
        if (context.continuingConversation && previousAgent !== 'primary') {
          // Continue with the same agent if the conversation is ongoing
          return { targetAgent: previousAgent, previousAgent };
        }
        
        return { targetAgent: 'primary', previousAgent };
    }
  }
  
  /**
   * Get all available agents
   * 
   * @returns {Array} List of agent information
   */
  getAvailableAgents() {
    return Object.entries(this.agents).map(([id, agent]) => ({
      id,
      name: agent.name,
      description: agent.description,
      domains: agent.domains || [],
      isActive: this.activeAgent === id
    }));
  }
  
  /**
   * Switch to a specific agent manually
   * 
   * @param {string} agentId Target agent ID
   * @returns {boolean} Success status
   */
  switchAgent(agentId) {
    if (!this.agents[agentId]) {
      return false;
    }
    
    this.activeAgent = agentId;
    return true;
  }
  
  /**
   * Get information about the current active agent
   * 
   * @returns {Object} Agent information
   */
  getActiveAgent() {
    const agent = this.agents[this.activeAgent];
    
    if (!agent) {
      return null;
    }
    
    return {
      id: this.activeAgent,
      name: agent.name,
      description: agent.description,
      voice: agent.getVoiceSettings()
    };
  }
  
  /**
   * Reset the conversation context
   */
  resetConversation() {
    this.conversationContext = {
      currentTopic: null,
      lastQuery: null,
      continuingConversation: false,
      sessionStart: Date.now(),
      messageCount: 0
    };
    
    this.activeAgent = 'primary';
  }
}

export default AssistantOrchestrator; 