/**
 * Agent implementations for the assistant orchestrator
 * 
 * Each agent has a specific personality, domain, and functionality
 */

// Base agent class that all agents inherit from
class BaseAgent {
  constructor(config = {}) {
    this.name = config.name || 'Assistant';
    this.description = config.description || 'A helpful assistant';
    this.domains = config.domains || ['general'];
    this.voiceId = config.voiceId || 'pNInz6obpgDQGcFmaJgB'; // Default ElevenLabs voice
    this.voiceSettings = config.voiceSettings || {
      stability: 0.5,
      similarity_boost: 0.75
    };
    this.systemPrompt = config.systemPrompt || 'You are a helpful assistant.';
  }
  
  /**
   * Process a message and generate a response
   * 
   * @param {string} message User's message
   * @param {Object} context Session context
   * @returns {Object} Response object with text and metadata
   */
  async processMessage(message, context = {}) {
    // Base implementation - override in subclasses
    return {
      text: `I'm sorry, I'm not fully implemented yet. You asked: "${message}"`,
      processingTime: 0,
      suggestions: []
    };
  }
  
  /**
   * Get voice settings for this agent
   * 
   * @returns {Object} Voice configuration
   */
  getVoiceSettings() {
    return {
      voiceId: this.voiceId,
      ...this.voiceSettings
    };
  }
  
  /**
   * Generate suggested follow-ups based on context
   * 
   * @param {string} lastMessage Last message from user
   * @param {string} lastResponse Last response from agent
   * @returns {Array} Suggested follow-up messages
   */
  generateSuggestions(lastMessage, lastResponse) {
    // Base implementation with generic suggestions
    return [
      "Can you help me with something else?",
      "Tell me more about that",
      "Why is that important?"
    ];
  }
  
  /**
   * Call the appropriate AI model to generate a response
   * 
   * @param {string} prompt Complete prompt for the AI
   * @param {Object} options Model-specific options
   * @returns {string} AI-generated response
   */
  async callAIModel(prompt, options = {}) {
    // This would be implemented to call OpenAI, local model, etc.
    // For now, just return a simulated response
    console.log(`[${this.name}] Processing prompt: ${prompt.substring(0, 50)}...`);
    
    // Mock delay to simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return `This is a simulated response from the ${this.name} agent.`;
  }
}

// Primary general-purpose assistant agent
class PrimaryAgent extends BaseAgent {
  constructor(config = {}) {
    super({
      name: 'General Assistant',
      description: 'A helpful, friendly general-purpose assistant',
      domains: ['general', 'conversation', 'advice'],
      voiceId: 'EXAVITQu4vr4xnSDxMaL', // ElevenLabs female voice
      systemPrompt: 'You are a helpful, friendly assistant. You respond in a natural, conversational way. You are concise but thorough. You aim to be helpful and provide accurate information.',
      ...config
    });
  }
  
  async processMessage(message, context = {}) {
    const startTime = Date.now();
    
    try {
      // Construct a prompt for the AI model
      const prompt = `
        ${this.systemPrompt}
        
        User: ${message}
        
        Assistant:
      `;
      
      // Call the AI model
      const response = await this.callAIModel(prompt, {
        temperature: 0.7,
        max_tokens: 150
      });
      
      // Generate suggestions based on the conversation
      const suggestions = this.generateSuggestions(message, response);
      
      return {
        text: response,
        processingTime: Date.now() - startTime,
        suggestions,
        sentiment: 'neutral'
      };
    } catch (error) {
      console.error('Error in PrimaryAgent:', error);
      
      return {
        text: "I'm sorry, I'm having trouble processing that request right now. Can you try again in a moment?",
        processingTime: Date.now() - startTime,
        error: error.message,
        suggestions: ["Could you rephrase that?", "Let's try something else", "How can I help you instead?"]
      };
    }
  }
  
  generateSuggestions(lastMessage, lastResponse) {
    // More contextual suggestions based on conversation content
    const lowerMessage = lastMessage.toLowerCase();
    
    if (lowerMessage.includes('help') || lowerMessage.includes('what can you do')) {
      return [
        "What can you tell me about...",
        "Can you set a reminder?",
        "How do I use the home automation features?"
      ];
    }
    
    if (lowerMessage.includes('thank')) {
      return [
        "Can you help me with something else?",
        "Tell me something interesting",
        "What else can you do?"
      ];
    }
    
    // Default suggestions
    return [
      "Tell me more about that",
      "Can you explain that differently?",
      "What else should I know about this?"
    ];
  }
}

// Research-focused agent for knowledge queries
class ResearchAgent extends BaseAgent {
  constructor(config = {}) {
    super({
      name: 'Research Assistant',
      description: 'A knowledgeable research assistant that provides detailed information',
      domains: ['research', 'knowledge', 'facts', 'information'],
      voiceId: '21m00Tcm4TlvDq8ikWAM', // ElevenLabs male voice
      systemPrompt: 'You are a knowledgeable research assistant. You provide accurate, detailed information and always cite your sources when possible. You are thorough and educational in your responses.',
      ...config
    });
    
    // Research agent specific settings
    this.voiceSettings = {
      stability: 0.7, // More stable voice for detailed explanations
      similarity_boost: 0.7
    };
  }
  
