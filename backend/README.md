# AeroVision AI Backend

## Overview
This is the backend server for AeroVision AI, providing REST API endpoints for drone control and telemetry.

## Installation
```bash
npm install
```

## Development
```bash
npm run dev
```

## Production
```bash
npm run build
npm start
```

## API Endpoints

### Health Check
- **GET** `/api/health` - Check server status

### Drone Connection
- **POST** `/api/connect` - Connect to drones
- **POST** `/api/disconnect` - Disconnect from drones
- **GET** `/api/status` - Get connection status

### Drone Operations
- **GET** `/api/telemetry` - Get drone telemetry data
- **POST** `/api/command` - Send command to drones

## Features
- Express.js server with TypeScript
- CORS support for frontend integration
- Drone service abstraction layer
- RESTful API design
- Error handling and logging
- Health check endpoint

## Environment Variables
- `PORT` - Server port (default: 3001)

## Dependencies
- Express.js for web server
- CORS for cross-origin requests
- TypeScript for type safety
