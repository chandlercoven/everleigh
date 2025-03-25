/**
 * Telephony Service
 * 
 * Manages inbound and outbound calls, messaging, and voice interaction
 */

class TelephonyService {
  constructor(config = {}) {
    // Initialize with Twilio credentials and options
    this.twilioClient = null;
    this.accountSid = config.accountSid || process.env.TWILIO_ACCOUNT_SID;
    this.authToken = config.authToken || process.env.TWILIO_AUTH_TOKEN;
    this.serverDomain = config.serverDomain || process.env.SERVER_DOMAIN;
    
    // Phone numbers
    this.phoneNumbers = {
      personal: config.personalNumber || process.env.TWILIO_PERSONAL_NUMBER,
      work: config.workNumber || process.env.TWILIO_WORK_NUMBER,
      default: config.defaultNumber || process.env.TWILIO_DEFAULT_NUMBER
    };
    
    // Audio processing tools
    this.speechRecognition = config.speechRecognition || null;
    this.textToSpeech = config.textToSpeech || null;
    
    // Tracking active calls
    this.activeCallId = null;
    this.activeCallData = null;
    
    // Orchestrator for processing messages
    this.orchestrator = config.orchestrator || null;
    
    // WebSocket for media streaming
    this.mediaStreamWs = null;
    
    // Initialize Twilio client if credentials are available
    if (this.accountSid && this.authToken) {
      this.initTwilioClient();
    }
  }
  
  /**
   * Initialize Twilio client
   */
  initTwilioClient() {
    try {
      // Use require for server-side execution only
      // In browser environments, Twilio.js should be loaded separately
      if (typeof window === 'undefined') {
        const Twilio = require('twilio');
        this.twilioClient = new Twilio(this.accountSid, this.authToken);
        console.log('Twilio client initialized');
      } else {
        console.warn('Twilio client must be initialized server-side');
      }
    } catch (error) {
      console.error('Failed to initialize Twilio client:', error);
    }
  }
  
  /**
   * Set up webhook handlers for Twilio events
   * @param {Express} app Express application instance
   */
  setupWebhooks(app) {
    if (!app) {
      console.error('No Express app provided for webhooks');
      return;
    }
    
    try {
      // Handle incoming calls
      app.post('/api/telephony/incoming-call', this.handleIncomingCall.bind(this));
      
      // Handle call status updates
      app.post('/api/telephony/call-status', this.handleCallStatus.bind(this));
      
      // Handle incoming SMS
      app.post('/api/telephony/incoming-sms', this.handleIncomingSMS.bind(this));
      
      // Handle outbound calls
      app.post('/api/telephony/outbound-call-handler', this.handleOutboundCall.bind(this));
      
      console.log('Telephony webhooks configured');
    } catch (error) {
      console.error('Failed to set up telephony webhooks:', error);
    }
  }
  
  /**
   * Handle an incoming call webhook from Twilio
   * @param {Request} req Express request object
   * @param {Response} res Express response object
   */
  async handleIncomingCall(req, res) {
    // Validate the Twilio request signature
    if (!this.validateTwilioRequest(req)) {
      console.error('Invalid Twilio request signature');
      return res.status(403).send('Forbidden');
    }
    
    console.log('Incoming call from:', req.body.From);
    
    try {
      // Create TwiML response
      const VoiceResponse = require('twilio').twiml.VoiceResponse;
      const twiml = new VoiceResponse();
      
      // Store call details
      this.activeCallId = req.body.CallSid;
      this.activeCallData = {
        from: req.body.From,
        to: req.body.To,
        callStatus: req.body.CallStatus,
        direction: 'inbound',
        startTime: new Date()
      };
      
      // Initial greeting 
      twiml.say({
        voice: 'Polly.Joanna-Neural',
        language: 'en-US'
      }, 'Hello! This is your AI assistant. How can I help you today?');
      
      // Start media stream for real-time audio processing
      twiml.connect().stream({
        url: `wss://${this.serverDomain}/twilio-media-stream`,
        trackAttributes: { name: 'inbound_track' }
      });
      
      // Send TwiML response
      res.type('text/xml');
      res.send(twiml.toString());
      
      // Notify the orchestrator
      this.notifyOrchestrator('call_started', {
        callId: this.activeCallId,
        from: req.body.From,
        to: req.body.To
      });
    } catch (error) {
      console.error('Error handling incoming call:', error);
      res.status(500).send('Error processing call');
    }
  }
  