  async processMessage(message, context = {}) {
    const startTime = Date.now();
    
    try {
      // Construct a prompt for the AI model
      const prompt = `
        ${this.systemPrompt}
        
        User Question: ${message}
        
        Please provide a detailed answer with any relevant information. 
        If appropriate, suggest follow-up questions the user might find useful.
        
        Research Assistant:
      `;
      
      // Call the AI model
      const response = await this.callAIModel(prompt, {
        temperature: 0.3, // Lower temperature for more factual responses
        max_tokens: 300 // Allow longer responses for research
      });
      
      // Generate suggestions based on the conversation
      const suggestions = this.generateSuggestions(message, response);
      
      return {
        text: response,
        processingTime: Date.now() - startTime,
        suggestions,
        sentiment: 'informative',
        newTopic: 'research' // Set conversation topic
      };
    } catch (error) {
      console.error('Error in ResearchAgent:', error);
      
      return {
        text: "I'm sorry, I couldn't retrieve that information right now. Would you like to try a different question?",
        processingTime: Date.now() - startTime,
        error: error.message,
        suggestions: ["Try asking in a different way", "Would you like information on a different topic?", "Let me help you with something else"]
      };
    }
  }
  
  generateSuggestions(lastMessage, lastResponse) {
    // Research-specific follow-up suggestions
    return [
      "Tell me more about this topic",
      "How does this compare to...?",
      "What are the implications of this?",
      "Are there any recent developments?"
    ];
  }
}

// Task automation agent for reminders, notes, etc.
class TaskAgent extends BaseAgent {
  constructor(config = {}) {
    super({
      name: 'Task Assistant',
      description: 'A task-oriented assistant that helps with reminders, notes, and productivity',
      domains: ['tasks', 'reminders', 'calendar', 'scheduling'],
      voiceId: 'pNInz6obpgDQGcFmaJgB', // Different ElevenLabs voice
      systemPrompt: 'You are a task-oriented assistant. You help users organize their tasks, set reminders, and stay productive. You are efficient and clear in your responses.',
      ...config
    });
  }
  
  async processMessage(message, context = {}) {
    const startTime = Date.now();
    
    try {
      // Try to detect specific task intents
      const taskIntent = this.detectTaskIntent(message);
      
      // Handle task creation if detected
      if (taskIntent.type === 'create_reminder') {
        // This would normally call a skill or API to create the reminder
        const reminderResponse = `I've set a reminder for you ${taskIntent.time ? `for ${taskIntent.time}` : ''}: "${taskIntent.content}"`;
        
        return {
          text: reminderResponse,
          processingTime: Date.now() - startTime,
          actions: [
            {
              type: 'create_reminder',
              payload: {
                content: taskIntent.content,
                time: taskIntent.time
              }
            }
          ],
          suggestions: [
            "Set another reminder",
            "Show me my reminders",
            "Cancel that reminder"
          ],
          sentiment: 'positive',
          newTopic: 'task'
        };
      }
      
      // Fallback to general task assistance
      const prompt = `
        ${this.systemPrompt}
        
        User: ${message}
        
        Task Assistant:
      `;
      
      const response = await this.callAIModel(prompt, {
        temperature: 0.5,
        max_tokens: 150
      });
      
      const suggestions = this.generateSuggestions(message, response);
      
      return {
        text: response,
        processingTime: Date.now() - startTime,
        suggestions,
        newTopic: 'task'
      };
    } catch (error) {
      console.error('Error in TaskAgent:', error);
      
      return {
        text: "I wasn't able to process that task right now. Could you try again with a clearer instruction?",
        processingTime: Date.now() - startTime,
        error: error.message,
        suggestions: ["Remind me to...", "Make a note about...", "Set a timer for..."]
      };
    }
  }
  
  detectTaskIntent(message) {
    // Simple rule-based intent detection for tasks
    const lowerMessage = message.toLowerCase();
    
    // Reminder detection
    if (lowerMessage.includes('remind me') || lowerMessage.includes('set a reminder')) {
      // Extract time (very basic implementation)
      let timeMatch = lowerMessage.match(/at (\d+)(?::(\d+))?\s*(am|pm)?/i);
      let time = timeMatch ? timeMatch[0] : null;
      
      // Extract content (everything after "to" or "about")
      let contentMatch = lowerMessage.match(/(?:to|about) (.+)$/i);
      let content = contentMatch ? contentMatch[1] : lowerMessage;
      
      return {
        type: 'create_reminder',
        content,
        time
      };
    }
    
    // Note taking detection
    if (lowerMessage.includes('make a note') || lowerMessage.includes('write down')) {
      let contentMatch = lowerMessage.match(/(?:note|down) (.+)$/i);
      let content = contentMatch ? contentMatch[1] : lowerMessage;
      
      return {
        type: 'create_note',
        content
      };
    }
    
    // Default - no specific task detected
    return {
      type: 'general_task',
      content: message
    };
  }
  
