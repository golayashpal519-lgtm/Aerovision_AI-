const express = require('express');
const cors = require('cors');
const { DroneService } = require('./services/DroneService');

const app = express();
const PORT = process.env.PORT || 3003;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize drone service
const droneService = new DroneService();

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.post('/api/connect', async (req, res) => {
  try {
    const success = await droneService.connect();
    res.json({ success, message: success ? 'Connected to drones' : 'Connection failed' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/disconnect', async (req, res) => {
  try {
    await droneService.disconnect();
    res.json({ success: true, message: 'Disconnected from drones' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/telemetry', async (req, res) => {
  try {
    const telemetry = await droneService.getTelemetry();
    res.json({ success: true, data: telemetry });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/command', async (req, res) => {
  try {
    const { command } = req.body;
    const result = await droneService.sendCommand(command);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/status', (req, res) => {
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
