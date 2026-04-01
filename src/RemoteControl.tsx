import React, { useState, useEffect, useRef } from 'react';
import { droneService } from './services/DroneService';
import type { DroneCommand } from './types/drone';

interface DroneControlState {
  throttle: number;      // Forward/Backward (-100 to 100)
  yaw: number;          // Rotation (-100 to 100)
  pitch: number;        // Up/Down (-100 to 100)
  roll: number;         // Left/Right (-100 to 100)
  altitude: number;     // Height (0 to 500)
  speed: number;        // Speed multiplier (0.1 to 2.0)
}

interface DroneStatus {
  id: string;
  connected: boolean;
  battery: number;
  signal: number;
  gps: { lat: number; lng: number; alt: number };
  status: string;
  color: string;
}

function RemoteControl() {
  const [selectedDrone, setSelectedDrone] = useState<string>('Alpha');
  const [isConnected, setIsConnected] = useState(false);
  const [cameraFeed, setCameraFeed] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [cameraZoom, setCameraZoom] = useState(1.0);
  const [pipMode, setPipMode] = useState(false);
  
  const [controls, setControls] = useState<DroneControlState>({
    throttle: 0,
    yaw: 0,
    pitch: 0,
    roll: 0,
    altitude: 100,
    speed: 1.0
  });

  const [drones, setDrones] = useState<DroneStatus[]>([
    { id: 'Alpha', connected: false, battery: 85, signal: 92, gps: { lat: 37.7749, lng: -122.4194, alt: 120 }, status: 'idle', color: '#3b82f6' },
    { id: 'Bravo', connected: false, battery: 67, signal: 88, gps: { lat: 37.7849, lng: -122.4094, alt: 95 }, status: 'idle', color: '#f59e0b' },
    { id: 'Charlie', connected: false, battery: 92, signal: 95, gps: { lat: 37.7649, lng: -122.4294, alt: 150 }, status: 'idle', color: '#10b981' }
  ]);

  const joystickRef = useRef<HTMLDivElement>(null);
  const [isJoystickActive, setIsJoystickActive] = useState(false);
  const [joystickPosition, setJoystickPosition] = useState({ x: 0, y: 0 });

  // Initialize connection
  useEffect(() => {
    const handleConnect = async () => {
      try {
        const success = await droneService.connect();
        setIsConnected(success);
        if (success) {
          setDrones(prev => prev.map(drone => ({
            ...drone,
            connected: true,
            status: 'hovering'
          })));
          startCameraFeed(selectedDrone);
        }
      } catch (error) {
        console.error('Connection failed:', error);
      }
    };

    handleConnect();
    return () => {
      droneService.disconnect();
    };
  }, [selectedDrone]);

  // Start camera feed
  const startCameraFeed = (droneId: string) => {
    const drone = drones.find(d => d.id === droneId);
    if (drone && drone.connected) {
      setCameraFeed(`drone-camera-${droneId.toLowerCase()}`);
    }
  };

  // Control handlers
  const handleControlChange = (control: keyof DroneControlState, value: number) => {
    setControls(prev => ({ ...prev, [control]: value }));
    sendControlCommand(control, value);
  };

  const sendControlCommand = (control: keyof DroneControlState, value: number) => {
    const drone = drones.find(d => d.id === selectedDrone);
    if (!drone || !drone.connected) return;

    let command: DroneCommand = { droneId: selectedDrone, command: 'HOVER' };

    switch (control) {
      case 'throttle':
        command = { droneId: selectedDrone, command: value > 0 ? 'FORWARD' : value < 0 ? 'BACKWARD' : 'HOVER' };
        break;
      case 'yaw':
        command = { droneId: selectedDrone, command: value > 0 ? 'TURN_RIGHT' : value < 0 ? 'TURN_LEFT' : 'HOVER' };
        break;
      case 'pitch':
        command = { droneId: selectedDrone, command: value > 0 ? 'UP' : value < 0 ? 'DOWN' : 'HOVER' };
        break;
      case 'roll':
        command = { droneId: selectedDrone, command: value > 0 ? 'RIGHT' : value < 0 ? 'LEFT' : 'HOVER' };
        break;
      case 'altitude':
        command = { droneId: selectedDrone, command: 'ALTITUDE', ...(value as any) };
        break;
    }

    droneService.sendCommand(command);
  };

  // Joystick controls
  const handleJoystickMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isJoystickActive || !joystickRef.current) return;

    const rect = joystickRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const x = e.clientX - rect.left - centerX;
    const y = e.clientY - rect.top - centerY;

    const maxDistance = Math.min(centerX, centerY) - 10;
    const distance = Math.min(Math.sqrt(x * x + y * y), maxDistance);
    const angle = Math.atan2(y, x);

    const normalizedX = (distance * Math.cos(angle)) / maxDistance * 100;
    const normalizedY = -(distance * Math.sin(angle)) / maxDistance * 100;

    setJoystickPosition({ x: normalizedX, y: normalizedY });
    setControls(prev => ({
      ...prev,
      throttle: normalizedY,
      roll: normalizedX
    }));

    sendControlCommand('throttle', normalizedY);
    sendControlCommand('roll', normalizedX);
  };

  const handleJoystickEnd = () => {
    setIsJoystickActive(false);
    setJoystickPosition({ x: 0, y: 0 });
    setControls(prev => ({ ...prev, throttle: 0, roll: 0 }));
    sendControlCommand('throttle', 0);
    sendControlCommand('roll', 0);
  };

  // Emergency functions
  const handleEmergencyStop = () => {
    setControls({
      throttle: 0,
      yaw: 0,
      pitch: 0,
      roll: 0,
      altitude: 100,
      speed: 1.0
    });
    droneService.sendCommand({ droneId: selectedDrone, command: 'EMERGENCY_STOP' });
  };

  const handleReturnToBase = () => {
    droneService.sendCommand({ droneId: selectedDrone, command: 'RETURN_TO_BASE' });
  };

  const currentDrone = drones.find(d => d.id === selectedDrone);

  return (
    <div style={{ minHeight: '100vh', background: '#020617', color: '#f1f5f9', padding: '20px' }}>
      {/* Header */}
      <div style={{ 
        background: 'rgba(30, 41, 59, 0.5)', 
        padding: '20px', 
        borderRadius: '8px', 
        marginBottom: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#06b6d4', margin: 0 }}>
            🚁 Remote Control
          </h1>
          
          {/* Drone Selection */}
          <div style={{ display: 'flex', gap: '10px' }}>
            {drones.map(drone => (
              <button
                key={drone.id}
                onClick={() => {
                  setSelectedDrone(drone.id);
                  startCameraFeed(drone.id);
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: 'none',
                  background: selectedDrone === drone.id 
                    ? drone.color 
                    : 'rgba(107, 114, 128, 0.2)',
                  color: selectedDrone === drone.id ? 'white' : '#6b7280',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: drone.connected ? '#10b981' : '#ef4444',
                  animation: drone.connected ? 'pulse 2s infinite' : 'none'
                }}></div>
                {drone.id}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ fontSize: '14px', color: '#94a3b8' }}>
            {isConnected ? '✅ Connected' : '❌ Disconnected'}
          </div>
          <button
            onClick={() => window.history.back()}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              background: 'rgba(107, 114, 128, 0.2)',
              color: '#6b7280'
            }}
          >
            ← Back
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', height: 'calc(100vh - 200px)' }}>
        
        {/* Camera Feed */}
        <div style={{ 
          background: 'rgba(30, 41, 59, 0.5)', 
          borderRadius: '8px', 
          padding: '20px',
          position: 'relative'
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#06b6d4', margin: '0 0 20px 0' }}>
            📹 {selectedDrone} Camera Feed
          </h2>

          {/* Camera View */}
          <div style={{
            width: '100%',
            height: '400px',
            background: `linear-gradient(135deg, ${currentDrone?.color}22, rgba(6, 182, 212, 0.1))`,
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '48px',
            color: '#64748b',
            position: 'relative',
            overflow: 'hidden',
            border: '2px solid rgba(6, 182, 212, 0.3)'
          }}>
            🚁 {selectedDrone} Camera
            
            {/* Recording Indicator */}
            {isRecording && (
              <div style={{
                position: 'absolute',
                top: '20px',
                left: '20px',
                background: 'rgba(239, 68, 68, 0.9)',
                color: 'white',
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                animation: 'pulse 2s infinite'
              }}>
                🔴 Recording
              </div>
            )}

            {/* Zoom Indicator */}
            {cameraZoom !== 1.0 && (
              <div style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'rgba(6, 182, 212, 0.9)',
                color: 'white',
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 'bold'
              }}>
                🔍 {Math.round(cameraZoom * 100)}%
              </div>
            )}

            {/* Camera Controls */}
            <div style={{
              position: 'absolute',
              bottom: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: '10px',
              background: 'rgba(30, 41, 59, 0.9)',
              padding: '10px',
              borderRadius: '8px',
              border: '1px solid rgba(6, 182, 212, 0.3)'
            }}>
              <button
                onClick={() => setIsRecording(!isRecording)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: 'none',
                  background: isRecording ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.2)',
                  color: isRecording ? '#ef4444' : '#10b981',
                  fontSize: '12px'
                }}
              >
                {isRecording ? '⏹️ Stop' : '⏺️ Record'}
              </button>
              
              <button
                onClick={() => setCameraZoom(prev => Math.min(prev + 0.25, 3.0))}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: 'none',
                  background: 'rgba(6, 182, 212, 0.2)',
                  color: '#06b6d4',
                  fontSize: '12px'
                }}
              >
                🔍+
              </button>
              
              <button
                onClick={() => setCameraZoom(prev => Math.max(prev - 0.25, 0.5))}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: 'none',
                  background: 'rgba(6, 182, 212, 0.2)',
                  color: '#06b6d4',
                  fontSize: '12px'
                }}
              >
                🔍-
              </button>
              
              <button
                onClick={() => setPipMode(!pipMode)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: 'none',
                  background: pipMode ? 'rgba(16, 185, 129, 0.3)' : 'rgba(6, 182, 212, 0.2)',
                  color: pipMode ? '#10b981' : '#06b6d4',
                  fontSize: '12px'
                }}
              >
                📺 PiP
              </button>
            </div>
          </div>

          {/* Camera Stats */}
          <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            <div style={{ background: 'rgba(15, 23, 42, 0.3)', padding: '10px', borderRadius: '6px' }}>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>Battery</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: currentDrone?.battery && currentDrone.battery > 50 ? '#10b981' : '#f59e0b' }}>
                {currentDrone?.battery}%
              </div>
            </div>
            <div style={{ background: 'rgba(15, 23, 42, 0.3)', padding: '10px', borderRadius: '6px' }}>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>Signal</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: currentDrone?.signal && currentDrone.signal > 70 ? '#10b981' : '#f59e0b' }}>
                {currentDrone?.signal}%
              </div>
            </div>
            <div style={{ background: 'rgba(15, 23, 42, 0.3)', padding: '10px', borderRadius: '6px' }}>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>Altitude</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#06b6d4' }}>
                {currentDrone?.gps.alt}m
              </div>
            </div>
          </div>
        </div>

        {/* Control Panel */}
        <div style={{ 
          background: 'rgba(30, 41, 59, 0.5)', 
          borderRadius: '8px', 
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#06b6d4', margin: 0 }}>
            🎮 Manual Controls
          </h2>

          {/* Joystick */}
          <div>
            <h3 style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '10px' }}>Movement Joystick</h3>
            <div
              ref={joystickRef}
              onMouseDown={() => setIsJoystickActive(true)}
              onMouseMove={handleJoystickMove}
              onMouseUp={handleJoystickEnd}
              onMouseLeave={handleJoystickEnd}
              style={{
                width: '150px',
                height: '150px',
                background: 'rgba(15, 23, 42, 0.5)',
                borderRadius: '50%',
                position: 'relative',
                cursor: 'pointer',
                border: '2px solid rgba(6, 182, 212, 0.3)',
                margin: '0 auto'
              }}
            >
              {/* Joystick Knob */}
              <div style={{
                position: 'absolute',
                width: '40px',
                height: '40px',
                background: currentDrone?.color || '#06b6d4',
                borderRadius: '50%',
                top: '50%',
                left: '50%',
                transform: `translate(calc(-50% + ${joystickPosition.x}px), calc(-50% + ${joystickPosition.y}px))`,
                transition: isJoystickActive ? 'none' : 'transform 0.2s ease',
                boxShadow: '0 4px 12px rgba(6, 182, 212, 0.4)'
              }}></div>
              
              {/* Center Cross */}
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '0',
                right: '0',
                height: '1px',
                background: 'rgba(6, 182, 212, 0.2)'
              }}></div>
              <div style={{
                position: 'absolute',
                left: '50%',
                top: '0',
                bottom: '0',
                width: '1px',
                background: 'rgba(6, 182, 212, 0.2)'
              }}></div>
            </div>
          </div>

          {/* Altitude Control */}
          <div>
            <h3 style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '10px' }}>
              Altitude: {controls.altitude}m
            </h3>
            <input
              type="range"
              min="0"
              max="500"
              value={controls.altitude}
              onChange={(e) => handleControlChange('altitude', Number(e.target.value))}
              style={{
                width: '100%',
                height: '6px',
                borderRadius: '3px',
                background: 'rgba(6, 182, 212, 0.2)',
                outline: 'none'
              }}
            />
          </div>

          {/* Speed Control */}
          <div>
            <h3 style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '10px' }}>
              Speed: {controls.speed.toFixed(1)}x
            </h3>
            <input
              type="range"
              min="0.1"
              max="2.0"
              step="0.1"
              value={controls.speed}
              onChange={(e) => handleControlChange('speed', Number(e.target.value))}
              style={{
                width: '100%',
                height: '6px',
                borderRadius: '3px',
                background: 'rgba(6, 182, 212, 0.2)',
                outline: 'none'
              }}
            />
          </div>

          {/* Yaw Control */}
          <div>
            <h3 style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '10px' }}>
              Rotation: {controls.yaw > 0 ? '↻ Right' : controls.yaw < 0 ? '↺ Left' : 'Center'}
            </h3>
            <input
              type="range"
              min="-100"
              max="100"
              value={controls.yaw}
              onChange={(e) => handleControlChange('yaw', Number(e.target.value))}
              style={{
                width: '100%',
                height: '6px',
                borderRadius: '3px',
                background: 'rgba(6, 182, 212, 0.2)',
                outline: 'none'
              }}
            />
          </div>

          {/* Emergency Controls */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleEmergencyStop}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '8px',
                fontWeight: 600,
                cursor: 'pointer',
                border: 'none',
                background: 'rgba(239, 68, 68, 0.3)',
                color: '#ef4444',
                fontSize: '14px'
              }}
            >
              🚨 Emergency Stop
            </button>
            <button
              onClick={handleReturnToBase}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '8px',
                fontWeight: 600,
                cursor: 'pointer',
                border: 'none',
                background: 'rgba(16, 185, 129, 0.2)',
                color: '#10b981',
                fontSize: '14px'
              }}
            >
              🏠 Return Home
            </button>
          </div>

          {/* Control Status */}
          <div style={{ 
            background: 'rgba(15, 23, 42, 0.3)', 
            padding: '15px', 
            borderRadius: '8px',
            fontSize: '12px'
          }}>
            <h3 style={{ fontSize: '14px', color: '#06b6d4', marginBottom: '10px' }}>Control Status</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>Throttle: {controls.throttle.toFixed(0)}%</div>
              <div>Roll: {controls.roll.toFixed(0)}%</div>
              <div>Pitch: {controls.pitch.toFixed(0)}%</div>
              <div>Yaw: {controls.yaw.toFixed(0)}%</div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

export default RemoteControl;