  /**
   * Handle outbound call webhook from Twilio
   * @param {Request} req Express request object
   * @param {Response} res Express response object
   */
  async handleOutboundCall(req, res) {
    if (!this.validateTwilioRequest(req)) {
      return res.status(403).send('Forbidden');
    }
    
    try {
      // Create TwiML response
      const VoiceResponse = require('twilio').twiml.VoiceResponse;
      const twiml = new VoiceResponse();
      
      // Start call with a greeting
      twiml.say({
        voice: 'Polly.Joanna-Neural',
        language: 'en-US'
      }, 'Hello, this is your AI assistant calling. How can I help you today?');
      
      // Start media stream for real-time audio processing
      twiml.connect().stream({
        url: `wss://${this.serverDomain}/twilio-media-stream`,
        trackAttributes: { name: 'outbound_track' }
      });
      
      // Send TwiML response
      res.type('text/xml');
      res.send(twiml.toString());
    } catch (error) {
      console.error('Error handling outbound call:', error);
      res.status(500).send('Error processing call');
    }
  }
  
  /**
   * Handle call status updates from Twilio
   * @param {Request} req Express request object
   * @param {Response} res Express response object
   */
  async handleCallStatus(req, res) {
    if (!this.validateTwilioRequest(req)) {
      return res.status(403).send('Forbidden');
    }
    
    const callSid = req.body.CallSid;
    const callStatus = req.body.CallStatus;
    
    console.log(`Call ${callSid} status update: ${callStatus}`);
    
    try {
      // Update active call data if it's our tracked call
      if (callSid === this.activeCallId) {
        this.activeCallData = {
          ...this.activeCallData,
          callStatus,
          lastUpdate: new Date()
        };
        
        // Handle call ended
        if (['completed', 'failed', 'busy', 'no-answer', 'canceled'].includes(callStatus)) {
          // Notify orchestrator
          this.notifyOrchestrator('call_ended', {
            callId: this.activeCallId,
            status: callStatus,
            duration: req.body.CallDuration || 0
          });
          
          // Clear active call data
          this.activeCallId = null;
          this.activeCallData = null;
        }
      }
      
      // Acknowledge the status update
      res.status(200).send('Status update received');
    } catch (error) {
      console.error('Error processing call status update:', error);
      res.status(500).send('Error processing status update');
    }
  }
  
  /**
   * Handle incoming SMS from Twilio
   * @param {Request} req Express request object
   * @param {Response} res Express response object
   */
  async handleIncomingSMS(req, res) {
    if (!this.validateTwilioRequest(req)) {
      return res.status(403).send('Forbidden');
    }
    
    const from = req.body.From;
    const to = req.body.To;
    const messageBody = req.body.Body;
    
    console.log(`SMS from ${from}: ${messageBody}`);
    
    try {
      // Process message with orchestrator
      let response = null;
      if (this.orchestrator) {
        response = await this.orchestrator.routeMessage(messageBody, {
          source: 'sms',
          from,
          to
        });
      } else {
        response = {
          text: 'Thank you for your message. Our AI assistant is currently unavailable.',
          actions: []
        };
      }
      
      // Create TwiML response
      const MessagingResponse = require('twilio').twiml.MessagingResponse;
      const twiml = new MessagingResponse();
      
      // Add message
      twiml.message(response.text);
      
      // Send TwiML response
      res.type('text/xml');
      res.send(twiml.toString());
      
      // Notify orchestrator
      this.notifyOrchestrator('sms_received', {
        from,
        to,
        messageBody,
        responseText: response.text
      });
    } catch (error) {
      console.error('Error handling incoming SMS:', error);
      
      // Send basic response on error
      const MessagingResponse = require('twilio').twiml.MessagingResponse;
      const twiml = new MessagingResponse();
      twiml.message('Sorry, I encountered an error processing your message. Please try again later.');
      
      res.type('text/xml');
      res.send(twiml.toString());
    }
  }
  
