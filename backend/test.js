// Simple test to verify backend syntax
console.log('🧪 Testing backend modules...');

try {
  // Test if we can require the modules
  const express = require('express');
  const cors = require('cors');
  console.log('✅ Express and CORS modules loaded successfully');
  console.log('📦 Express version:', express.version || 'Unknown');
  
  // Test DroneService
  const { DroneService } = require('./src/services/DroneService');
  console.log('✅ DroneService loaded successfully');
  
  // Test DroneService instantiation
  const droneService = new DroneService();
  console.log('✅ DroneService instantiated');
  console.log('🔗 Connection status:', droneService.getConnectionStatus());
  console.log('📡 Connection type:', droneService.getConnectionType());
  
  console.log('🎉 All backend modules working correctly!');
  
} catch (error) {
  console.error('❌ Error testing backend:', error.message);
  console.error('📋 Stack:', error.stack);
}
