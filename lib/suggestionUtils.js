/**
 * Utility functions for generating contextual voice command suggestions
 */

// Available suggestion categories
const SUGGESTION_CATEGORIES = {
  GENERAL: 'general',
  WEATHER: 'weather',
  TIME: 'time',
  NEWS: 'news',
  HELP: 'help',
  FOLLOW_UP: 'follow_up',
};

// Command patterns by category
const SUGGESTION_PATTERNS = {
  [SUGGESTION_CATEGORIES.GENERAL]: [
    "What can you do?",
    "Tell me a joke",
    "What's the weather like?",
    "What time is it?",
    "How are you?",
    "What's your name?",
    "What's the latest news?",
  ],
  [SUGGESTION_CATEGORIES.WEATHER]: [
    "What's the forecast for tomorrow?",
    "Will it rain this weekend?",
    "What's the temperature now?",
    "How's the weather in London?",
    "Is it sunny today?",
  ],
  [SUGGESTION_CATEGORIES.TIME]: [
    "What's the time in Tokyo?",
    "What date is it today?",
    "How many days until Christmas?",
    "What's the time zone difference between New York and London?",
    "What day is July 4th?",
  ],
  [SUGGESTION_CATEGORIES.NEWS]: [
    "What's happening in the world?",
    "Tell me the latest tech news",
    "What's the latest in sports?",
    "What are the top headlines today?",
    "Any breaking news?",
  ],
  [SUGGESTION_CATEGORIES.HELP]: [
    "What commands can I use?",
    "How do I change settings?",
    "Help me with voice commands",
    "What can you tell me?",
    "List your capabilities",
  ],
};

/**
 * Contextual follow-up generators for specific topics
 * Each function takes the current context and returns relevant suggestions
 */
const contextualFollowUps = {
  weather: (context) => {
    const location = context.location || '';
    return [
      location ? `What about tomorrow in ${location}?` : "What about tomorrow?",
      "Will it rain this weekend?",
      location ? `What's the temperature in ${location} now?` : "What's the temperature now?",
    ];
  },
  news: () => [
    "Tell me more about that",
    "What's the latest in technology?", 
    "Any updates on this story?",
    "What do experts say about this?",
  ],
  time: () => [
    "What day of the week is it?",
    "How many days until the weekend?",
    "What's the date tomorrow?",
  ],
  joke: () => [
    "Tell me another joke",
    "Do you know any riddles?",
    "That was funny, tell me another one",
  ],
  general: () => [
    "Can you repeat that?",
    "Tell me more about that",
    "How does that work?",
  ],
};

/**
 * Parse message context to determine appropriate follow-up suggestions
 * @param {string} message - The user's message
 * @param {string} response - The assistant's response
 * @returns {Object} Containing the detected intent and context details
 */
function parseMessageContext(message, response) {
  const messageLC = message?.toLowerCase() || '';
  const responseLC = response?.toLowerCase() || '';
  
  // Very basic intent detection based on keywords
  // In a production system, this would use a more sophisticated NLU system
  const context = {
    intent: 'unknown',
    location: extractLocation(message),
  };
  
  if (messageLC.includes('weather') || responseLC.includes('weather') || 
      messageLC.includes('temperature') || responseLC.includes('temperature') ||
      messageLC.includes('forecast') || responseLC.includes('forecast')) {
    context.intent = 'weather';
  } else if (messageLC.includes('news') || responseLC.includes('news') || 
             messageLC.includes('headline') || responseLC.includes('headline') ||
             messageLC.includes('happening') || responseLC.includes('happening')) {
    context.intent = 'news';
  } else if (messageLC.includes('time') || responseLC.includes('time') || 
             messageLC.includes('date') || responseLC.includes('date') ||
             messageLC.includes('day') || responseLC.includes('day')) {
    context.intent = 'time';
  } else if (messageLC.includes('joke') || responseLC.includes('joke') || 
             messageLC.includes('funny') || responseLC.includes('funny')) {
    context.intent = 'joke';
  }
  
  return context;
}

/**
 * Very simple location extraction from message
 * In production, you would use a proper NER system
 */
function extractLocation(message) {
  if (!message) return null;
  
  const inPattern = /in\s([A-Za-z\s]+)(?:$|[,.?!])/i;
  const forPattern = /for\s([A-Za-z\s]+)(?:$|[,.?!])/i;
  
  const inMatch = message.match(inPattern);
  const forMatch = message.match(forPattern);
  
  if (inMatch && inMatch[1]) {
    return inMatch[1].trim();
  }
  
  if (forMatch && forMatch[1]) {
    return forMatch[1].trim();
  }
  
  return null;
}

/**
 * Generate context-aware follow-up suggestions based on conversation
 * @param {string} message - The user's message
 * @param {string} response - The assistant's response
 * @param {number} count - The number of suggestions to generate (default: 3)
 * @returns {Array} Array of suggestion strings
 */
export function generateFollowUpSuggestions(message, response, count = 3) {
  const context = parseMessageContext(message, response);
  
  let suggestions = [];
  
  // If we detected a specific intent with a dedicated follow-up generator, use it
  if (context.intent !== 'unknown' && contextualFollowUps[context.intent]) {
    suggestions = contextualFollowUps[context.intent](context);
  } else {
    // Fallback to general follow-ups
    suggestions = contextualFollowUps.general();
  }
  
  // Return the requested number of suggestions, shuffle to add variety
  return shuffleArray(suggestions).slice(0, count);
}

/**
 * Generate general conversation starter suggestions
 * @param {string} category - Optional category to filter suggestions
 * @param {number} count - Number of suggestions to return
 * @returns {Array} Array of suggestion strings
 */
export function generateConversationStarters(category = SUGGESTION_CATEGORIES.GENERAL, count = 3) {
  let pool = [];
  
  if (category && SUGGESTION_PATTERNS[category]) {
    pool = [...SUGGESTION_PATTERNS[category]];
  } else {
    // Use general suggestions if category not specified or invalid
    pool = [...SUGGESTION_PATTERNS[SUGGESTION_CATEGORIES.GENERAL]];
  }
  
  return shuffleArray(pool).slice(0, count);
}

/**
 * Shuffle an array using Fisher-Yates algorithm
 * @param {Array} array - The array to shuffle
 * @returns {Array} - The shuffled array
 */
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Export categories for external use
export const SuggestionCategories = SUGGESTION_CATEGORIES; 