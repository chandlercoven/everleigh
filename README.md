# Everleigh - Voice AI Project

A voice AI project built with LiveKit for real-time voice interactions, MongoDB for data persistence, and n8n for workflow automation.

## Tech Stack

- **Next.js** - React framework for the web interface
- **MongoDB** - Database for persistent storage of conversations and user data
- **LiveKit** - Real-time audio/video infrastructure
- **n8n** - Workflow automation for agent management
- **OpenAI** - For language model integration
- **ElevenLabs** - For text-to-speech synthesis
- **Deepgram** - For speech-to-text transcription

## Getting Started

1. Clone the repository
```bash
git clone https://github.com/chandlercoven/everleigh.git
cd everleigh
```

2. Install dependencies
```bash
npm install
```

3. Create a `.env.local` file with your API keys
```
# LiveKit Configuration
NEXT_PUBLIC_LIVEKIT_URL=wss://your-livekit-instance.com
LIVEKIT_API_KEY=your_api_key
LIVEKIT_API_SECRET=your_api_secret

# OpenAI and Voice Services
OPENAI_API_KEY=your_openai_api_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key
DEEPGRAM_API_KEY=your_deepgram_api_key

# MongoDB Configuration
MONGODB_URI=mongodb+srv://everleigh:<password>@cluster0.mongodb.net/everleigh?retryWrites=true&w=majority
MONGODB_PASSWORD=your_mongodb_password

# n8n Workflow Configuration
N8N_SERVER_URL=https://n8n.example.com
N8N_API_KEY=your_n8n_api_key
```

4. Run the development server
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
everleigh/
├── pages/           # Next.js pages
│   ├── api/         # API endpoints
│   │   ├── conversations/ # Conversation API endpoints
│   │   └── workflows/     # n8n workflow endpoints
│   └── index.js     # Home page
├── components/      # React components
├── lib/             # Utility functions and configurations
│   ├── models/      # Mongoose data models
│   └── middleware/  # API middleware (auth, rate limiting)
├── scripts/         # Setup and utility scripts
├── public/          # Static assets
└── styles/          # CSS styles
```

## Voice Agent Features

- Real-time speech-to-text with OpenAI Whisper
- Natural language understanding with GPT-4o
- High-quality text-to-speech with ElevenLabs
- Voice activity detection with Silero
- Persistent conversation history with MongoDB
- Workflow automation with n8n

## Database Configuration

The project uses MongoDB for persistent storage:

1. **Local Development**
   - A MongoDB connection string is provided in `.env.local`
   - The database is automatically set up on first run

2. **Production Deployment**
   - Set up a MongoDB Atlas cluster or self-hosted MongoDB instance
   - Update the `MONGODB_URI` and `MONGODB_PASSWORD` in your environment
   - Run `npm run setup:db` to initialize database indexes

## Workflow Automation with n8n

The project uses n8n for workflow automation to:
1. Manage conversation flows
2. Integrate with external services (weather, calendar, email, reminders)
3. Handle multi-step agent interactions
4. Process and store conversation data

## Security Features

- API rate limiting to prevent abuse
- Proper authentication for API endpoints
- Secure credential management
- MongoDB indexes for performance optimization

## Future Enhancements

- Add authentication system
- Implement voice agent memory
- Integrate with calendar and task management systems
- Add support for multi-user conversations

## API Key Configuration

To run Everleigh, you need to obtain several API keys and add them to your `.env.local` file:

1. **OpenAI API Key**
   - Sign up at https://platform.openai.com
   - Create an API key in the dashboard
   - Add to `.env.local` as `OPENAI_API_KEY`

2. **LiveKit API Keys**
   - Sign up at https://livekit.io
   - Create a new project and get your API key and secret
   - Add to `.env.local` as:
     ```
     NEXT_PUBLIC_LIVEKIT_URL=wss://your-project.livekit.cloud
     LIVEKIT_API_KEY=your_api_key
     LIVEKIT_API_SECRET=your_api_secret
     LIVEKIT_API_URL=https://your-project.livekit.cloud
     ```

3. **ElevenLabs API Key**
   - Sign up at https://elevenlabs.io
   - Get your API key from your profile
   - Add to `.env.local` as `ELEVENLABS_API_KEY`

4. **Deepgram API Key** (optional for alternative speech-to-text)
   - Sign up at https://deepgram.com
   - Create a new project and API key
   - Add to `.env.local` as `DEEPGRAM_API_KEY`

## Development Server

After configuring your API keys, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application running. 