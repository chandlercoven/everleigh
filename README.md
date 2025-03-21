# Everleigh - Voice AI Project

A voice AI project built with LiveKit for real-time voice interactions.

## Tech Stack

- **Next.js** - React framework for the web interface
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
NEXT_PUBLIC_LIVEKIT_URL=wss://your-livekit-instance.com
LIVEKIT_API_KEY=your_api_key
LIVEKIT_API_SECRET=your_api_secret
OPENAI_API_KEY=your_openai_api_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key
DEEPGRAM_API_KEY=your_deepgram_api_key
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
│   └── index.js     # Home page
├── components/      # React components
├── lib/             # Utility functions and voice agent setup
├── public/          # Static assets
└── styles/          # CSS styles
```

## Voice Agent Features

- Real-time speech-to-text with OpenAI Whisper
- Natural language understanding with GPT-4o
- High-quality text-to-speech with ElevenLabs
- Voice activity detection with Silero

## Workflow Automation with n8n

The project uses n8n for workflow automation to:
1. Manage conversation flows
2. Integrate with external services
3. Handle multi-step agent interactions
4. Process and store conversation data

## Future Enhancements

- Add authentication system
- Implement voice agent memory
- Integrate with calendar and task management systems
- Add support for multi-user conversations 