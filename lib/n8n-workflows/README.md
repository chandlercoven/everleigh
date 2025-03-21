# n8n Workflows for Voice AI

This directory contains n8n workflow configurations that can be imported into an n8n instance to manage voice agent flows.

## Workflows

- `voice-agent-flow.json` - A basic workflow that processes voice agent interactions, detects intents, and generates appropriate responses.

## How to Use

1. Install n8n locally or use n8n cloud
2. Import the workflow JSON file into your n8n instance
3. Configure any required API keys and connections
4. Activate the workflow

## Integration with Voice Agent

These workflows can be called from your voice agent code to:

1. Process user messages
2. Determine user intent
3. Generate appropriate responses
4. Store conversation history
5. Connect to external services

## Custom Intents

The sample workflow includes basic intent detection for:

- Weather inquiries
- Time/date questions
- Help requests

You can extend the intent detection logic to handle more complex scenarios relevant to your voice AI project. 