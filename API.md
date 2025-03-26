# Everleigh Voice AI API Documentation

## Overview

The Everleigh API provides endpoints for voice processing, authentication, and workflow management. This document outlines the available endpoints, request/response formats, and authentication requirements.

## Base URL

All API endpoints are relative to: `https://everleigh.ai/api/`

## Authentication

The API uses JWT-based authentication. Most endpoints require a valid authentication token.

### Login
Authenticates a user and returns a JWT token for API access.

**Endpoint:** `POST /api/auth/login`  
**Content-Type:** `application/json`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Success Response (200 OK):**
```json
{
  "data": {
    "user": {
      "id": "1",
      "name": "User Name",
      "email": "user@example.com"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "timestamp": "2025-03-21T22:49:08.037Z"
}
```

**Error Responses:**
- 400 Bad Request: Missing email or password
- 401 Unauthorized: Invalid credentials
- 500 Internal Server Error: Server-side error

### Get Current Session
Returns the currently authenticated user based on the JWT token.

**Endpoint:** `GET /api/auth/session`  
**Headers:** `Authorization: Bearer <token>`

**Success Response (200 OK) - Authenticated:**
```json
{
  "data": {
    "user": {
      "id": "1",
      "name": "User Name",
      "email": "user@example.com"
    }
  },
  "timestamp": "2025-03-21T22:49:08.037Z"
}
```

**Success Response (200 OK) - Not Authenticated:**
```json
{
  "data": {
    "user": null
  },
  "timestamp": "2025-03-21T22:49:08.037Z"
}
```

## Voice Processing

### Transcribe Audio
Transcribes audio into text.

**Endpoint:** `POST /api/transcribe`  
**Content-Type:** `multipart/form-data`  
**Authentication:** Required

**Request Body:**
- `audio`: Audio file (WAV, MP3, or OGG format)

**Success Response (200 OK):**
```json
{
  "data": {
    "text": "This is the transcribed text from the audio file.",
    "confidence": 0.95,
    "duration": 10.5
  },
  "timestamp": "2025-03-21T22:49:08.037Z"
}
```

### Text to Speech
Converts text to speech audio.

**Endpoint:** `POST /api/text-to-speech`  
**Content-Type:** `application/json`  
**Authentication:** Required

**Request Body:**
```json
{
  "text": "Text to be converted to speech",
  "voice": "alloy" // Optional, defaults to system default
}
```

**Success Response (200 OK):**
```json
{
  "data": {
    "audioUrl": "https://everleigh.ai/audio/generated/12345.mp3",
    "duration": 3.5
  },
  "timestamp": "2025-03-21T22:49:08.037Z"
}
```

### Process Voice Message
Processes voice input for AI response.

**Endpoint:** `POST /api/process-voice`  
**Content-Type:** `multipart/form-data`  
**Authentication:** Required

**Request Body:**
- `audio`: Audio file containing the voice message
- `conversationId`: Optional conversation ID for context

**Success Response (200 OK):**
```json
{
  "data": {
    "message": "The transcribed user message",
    "response": "The AI response to the message",
    "conversationId": "conversation_12345",
    "audioResponse": "https://everleigh.ai/audio/response/12345.mp3"
  },
  "timestamp": "2025-03-21T22:49:08.037Z"
}
```

## LiveKit Integration

### Get LiveKit Token
Generates a LiveKit token for real-time audio/video.

**Endpoint:** `POST /api/get-livekit-token`  
**Content-Type:** `application/json`  
**Authentication:** Required

**Request Body:**
```json
{
  "username": "user_name",
  "room": "room_name"
}
```

**Success Response (200 OK):**
```json
{
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "room": "room_name"
  },
  "timestamp": "2025-03-21T22:49:08.037Z"
}
```

### Create Room
Creates a new LiveKit room.

**Endpoint:** `POST /api/create-room`  
**Content-Type:** `application/json`  
**Authentication:** Required

**Request Body:**
```json
{
  "name": "room_name",
  "emptyTimeout": 300 // Optional, in seconds
}
```

**Success Response (200 OK):**
```json
{
  "data": {
    "room": {
      "name": "room_name",
      "sid": "RM_1234567890abcdef",
      "emptyTimeout": 300,
      "creationTime": "2025-03-21T22:49:08.037Z"
    }
  },
  "timestamp": "2025-03-21T22:49:08.037Z"
}
```

## Workflows

### List Workflows
Lists available workflows.

**Endpoint:** `GET /api/workflows`  
**Authentication:** Required