  generateSuggestions(lastMessage, lastResponse) {
    return [
      "Remind me to...",
      "What's on my calendar?",
      "Make a note about...",
      "Set a timer for 5 minutes"
    ];
  }
}

// Home automation agent for smart home controls
class HomeAutomationAgent extends BaseAgent {
  constructor(config = {}) {
    super({
      name: 'Home Assistant',
      description: 'A specialized assistant for controlling smart home devices',
      domains: ['home automation', 'smart home', 'devices', 'controls'],
      voiceId: 'EXAVITQu4vr4xnSDxMaL', // Different voice for home
      systemPrompt: 'You are a smart home assistant. You help users control their connected devices, adjust settings, and manage their home environment. You are efficient and helpful.',
      ...config
    });
    
    // Available device types and actions
    this.deviceTypes = ['lights', 'thermostat', 'door', 'window', 'camera', 'music'];
    this.deviceActions = {
      lights: ['turn on', 'turn off', 'dim', 'brighten', 'change color'],
      thermostat: ['set temperature', 'turn up', 'turn down', 'set mode'],
      door: ['lock', 'unlock', 'check status'],
      window: ['open', 'close', 'check status'],
      camera: ['view', 'record', 'notify'],
      music: ['play', 'pause', 'next', 'previous', 'volume']
    };
  }
  
  async processMessage(message, context = {}) {
    const startTime = Date.now();
    
    try {
      // Detect home automation intent
      const automationIntent = this.detectAutomationIntent(message);
      
      if (automationIntent.type !== 'unknown') {
        // This would normally call a skill or API to control devices
        
        const actionResponse = `I'll ${automationIntent.action} the ${automationIntent.device} ${
          automationIntent.parameters ? `to ${automationIntent.parameters.join(', ')}` : ''
        }.`;
        
        return {
          text: actionResponse,
          processingTime: Date.now() - startTime,
          actions: [
            {
              type: 'home_control',
              payload: {
                device: automationIntent.device,
                action: automationIntent.action,
                parameters: automationIntent.parameters
              }
            }
          ],
          suggestions: this.generateDeviceSuggestions(automationIntent.device),
          sentiment: 'efficient',
          newTopic: 'homeAutomation'
        };
      }
      
      // Fallback to general home assistance
      const prompt = `
        ${this.systemPrompt}
        
        User: ${message}
        
        Home Assistant:
      `;
      
      const response = await this.callAIModel(prompt, {
        temperature: 0.5,
        max_tokens: 150
      });
      
      const suggestions = this.generateSuggestions(message, response);
      
      return {
        text: response,
        processingTime: Date.now() - startTime,
        suggestions,
        newTopic: 'homeAutomation'
      };
    } catch (error) {
      console.error('Error in HomeAutomationAgent:', error);
      
      return {
        text: "I wasn't able to control your home devices right now. Could you try again with a clearer instruction?",
        processingTime: Date.now() - startTime,
        error: error.message,
        suggestions: ["Turn on the lights", "Set the thermostat to 72", "Is the front door locked?"]
      };
    }
  }
  
  detectAutomationIntent(message) {
    const lowerMessage = message.toLowerCase();
    
    // Check each device type
    for (const deviceType of this.deviceTypes) {
      if (lowerMessage.includes(deviceType)) {
        // Check for actions for this device
        for (const action of this.deviceActions[deviceType]) {
          if (lowerMessage.includes(action)) {
            // Extract parameters (very basic implementation)
            let parameters = [];
            
            if (deviceType === 'lights' && action === 'change color') {
              // Extract color
              const colorMatch = lowerMessage.match(/(?:to|with|color) (red|blue|green|yellow|white|warm|cool)/i);
              if (colorMatch) {
                parameters.push(colorMatch[1]);
              }
            } else if (deviceType === 'thermostat' && action === 'set temperature') {
              // Extract temperature
              const tempMatch = lowerMessage.match(/(\d+)(?:\s*degrees)?/i);
              if (tempMatch) {
                parameters.push(`${tempMatch[1]} degrees`);
              }
            }
            
            return {
              type: 'device_control',
              device: deviceType,
              action,
              parameters
            };
          }
        }
        
        // Found device but no specific action
        return {
          type: 'device_info',
          device: deviceType,
          action: 'status'
        };
      }
    }
    
    // No device detected
    return {
      type: 'unknown'
    };
  }
  
  generateDeviceSuggestions(deviceType) {
    // Generate device-specific suggestions
    switch (deviceType) {
      case 'lights':
        return [
          "Turn off the lights",
          "Dim the lights to 50%",
          "Change the lights to blue"
        ];
      case 'thermostat':
        return [
          "What's the current temperature?",
          "Set the thermostat to 72 degrees",
          "Turn on the AC"
        ];
      default:
        return this.generateSuggestions('', '');
    }
  }
  
  generateSuggestions(lastMessage, lastResponse) {
    return [
      "Turn on the lights",
      "What's the temperature inside?",
      "Is the front door locked?",
      "Play some music in the living room"
    ];
  }
}

// Export agent classes
export {
  BaseAgent,
  PrimaryAgent,
  ResearchAgent,
  TaskAgent,
  HomeAutomationAgent
}; 