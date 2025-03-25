/**
 * Built-in skills for the Everleigh Assistant
 * 
 * These skills are always available in the system
 */

const builtInSkills = [
  {
    id: 'current_time',
    config: {
      name: 'Get Current Time',
      description: 'Retrieves the current local time',
      type: 'function',
      category: 'productivity',
      handler: async () => {
        const now = new Date();
        return {
          time: now.toLocaleTimeString(),
          hour: now.getHours(),
          minute: now.getMinutes(),
          second: now.getSeconds()
        };
      },
      parameters: []
    }
  },
  
  {
    id: 'current_date',
    config: {
      name: 'Get Current Date',
      description: 'Retrieves the current date information',
      type: 'function',
      category: 'productivity',
      handler: async () => {
        const now = new Date();
        return {
          date: now.toLocaleDateString(),
          year: now.getFullYear(),
          month: now.getMonth() + 1,
          day: now.getDate(),
          dayOfWeek: now.getDay(),
          dayName: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][now.getDay()]
        };
      },
      parameters: []
    }
  },
  
  {
    id: 'create_reminder',
    config: {
      name: 'Create Reminder',
      description: 'Creates a new reminder for the user',
      type: 'function',
      category: 'productivity',
      handler: async (params) => {
        const { title, time, date, notes } = params;
        
        // In a real implementation, this would connect to a reminder/calendar API
        // For now, we'll just return the reminder details
        
        const reminder = {
          id: `reminder-${Date.now()}`,
          title,
          time,
          date,
          notes,
          created: new Date().toISOString()
        };
        
        // Store in localStorage for demo purposes
        if (typeof localStorage !== 'undefined') {
          const reminders = JSON.parse(localStorage.getItem('reminders') || '[]');
          reminders.push(reminder);
          localStorage.setItem('reminders', JSON.stringify(reminders));
        }
        
        return {
          success: true,
          reminder
        };
      },
      parameters: [
        {
          name: 'title',
          type: 'string',
          description: 'Title or description of the reminder',
          required: true
        },
        {
          name: 'time',
          type: 'string',
          description: 'Time for the reminder (e.g., "3:00 PM")',
          required: false
        },
        {
          name: 'date',
          type: 'string',
          description: 'Date for the reminder (e.g., "2023-06-15")',
          required: false,
          defaultValue: new Date().toISOString().split('T')[0]
        },
        {
          name: 'notes',
          type: 'string',
          description: 'Additional notes for the reminder',
          required: false
        }
      ],
      examples: [
        { title: 'Team meeting', time: '2:00 PM', date: '2023-06-15' },
        { title: 'Take medication', time: '9:00 AM', notes: '50mg dose with food' }
      ]
    }
  },
  
  {
    id: 'get_reminders',
    config: {
      name: 'Get Reminders',
      description: 'Retrieves user reminders',
      type: 'function',
      category: 'productivity',
      handler: async (params) => {
        const { date } = params;
        
        // In a real implementation, this would connect to a reminder/calendar API
        // For now, we'll just return from localStorage
        
        let reminders = [];
        if (typeof localStorage !== 'undefined') {
          reminders = JSON.parse(localStorage.getItem('reminders') || '[]');
        }
        
        // Filter by date if provided
        if (date) {
          reminders = reminders.filter(r => r.date === date);
        }
        
        return {
          success: true,
          reminders,
          count: reminders.length
        };
      },
      parameters: [
        {
          name: 'date',
          type: 'string',
          description: 'Date to filter reminders by (e.g., "2023-06-15")',
          required: false
        }
      ]
    }
  },
  
  {
    id: 'save_note',
    config: {
      name: 'Save Note',
      description: 'Saves a text note',
      type: 'function',
      category: 'productivity',
      handler: async (params) => {
        const { content, title, category } = params;
        
        const note = {
          id: `note-${Date.now()}`,
          title: title || `Note ${new Date().toLocaleString()}`,
          content,
          category: category || 'general',
          created: new Date().toISOString()
        };
        
        // Store in localStorage for demo purposes
        if (typeof localStorage !== 'undefined') {
          const notes = JSON.parse(localStorage.getItem('notes') || '[]');
          notes.push(note);
          localStorage.setItem('notes', JSON.stringify(notes));
        }
        
        return {
          success: true,
          note
        };
      },
      parameters: [
        {
          name: 'content',
          type: 'string',
          description: 'Content of the note',
          required: true
        },
        {
          name: 'title',
          type: 'string',
          description: 'Title of the note',
          required: false
        },
        {
          name: 'category',
          type: 'string',
          description: 'Category for the note',
          required: false,
          defaultValue: 'general'
        }
      ]
    }
  },
  
  {
    id: 'math_calculate',
    config: {
      name: 'Calculate',
      description: 'Performs basic math calculations',
      type: 'function',
      category: 'utility',
      handler: async (params) => {
        const { expression } = params;
        
        // Security measure: only allow basic math operations
        // Remove any characters that aren't numbers, operators, or decimal points
        const sanitizedExpression = expression.replace(/[^0-9+\-*/().]/g, '');
        
        // Use Function constructor with strict mode for safety
        try {
          const result = new Function(`"use strict"; return (${sanitizedExpression})`)();
          return {
            success: true,
            expression: sanitizedExpression,
            result
          };
        } catch (error) {
          return {
            success: false,
            error: 'Invalid expression',
            message: error.message
          };
        }
      },
      parameters: [
        {
          name: 'expression',
          type: 'string',
          description: 'Math expression to evaluate (e.g., "5 + 3 * 2")',
          required: true
        }
      ],
      examples: [
        { expression: '42 + 18' },
        { expression: '100 / 5' },
        { expression: '(7 + 3) * 2' }
      ]
    }
  },
  
  {
    id: 'system_info',
    config: {
      name: 'Get System Information',
      description: 'Retrieves basic system information',
      type: 'function',
      category: 'system',
      handler: async () => {
        // Browser environment
        if (typeof window !== 'undefined') {
          return {
            success: true,
            platform: {
              userAgent: navigator.userAgent,
              platform: navigator.platform,
              language: navigator.language,
              online: navigator.onLine
            },
            screen: {
              width: window.screen.width,
              height: window.screen.height,
              colorDepth: window.screen.colorDepth
            },
            storage: {
              localStorageAvailable: typeof localStorage !== 'undefined',
              sessionStorageAvailable: typeof sessionStorage !== 'undefined'
            }
          };
        }
        
        // Node.js environment
        if (typeof process !== 'undefined') {
          return {
            success: true,
            platform: {
              node: process.version,
              platform: process.platform,
              arch: process.arch
            },
            env: {
              nodeEnv: process.env.NODE_ENV
            }
          };
        }
        
        return {
          success: false,
          error: 'Unknown environment'
        };
      },
      parameters: []
    }
  }
];

export default builtInSkills; 