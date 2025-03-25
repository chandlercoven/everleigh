# Everleigh - Advanced Voice Assistant Platform

A sophisticated, multi-agent voice assistant system with offline capabilities, telephony integration, and extensible skills.

## Core Components Implemented

### 1. Enhanced Voice User Experience
- Responsive animations with state-based visualizations
- Haptic feedback for mobile devices
- Advanced audio visualizations
- Context-aware UI elements

### 2. Multi-Agent Orchestration System
- Routing logic for specialized agents
- Shared memory between agents
- Context retention and conversation management
- Agent personality and voice customization

### 3. Extensible Skills System
- Support for different skill types (JavaScript, API, n8n)
- Skill parameter validation and management
- Testing and management interface
- Category-based organization

### 4. Offline Capabilities
- IndexedDB-based persistent storage
- Basic offline command processing
- Request queuing and syncing
- Network state management

### 5. Telephony Integration
- Inbound and outbound calling
- SMS messaging
- Real-time audio processing
- Webhook management for Twilio

### 6. Admin Dashboard
- Agent management interface
- Skill configuration and testing
- System statistics and monitoring
- Memory management

## Next Steps

1. **Integration**
   - Connect UI components to backend services
   - Implement authentication and user management
   - Set up proper AWS configuration for deployment

2. **Agent Implementation**
   - Complete specialized agent implementations (Research, Task, Home)
   - Enhance intent classification
   - Add domain-specific knowledge bases

3. **Testing**
   - End-to-end testing of voice processing
   - Network resilience testing
   - Performance optimization

4. **Documentation**
   - API documentation
   - User guides
   - Deployment instructions

## Getting Started

### Prerequisites
- Node.js 18+
- AWS account for deployment
- Twilio account for telephony (optional)

### Installation
```bash
# Clone the repository
git clone <repository-url>

# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Configuration
Create a `.env` file in the root directory with the following variables:
```
NODE_ENV=production
PORT=3000
SERVER_DOMAIN=your-domain.com

# Twilio (optional)
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PERSONAL_NUMBER=+1234567890
TWILIO_WORK_NUMBER=+1234567891

# n8n (optional)
N8N_API_URL=https://your-n8n-instance.com
N8N_API_KEY=your-api-key
```

## Architecture

The system is built with a modular architecture:

```
├── components/        # UI components
│   ├── dashboard/     # Admin dashboard components
│   └── ui/            # Voice UI components
├── lib/               # Core functionality
│   ├── orchestrator/  # Multi-agent coordination
│   ├── skills/        # Extensible skills system
│   ├── telephony/     # Voice and SMS integration
│   ├── offline/       # Offline functionality
│   └── hooks/         # React hooks
└── pages/             # Application pages
```

## Tech Stack

- **Frontend**: React, Material UI
- **Backend**: Node.js, Express
- **Storage**: IndexedDB (client), MongoDB (server)
- **Voice Processing**: WebRTC, Web Audio API
- **Telephony**: Twilio
- **Automation**: n8n

## License

This project is licensed under the MIT License - see the LICENSE.md file for details. 