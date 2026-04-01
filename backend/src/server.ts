import express, { Request, Response } from 'express';
import cors from 'cors';
import { DroneService } from './services/DroneService';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize drone service
const droneService = new DroneService();

// Routes
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.post('/api/connect', async (req: Request, res: Response) => {
  try {
    const success = await droneService.connect();
    res.json({ success, message: success ? 'Connected to drones' : 'Connection failed' });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

app.post('/api/disconnect', async (req: Request, res: Response) => {
  try {
    await droneService.disconnect();
    res.json({ success: true, message: 'Disconnected from drones' });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

app.get('/api/telemetry', async (req: Request, res: Response) => {
  try {
    const telemetry = await droneService.getTelemetry();
    res.json({ success: true, data: telemetry });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

app.post('/api/command', async (req: Request, res: Response) => {
  try {
    const { command } = req.body;
    const result = await droneService.sendCommand(command);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

app.get('/api/status', (req: Request, res: Response) => {
  const status = {
    isConnected: droneService.getConnectionStatus(),
    connectionType: droneService.getConnectionType(),
    timestamp: new Date().toISOString()
  };
  res.json({ success: true, data: status });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 AeroVision AI Backend Server running on port ${PORT}`);
  console.log(`📡 API endpoints available at http://localhost:${PORT}/api`);
});

module.exports = app;
