# Frontend-Backend Integration

This document explains how the frontend application integrates with the backend API.

## Backend Connection

The application supports two modes of operation:

1. **Real Backend Mode**: Connects to the actual backend API running on http://localhost:3000/api
2. **Fake Backend Mode**: Uses an in-memory mock implementation of the API for development and testing

## How It Works

### BackendConnection.js

This file contains the API client for connecting to the real backend. It provides methods for:

- Authentication (login, logout)
- User management
- Employee management
- Department management
- Workflow management
- Request management

### fakeBackend.js

This file provides a mock implementation of the backend API for development and testing. It:
- Simulates API responses with in-memory data
- Checks the `USE_FAKE_BACKEND` flag from config.js
- Proxies requests to the real backend when the flag is set to false

### config.js

This file contains configuration settings including:
- `USE_FAKE_BACKEND`: Controls whether to use the fake backend or real backend
- Stores the setting in localStorage to persist it across page refreshes

### BackendToggle Component

This is a utility component that allows you to easily toggle between fake and real backend modes during development. To use it:

1. Add `<BackendToggle />` to your main App component
2. A small toggle will appear in the corner of the application
3. Click it to switch between fake and real backend modes

## How to Use

### For Development

During development, you can use the fake backend to work independently of the backend team:

1. Set `USE_FAKE_BACKEND` to `true` in config.js or use the toggle
2. This allows you to develop and test frontend features without a running backend

### For Integration Testing

When you want to test with the real backend:

1. Set `USE_FAKE_BACKEND` to `false` in config.js or use the toggle
2. Ensure the backend server is running at http://localhost:3000
3. The frontend will now make real API calls to the backend

## Configuration Notes

- Backend URL: http://localhost:3000/api (configurable in BackendConnection.js)
- The toggle state is stored in localStorage for persistence
- API endpoints follow RESTful conventions 