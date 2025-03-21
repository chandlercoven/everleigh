# Everleigh Voice AI API Documentation

## Authentication

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
  "user": {
    "id": "1",
    "name": "User Name",
    "email": "user@example.com"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
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
  "user": {
    "id": "1",
    "name": "User Name",
    "email": "user@example.com"
  }
}
```

**Success Response (200 OK) - Not Authenticated:**
```json
{
  "user": null
}
```

**Error Response:**
- 500 Internal Server Error: Server-side error

## Protected Endpoints

### Protected Example
Example of a protected endpoint that requires authentication.

**Endpoint:** `GET /api/protected`  
**Headers:** `Authorization: Bearer <token>`

**Success Response (200 OK):**
```json
{
  "message": "This is a protected endpoint",
  "user": {
    "id": "1",
    "name": "User Name",
    "email": "user@example.com"
  },
  "timestamp": "2025-03-21T22:49:08.037Z"
}
```

**Error Response:**
- 401 Unauthorized: Missing or invalid token

## Public Endpoints

### Test Endpoint
Simple test endpoint to check API connectivity.

**Endpoint:** `GET /api/test`

**Success Response (200 OK):**
```json
{
  "status": "ok",
  "message": "API is working!"
}
```

### More API endpoints will be documented as they're implemented.

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