  /**
   * Validate a Twilio webhook request
   * @param {Request} req Express request object
   * @returns {boolean} Whether the request is valid
   */
  validateTwilioRequest(req) {
    // Skip validation in development or if not configured
    if (process.env.NODE_ENV === 'development' || !this.authToken) {
      return true;
    }
    
    try {
      // Use Twilio validator
      const validator = require('twilio').validateRequest;
      const signature = req.headers['x-twilio-signature'] || '';
      const url = req.protocol + '://' + req.get('host') + req.originalUrl;
      
      return validator(this.authToken, signature, url, req.body);
    } catch (error) {
      console.error('Error validating Twilio request:', error);
      return false;
    }
  }
  
  /**
   * Notify the orchestrator of telephony events
   * @param {string} eventType Type of event
   * @param {Object} eventData Event data
   */
  notifyOrchestrator(eventType, eventData) {
    if (!this.orchestrator) {
      console.warn('No orchestrator available for notification');
      return;
    }
    
    try {
      // Different handling based on event type
      switch (eventType) {
        case 'call_started':
          console.log(`Call started: ${eventData.callId}`);
          break;
          
        case 'call_ended':
          console.log(`Call ended: ${eventData.callId}`);
          break;
          
        case 'sms_received':
          console.log(`SMS received from ${eventData.from}`);
          break;
          
        default:
          console.log(`Telephony event: ${eventType}`);
          break;
      }
      
      // Pass to orchestrator if it has the method
      if (typeof this.orchestrator.handleTelephonyEvent === 'function') {
        this.orchestrator.handleTelephonyEvent(eventType, eventData);
      }
    } catch (error) {
      console.error(`Error notifying orchestrator of ${eventType}:`, error);
    }
  }
  