**Success Response (200 OK):**
```json
{
  "data": {
    "workflows": [
      {
        "id": "wf_123",
        "name": "Weather Check",
        "description": "Checks weather for a location",
        "type": "weather"
      },
      {
        "id": "wf_456",
        "name": "Calendar Event",
        "description": "Creates a calendar event",
        "type": "calendar"
      }
    ]
  },
  "timestamp": "2025-03-21T22:49:08.037Z"
}
```

### Trigger Workflow
Triggers a specific workflow.

**Endpoint:** `POST /api/workflows/trigger`  
**Content-Type:** `application/json`  
**Authentication:** Required

**Request Body:**
```json
{
  "workflowId": "wf_123",
  "data": {
    "location": "New York",
    "date": "2025-03-22"
  }
}
```

**Success Response (200 OK):**
```json
{
  "data": {
    "workflowId": "wf_123",
    "status": "completed",
    "result": {
      "temperature": 72,
      "conditions": "Sunny",
      "location": "New York, NY"
    }
  },
  "timestamp": "2025-03-21T22:49:08.037Z"
}
```

## Conversations

### List Conversations
Lists user's conversations.

**Endpoint:** `GET /api/conversations`  
**Authentication:** Required

**Query Parameters:**
- `limit`: Maximum number of conversations to return (default: 20)
- `offset`: Offset for pagination (default: 0)

**Success Response (200 OK):**
```json
{
  "data": {
    "conversations": [
      {
        "id": "conv_123",
        "title": "Weather inquiry",
        "lastMessage": "What's the weather like in Paris?",
        "createdAt": "2025-03-20T15:30:45.123Z",
        "updatedAt": "2025-03-20T15:32:12.456Z"
      },
      {
        "id": "conv_456",
        "title": "Meeting scheduling",
        "lastMessage": "Schedule a meeting with the team tomorrow",
        "createdAt": "2025-03-19T09:15:30.789Z",
        "updatedAt": "2025-03-19T09:18:22.345Z"
      }
    ],
    "total": 32,
    "limit": 20,
    "offset": 0
  },
  "timestamp": "2025-03-21T22:49:08.037Z"
}
```

### Get Conversation
Retrieves a specific conversation with messages.

**Endpoint:** `GET /api/conversations/{conversationId}`  
**Authentication:** Required

**Success Response (200 OK):**
```json
{
  "data": {
    "conversation": {
      "id": "conv_123",
      "title": "Weather inquiry",
      "createdAt": "2025-03-20T15:30:45.123Z",
      "updatedAt": "2025-03-20T15:32:12.456Z",
      "messages": [
        {
          "id": "msg_1",
          "role": "user",
          "content": "What's the weather like in Paris?",
          "timestamp": "2025-03-20T15:30:45.123Z"
        },
        {
          "id": "msg_2",
          "role": "assistant",
          "content": "It's currently 18°C and partly cloudy in Paris.",
          "timestamp": "2025-03-20T15:31:02.789Z"
        }
      ]
    }
  },
  "timestamp": "2025-03-21T22:49:08.037Z"
}
```

## Error Responses

All endpoints use a standard error response format:

```json
{
  "error": {
    "status": 400,
    "message": "Error description message",
    "details": [] // Optional additional error details
  },
  "timestamp": "2025-03-21T22:49:08.037Z"
}
```

Common HTTP status codes:
- 400: Bad Request - Invalid input
- 401: Unauthorized - Authentication required
- 403: Forbidden - Insufficient permissions
- 404: Not Found - Resource not found
- 429: Too Many Requests - Rate limit exceeded
- 500: Internal Server Error - Server-side error

## Rate Limiting

API endpoints have rate limiting to ensure fair usage. The default limits are:
- 100 requests per 15 minutes for most endpoints
- 30 requests per 15 minutes for resource-intensive endpoints (e.g., voice processing)

If rate limits are exceeded, the API will return a 429 status code.

## Versioning

The current API version is v1. Future versions will be accessible at `/api/v2/`, etc.

## Changelog

- 2025-03-21: Initial API documentation
- 2025-03-22: Added conversation endpoints
- 2025-03-25: Enhanced workflow API with more options

## Usage Example

```bash
# Login and get token
TOKEN=$(curl -s -X POST -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}' \
  http://api.everleigh.ai/api/auth/login | jq -r .token)

# Use token to access protected resources
curl -H "Authorization: Bearer $TOKEN" http://api.everleigh.ai/api/auth/session
curl -H "Authorization: Bearer $TOKEN" http://api.everleigh.ai/api/protected
``` 