  /**
   * Initiate an outbound call
   * @param {string} to Destination phone number
   * @param {Object} options Call options
   * @returns {Object} Result of call initiation
   */
  async placeCall(to, options = {}) {
    if (!this.twilioClient) {
      return {
        success: false,
        error: 'Twilio client not initialized'
      };
    }
    
    if (!to) {
      return {
        success: false,
        error: 'No destination phone number provided'
      };
    }
    
    // Select source number based on options
    const fromNumber = options.type === 'work' 
      ? this.phoneNumbers.work 
      : this.phoneNumbers.personal || this.phoneNumbers.default;
      
    if (!fromNumber) {
      return {
        success: false,
        error: 'No source phone number configured'
      };
    }
    
    try {
      // Create call via Twilio API
      const call = await this.twilioClient.calls.create({
        to: to,
        from: fromNumber,
        url: `https://${this.serverDomain}/api/telephony/outbound-call-handler`,
        statusCallback: `https://${this.serverDomain}/api/telephony/call-status`,
        statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed']
      });
      
      // Store active call info
      this.activeCallId = call.sid;
      this.activeCallData = {
        from: fromNumber,
        to: to,
        callStatus: 'initiated',
        direction: 'outbound',
        startTime: new Date()
      };
      
      console.log(`Outbound call initiated: ${call.sid}`);
      
      return {
        success: true,
        callId: call.sid
      };
    } catch (error) {
      console.error('Failed to place call:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Send an SMS message
   * @param {string} to Destination phone number
   * @param {string} message Message content
   * @param {Object} options Message options
   * @returns {Object} Result of message sending
   */
  async sendSMS(to, message, options = {}) {
    if (!this.twilioClient) {
      return {
        success: false,
        error: 'Twilio client not initialized'
      };
    }
    
    if (!to || !message) {
      return {
        success: false,
        error: 'Missing destination or message content'
      };
    }
    
    // Select source number based on options
    const fromNumber = options.type === 'work' 
      ? this.phoneNumbers.work 
      : this.phoneNumbers.personal || this.phoneNumbers.default;
      
    if (!fromNumber) {
      return {
        success: false,
        error: 'No source phone number configured'
      };
    }
    
    try {
      // Send message via Twilio API
      const twilioMessage = await this.twilioClient.messages.create({
        body: message,
        from: fromNumber,
        to: to
      });
      
      console.log(`SMS sent: ${twilioMessage.sid}`);
      
      return {
        success: true,
        messageId: twilioMessage.sid
      };
    } catch (error) {
      console.error('Failed to send SMS:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Setup WebSocket server for media streaming
   * @param {http.Server} server HTTP server instance
   */
  setupMediaStreamHandler(server) {
    if (!server) {
      console.error('No server provided for media stream');
      return;
    }
    
    try {
      const WebSocket = require('ws');
      
      // Create WebSocket server
      const wss = new WebSocket.Server({ 
        server, 
        path: '/twilio-media-stream' 
      });
      
      console.log('Media stream WebSocket server created');
      
      // Handle WebSocket connections
      wss.on('connection', (ws) => {
        console.log('New Twilio media stream connected');
        
        ws.on('message', async (message) => {
          try {
            const data = JSON.parse(message);
            
            if (data.event === 'media') {
              // Process incoming audio from the call
              const audio = Buffer.from(data.media.payload, 'base64');
              
              // Process with speech recognition if available
              if (this.speechRecognition && typeof this.speechRecognition.transcribeAudio === 'function') {
                const transcription = await this.speechRecognition.transcribeAudio(audio);
                
                if (transcription && transcription.text) {
                  console.log(`Transcription: ${transcription.text}`);
                  
                  // Process with orchestrator if available
                  if (this.orchestrator) {
                    const response = await this.orchestrator.routeMessage(
                      transcription.text,
                      { 
                        source: 'phone', 
                        callId: this.activeCallId,
                        from: this.activeCallData?.from,
                        to: this.activeCallData?.to
                      }
                    );
                    
                    // Convert response to speech if text-to-speech is available
                    if (response && response.text && this.textToSpeech) {
                      const speechAudio = await this.textToSpeech.generateSpeech(response.text);
                      
                      // Send audio back to the call
                      ws.send(JSON.stringify({
                        event: 'media',
                        streamSid: data.streamSid,
                        media: {
                          payload: speechAudio.toString('base64')
                        }
                      }));
                    }
                  }
                }
              }
            }
          } catch (error) {
            console.error('Error processing media stream:', error);
          }
        });
        
        ws.on('close', () => {
          console.log('Twilio media stream disconnected');
        });
      });
    } catch (error) {
      console.error('Error setting up media stream handler:', error);
    }
  }
  
  /**
   * Convert audio format for speech processing
   * @param {Buffer} audioBuffer Audio buffer
   * @returns {Buffer} Converted audio buffer
   */
  convertAudio(audioBuffer) {
    // This would use audio processing libraries for format conversion
    // For now, just return the original buffer
    return audioBuffer;
  }
  
  /**
   * Get active call information
   * @returns {Object} Active call data
   */
  getActiveCallInfo() {
    if (!this.activeCallId) {
      return null;
    }
    
    return {
      callId: this.activeCallId,
      ...this.activeCallData
    };
  }
  
  /**
   * Check if telephony service is properly configured
   * @returns {boolean} Configuration status
   */
  isConfigured() {
    return !!this.twilioClient;
  }
  
  /**
   * End an active call
   * @param {string} callId Call ID to end (defaults to active call)
   * @returns {Object} Result of call termination
   */
  async endCall(callId = null) {
    if (!this.twilioClient) {
      return {
        success: false,
        error: 'Twilio client not initialized'
      };
    }
    
    const targetCallId = callId || this.activeCallId;
    
    if (!targetCallId) {
      return {
        success: false,
        error: 'No active call to end'
      };
    }
    
    try {
      // End call via Twilio API
      await this.twilioClient.calls(targetCallId).update({
        status: 'completed'
      });
      
      console.log(`Call ended: ${targetCallId}`);
      
      // Clear active call data if it's the active call
      if (targetCallId === this.activeCallId) {
        this.activeCallId = null;
        this.activeCallData = null;
      }
      
      return {
        success: true
      };
    } catch (error) {
      console.error('Failed to end call:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default TelephonyService; 