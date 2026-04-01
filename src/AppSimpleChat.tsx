import React, { useState, useEffect, useRef } from 'react';
import { droneService } from './services/DroneService';
import type { DroneCommand } from './types/drone';

function AppSimpleChat() {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<Array<{type: 'user' | 'ai', text: string, timestamp?: string}>>([
    {type: 'ai', text: '👋 Welcome to AeroVision AI! I\'m your advanced drone command assistant.\n\n💡 Try commands like: "Guard the perimeter", "Patrol the area", "All drones take off", or "Celebration show"'}
  ]);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [selectedDrone, setSelectedDrone] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState({ lat: 37.7749, lng: -122.4194 });
  const [mapZoom, setMapZoom] = useState(15);
  const [connectedDrones, setConnectedDrones] = useState([
    { 
      id: 'Alpha', 
      connected: false, 
      gps: { lat: 37.7749, lng: -122.4194, alt: 120 },
      battery: 85,
      signal: 92,
      status: 'offline',
      color: '#3b82f6'
    },
    { 
      id: 'Bravo', 
      connected: false, 
      gps: { lat: 37.7849, lng: -122.4094, alt: 95 },
      battery: 67,
      signal: 88,
      status: 'offline',
      color: '#f59e0b'
    },
    { 
      id: 'Charlie', 
      connected: false, 
      gps: { lat: 37.7649, lng: -122.4294, alt: 150 },
      battery: 92,
      signal: 95,
      status: 'offline',
      color: '#10b981'
    }
  ]);
  
  // Emergency Safety System States
  const [emergencyMode, setEmergencyMode] = useState(false);
  const [signalLostDrones, setSignalLostDrones] = useState<string[]>([]);
  const [emergencyLanding, setEmergencyLanding] = useState(false);
  const [safetyAlerts, setSafetyAlerts] = useState<Array<{id: string, type: 'signal_lost' | 'low_battery' | 'emergency_landing', message: string, timestamp: string}>>([]);
  
  // Voice Command System States
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [voiceCommands, setVoiceCommands] = useState<Array<{command: string, timestamp: string, droneId: string}>>([]);
  
  // Drone Camera Gesture System States
  const [cameraFeed, setCameraFeed] = useState<string | null>(null);
  const [selectedDroneCamera, setSelectedDroneCamera] = useState('Alpha');
  const [gestureDetection, setGestureDetection] = useState(false);
  const [currentGesture, setCurrentGesture] = useState<string>('');
  const [gestureConfidence, setGestureConfidence] = useState(0);
  const [gestureCommands, setGestureCommands] = useState<Array<{gesture: string, timestamp: string, droneId: string, confidence: number}>>([]);
  const [cameraError, setCameraError] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // PWA Installation
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallButton(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to install prompt: ${outcome}`);
    setDeferredPrompt(null);
    setShowInstallButton(false);
  };

  const handleConnect = async () => {
    setConnectionStatus('connecting');
    try {
      const success = await droneService.connect();
      setIsConnected(success);
      setConnectionStatus(success ? 'connected' : 'disconnected');
      
      // Update drone connection status
      if (success) {
        setConnectedDrones(prev => prev.map(drone => ({
          ...drone,
          connected: true,
          status: drone.id === 'Alpha' ? 'patrolling' : 
                  drone.id === 'Bravo' ? 'idle' : 
                  drone.id === 'Charlie' ? 'guarding' : 'patrolling'
        })));
      }
    } catch (error) {
      console.error('Connection failed:', error);
      setConnectionStatus('disconnected');
    }
  };

  const handleDisconnect = async () => {
    try {
      await droneService.disconnect();
      setIsConnected(false);
      setConnectionStatus('disconnected');
      
      // Update drone connection status
      setConnectedDrones(prev => prev.map(drone => ({
        ...drone,
        connected: false,
        status: 'offline'
      })));
    } catch (error) {
      console.error('Disconnection failed:', error);
    }
  };

  // Emergency Safety System Monitoring
  useEffect(() => {
    if (!isConnected) return;

    const interval = setInterval(() => {
      const currentTime = new Date().toLocaleTimeString();
      const newAlerts: typeof safetyAlerts = [...safetyAlerts];
      const newSignalLostDrones: typeof signalLostDrones = [...signalLostDrones];

      // Check for signal loss on connected drones
      connectedDrones.forEach(drone => {
        if (drone.connected) {
          // Simulate signal loss (in real app, this would come from actual drone telemetry)
          const signalThreshold = 30; // Below 30% = signal lost
          const batteryThreshold = 20; // Below 20% = critical battery
          
          if (drone.signal < signalThreshold && !newSignalLostDrones.includes(drone.id)) {
            // Signal lost detected
            newSignalLostDrones.push(drone.id);
            setSignalLostDrones(newSignalLostDrones);
            
            newAlerts.push({
              id: drone.id,
              type: 'signal_lost',
              message: `🚨 SIGNAL LOST - Drone ${drone.id} connection lost! Auto-return initiated.`,
              timestamp: currentTime
            });
            
            // Auto-return to base for signal loss
            setConnectedDrones(prev => prev.map(d => 
              d.id === drone.id 
                ? { ...d, status: 'returning', signal: 0 }
                : d
            ));
          }
          
          if (drone.battery < batteryThreshold && !newAlerts.some(alert => alert.id === drone.id && alert.type === 'low_battery')) {
            // Critical battery level detected
            newAlerts.push({
              id: drone.id,
              type: 'low_battery',
              message: `🔋 CRITICAL BATTERY - Drone ${drone.id} at ${drone.battery}%! Immediate landing required.`,
              timestamp: currentTime
            });
            
            // Force emergency landing for critical battery
            setConnectedDrones(prev => prev.map(d => 
              d.id === drone.id 
                ? { ...d, status: 'emergency_landing' }
                : d
            ));
          }
        }
      });

      // Check if any drone needs emergency landing
      const needsEmergencyLanding = connectedDrones.some(drone => 
        drone.connected && (drone.status === 'returning' || drone.status === 'emergency_landing')
      );

      if (needsEmergencyLanding && !emergencyLanding) {
        setEmergencyLanding(true);
        setEmergencyMode(true);
        
        newAlerts.push({
          id: 'system',
          type: 'emergency_landing',
          message: '🚁 EMERGENCY LANDING - All drones returning to base immediately!',
          timestamp: currentTime
        });
      }

      // Update alerts if changed
      if (newAlerts.length > safetyAlerts.length || newSignalLostDrones.length > signalLostDrones.length) {
        setSafetyAlerts(newAlerts.slice(-10)); // Keep last 10 alerts
      }
    }, 2000); // Check every 2 seconds

    return () => clearInterval(interval);
  }, [isConnected, connectedDrones, signalLostDrones, safetyAlerts, emergencyLanding]);

  // Emergency Landing Handler
  const handleEmergencyLanding = async () => {
    setEmergencyMode(true);
    setEmergencyLanding(true);
    
    const currentTime = new Date().toLocaleTimeString();
    
    // Add emergency landing alert
    setSafetyAlerts(prev => [...prev, {
      id: 'system',
      type: 'emergency_landing',
      message: '🚁 MANUAL EMERGENCY LANDING - All drones landing immediately!',
      timestamp: currentTime
    }]);

    // Command all drones to emergency land
    setConnectedDrones(prev => prev.map(drone => ({
      ...drone,
      status: 'emergency_landing',
      signal: 0
    })));

    // Send emergency command to backend
    try {
      await droneService.sendCommand({ droneId: 'all', command: 'EMERGENCY_LANDING' });
    } catch (error) {
      console.error('Emergency landing failed:', error);
    }

    // Reset after 10 seconds
    setTimeout(() => {
      setEmergencyLanding(false);
      setEmergencyMode(false);
      setSignalLostDrones([]);
    }, 10000);
  };

  // Clear Safety Alerts
  const clearSafetyAlerts = () => {
    setSafetyAlerts([]);
    setSignalLostDrones([]);
  };

  // Voice Command System Initialization
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      setVoiceSupported(true);
    }
  }, []);

  // Passive Gesture Detection System
  useEffect(() => {
    if (!isConnected) return;

    const gestures = [
      { name: 'Open Palm', command: 'HOVER', confidence: 0.95 },
      { name: 'Point Up', command: 'TAKEOFF', confidence: 0.88 },
      { name: 'Point Down', command: 'LAND', confidence: 0.92 },
      { name: 'Wave', command: 'RETURN_TO_BASE', confidence: 0.85 },
      { name: 'Peace Sign', command: 'PATROL', confidence: 0.90 },
      { name: 'Thumbs Up', command: 'GUARD', confidence: 0.93 },
      { name: 'Stop Hand', command: 'EMERGENCY_LANDING', confidence: 0.97 },
      { name: 'Circular Motion', command: 'CELEBRATION', confidence: 0.87 }
    ];

    // Simulate passive gesture detection every 8 seconds
    const interval = setInterval(() => {
      if (connectedDrones.filter(d => d.connected).length === 0) return;

      // Random gesture detection for simulation
      const randomGesture = gestures[Math.floor(Math.random() * gestures.length)];
      const randomDrone = connectedDrones.filter(d => d.connected)[Math.floor(Math.random() * connectedDrones.filter(d => d.connected).length)];
      
      if (randomDrone && Math.random() > 0.7) { // 30% chance of detecting gesture
        setCurrentGesture(randomGesture.name);
        setGestureConfidence(randomGesture.confidence);

        // Execute gesture command
        const droneCommand: DroneCommand = { 
          droneId: randomDrone.id, 
          command: randomGesture.command as any 
        };
        
        droneService.sendCommand(droneCommand);

        // Log gesture command
        const currentTime = new Date().toLocaleTimeString();
        setGestureCommands(prev => [...prev.slice(-9), {
          gesture: randomGesture.name,
          timestamp: currentTime,
          droneId: randomDrone.id,
          confidence: randomGesture.confidence
        }]);

        // Add to chat messages
        const userMessage = {
          type: 'user' as const,
          text: `🙌 Passive Gesture: "${randomGesture.name}" detected from ${randomDrone.id} (${Math.round(randomGesture.confidence * 100)}% confidence)`,
          timestamp: currentTime
        };
        setMessages(prev => [...prev, userMessage]);

        // Process command response
        const responseText = `✅ **Passive Gesture Detected**\n\n🙌 ${randomGesture.name}\nDrone: ${randomDrone.id}\nConfidence: ${Math.round(randomGesture.confidence * 100)}%\n\n\`\`\`json\n${JSON.stringify(droneCommand, null, 2)}\n\`\`\``;
        const aiMessage = {
          type: 'ai' as const,
          text: responseText,
          timestamp: currentTime
        };
        setMessages(prev => [...prev, aiMessage]);
      }
    }, 8000);

    return () => clearInterval(interval);
  }, [isConnected, connectedDrones]);

  // Voice Command Recognition
  const startVoiceRecognition = () => {
    if (!voiceSupported) return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setVoiceTranscript('');
    };

    recognition.onresult = (event: any) => {
      const current = event.resultIndex;
      const transcript = event.results[current][0].transcript;
      setVoiceTranscript(transcript);

      if (event.results[current].isFinal) {
        processVoiceCommand(transcript);
        setIsListening(false);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      setVoiceTranscript('');
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  // Process Voice Commands
  const processVoiceCommand = (command: string) => {
    const lowerCommand = command.toLowerCase();
    const currentTime = new Date().toLocaleTimeString();
    let droneCommand: DroneCommand = { droneId: 'all', command: 'HOVER' };

    if (lowerCommand.includes('take off') || lowerCommand.includes('launch')) {
      droneCommand = { droneId: 'all', command: 'TAKEOFF' };
    } else if (lowerCommand.includes('land') || lowerCommand.includes('landing')) {
      droneCommand = { droneId: 'all', command: 'LAND' };
    } else if (lowerCommand.includes('emergency') || lowerCommand.includes('stop all')) {
      droneCommand = { droneId: 'all', command: 'EMERGENCY_LANDING' };
    } else if (lowerCommand.includes('return') || lowerCommand.includes('go back')) {
      droneCommand = { droneId: 'all', command: 'RETURN_TO_BASE' };
    } else if (lowerCommand.includes('guard') || lowerCommand.includes('protect')) {
      droneCommand = { droneId: 'all', command: 'GUARD' };
    } else if (lowerCommand.includes('patrol') || lowerCommand.includes('scan')) {
      droneCommand = { droneId: 'all', command: 'PATROL' };
    } else if (lowerCommand.includes('celebration') || lowerCommand.includes('show')) {
      droneCommand = { droneId: 'all', command: 'CELEBRATION' };
    }

    // Execute command
    droneService.sendCommand(droneCommand);

    // Log voice command
    setVoiceCommands(prev => [...prev.slice(-9), {
      command: command,
      timestamp: currentTime,
      droneId: droneCommand.droneId
    }]);

    // Add to chat messages
    const userMessage = {
      type: 'user' as const,
      text: `🎤 Voice: "${command}"`,
      timestamp: currentTime
    };
    setMessages(prev => [...prev, userMessage]);

    // Process command response
    const responseText = `✅ **Voice Command Executed**\n\n🎤 "${command}"\n\n\`\`\`json\n${JSON.stringify(droneCommand, null, 2)}\n\`\`\``;
    const aiMessage = {
      type: 'ai' as const,
      text: responseText,
      timestamp: currentTime
    };
    setMessages(prev => [...prev, aiMessage]);
  };

  // Drone Camera Feed Simulation
  const startDroneCamera = (droneId: string) => {
    setSelectedDroneCamera(droneId);
    setCameraError('');
    
    // Simulate drone camera feed (in real app, this would be WebRTC/RTMP stream)
    const drone = connectedDrones.find(d => d.id === droneId);
    if (drone && drone.connected) {
      // Simulate camera feed URL
      setCameraFeed(`drone-camera-${droneId.toLowerCase()}`);
      setGestureDetection(true);
      
      // Simulate gesture detection
      simulateGestureDetection(droneId);
    } else {
      setCameraError(`Drone ${droneId} is not connected`);
      setCameraFeed(null);
      setGestureDetection(false);
    }
  };

  // Simulate Gesture Detection
  const simulateGestureDetection = (droneId: string) => {
    const gestures = [
      { name: 'Open Palm', command: 'HOVER', confidence: 0.95 },
      { name: 'Point Up', command: 'TAKEOFF', confidence: 0.88 },
      { name: 'Point Down', command: 'LAND', confidence: 0.92 },
      { name: 'Wave', command: 'RETURN_TO_BASE', confidence: 0.85 },
      { name: 'Peace Sign', command: 'PATROL', confidence: 0.90 },
      { name: 'Thumbs Up', command: 'GUARD', confidence: 0.93 },
      { name: 'Stop Hand', command: 'EMERGENCY_LANDING', confidence: 0.97 },
      { name: 'Circular Motion', command: 'CELEBRATION', confidence: 0.87 }
    ];

    const interval = setInterval(() => {
      if (!gestureDetection) {
        clearInterval(interval);
        return;
      }

      // Random gesture detection for simulation
      const randomGesture = gestures[Math.floor(Math.random() * gestures.length)];
      setCurrentGesture(randomGesture.name);
      setGestureConfidence(randomGesture.confidence);

      // Execute gesture command
      const droneCommand: DroneCommand = { 
        droneId: selectedDroneCamera, 
        command: randomGesture.command as any 
      };
      
      droneService.sendCommand(droneCommand);

      // Log gesture command
      const currentTime = new Date().toLocaleTimeString();
      setGestureCommands(prev => [...prev.slice(-9), {
        gesture: randomGesture.name,
        timestamp: currentTime,
        droneId: selectedDroneCamera,
        confidence: randomGesture.confidence
      }]);

      // Add to chat messages
      const userMessage = {
        type: 'user' as const,
        text: `🙌 Gesture: "${randomGesture.name}" (${Math.round(randomGesture.confidence * 100)}% confidence)`,
        timestamp: currentTime
      };
      setMessages(prev => [...prev, userMessage]);

      // Process command response
      const responseText = `✅ **Gesture Command Executed**\n\n🙌 ${randomGesture.name}\nConfidence: ${Math.round(randomGesture.confidence * 100)}%\nDrone: ${selectedDroneCamera}\n\n\`\`\`json\n${JSON.stringify(droneCommand, null, 2)}\n\`\`\``;
      const aiMessage = {
        type: 'ai' as const,
        text: responseText,
        timestamp: currentTime
      };
      setMessages(prev => [...prev, aiMessage]);
    }, 5000); // Detect gesture every 5 seconds for simulation
  };

  // Stop Camera Feed
  const stopDroneCamera = () => {
    setCameraFeed(null);
    setGestureDetection(false);
    setCurrentGesture('');
    setGestureConfidence(0);
  };

  const parseCommand = (input: string): DroneCommand => {
    const lowerInput = input.toLowerCase();
    if (lowerInput.includes('guard')) return { droneId: 'all', command: 'GUARD' };
    if (lowerInput.includes('patrol')) return { droneId: 'all', command: 'PATROL' };
    if (lowerInput.includes('celebration')) return { droneId: 'all', command: 'CELEBRATION' };
    if (lowerInput.includes('cinema')) return { droneId: 'all', command: 'CINEMA' };
    if (lowerInput.includes('take off')) return { droneId: 'all', command: 'TAKEOFF' };
    if (lowerInput.includes('land')) return { droneId: 'all', command: 'LAND' };
    return { droneId: 'all', command: 'HOVER' };
  };

  const handleSendCommand = async () => {
    if (!chatInput.trim()) return;

    // Add user message with timestamp
    const userMessage = {
      type: 'user' as const,
      text: chatInput,
      timestamp: new Date().toLocaleTimeString()
    };
    setMessages(prev => [...prev, userMessage]);

    // Show typing indicator
    setIsTyping(true);

    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Parse command
    const command = parseCommand(chatInput);
    console.log('Executing command:', command);
    
    // Execute command
    droneService.sendCommand(command);

    // Add AI response with timestamp
    const responseText = command.command === 'HOVER' 
      ? `⏸️ **Hover Mode Activated**\n\nAll drones are now maintaining position.\n\n\`\`\`json\n${JSON.stringify(command, null, 2)}\n\`\`\``
      : command.command === 'GUARD'
      ? `🛡️ **Guard Mode Engaged**\n\nPerimeter surveillance activated.\n\n\`\`\`json\n${JSON.stringify(command, null, 2)}\n\`\`\``
      : command.command === 'PATROL'
      ? `🚁 **Patrol Mode Started**\n\nAutonomous patrol initiated.\n\n\`\`\`json\n${JSON.stringify(command, null, 2)}\n\`\`\``
      : command.command === 'CELEBRATION'
      ? `🎆 **Celebration Show**\n\nAerial light display sequence activated.\n\n\`\`\`json\n${JSON.stringify(command, null, 2)}\n\`\`\``
      : command.command === 'CINEMA'
      ? `🎬 **Cinema Mode**\n\nCinematic filming configuration set.\n\n\`\`\`json\n${JSON.stringify(command, null, 2)}\n\`\`\``
      : command.command === 'TAKEOFF'
      ? `🚀 **Takeoff Sequence**\n\nAll drones ascending to operational altitude.\n\n\`\`\`json\n${JSON.stringify(command, null, 2)}\n\`\`\``
      : command.command === 'LAND'
      ? `🛬 **Landing Sequence**\n\nAll drones returning to base.\n\n\`\`\`json\n${JSON.stringify(command, null, 2)}\n\`\`\``
      : `✅ **Command Executed**\n\n\`\`\`json\n${JSON.stringify(command, null, 2)}\n\`\`\``;

    const aiMessage = {
      type: 'ai' as const,
      text: responseText,
      timestamp: new Date().toLocaleTimeString()
    };
    
    setMessages(prev => [...prev, aiMessage]);
    setIsTyping(false);
    setChatInput('');
  };

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            background: '#06b6d4', 
            borderRadius: '8px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            fontWeight: 'bold', 
            color: 'white' 
          }}>
            AV
          </div>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#06b6d4', margin: '0' }}>
              AeroVision AI
            </h1>
            <span style={{ fontSize: '14px', color: '#94a3b8' }}>
              Drone Command Center
            </span>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          {showInstallButton && (
            <button
              onClick={handleInstallClick}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                fontWeight: 600,
                cursor: 'pointer',
                border: 'none',
                background: 'rgba(16, 185, 129, 0.2)',
                color: '#10b981',
                marginRight: '10px'
              }}
            >
              📱 Install App
            </button>
          )}
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ 
              width: '8px', 
              height: '8px', 
              borderRadius: '50%', 
              background: connectionStatus === 'connected' ? '#10b981' : 
                          connectionStatus === 'connecting' ? '#f59e0b' : '#ef4444',
              animation: 'pulse 2s infinite'
            }}></div>
            <span style={{ fontSize: '14px', color: '#94a3b8' }}>
              {connectionStatus === 'connected' ? 'Connected' : 'Disconnected'}
            </span>
          </div>

          {/* Remote Control Button - Always Visible */}
          <button
            onClick={() => window.open('/remote-control.html', '_blank', 'width=1200,height=800')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              background: 'rgba(139, 92, 246, 0.2)',
              color: '#8b5cf6',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            🎮 Remote Control
          </button>

          {/* Emergency Safety System - Only when connected */}
          {isConnected && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>

              {/* Passive Gesture Detection Indicator */}
              <div style={{ 
                position: 'relative',
                marginRight: '8px'
              }}>
                <div style={{
                  padding: '6px 10px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: '600',
                  background: 'rgba(16, 185, 129, 0.2)',
                  color: '#10b981',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  animation: 'pulse 3s infinite'
                }}>
                  🙌 Passive Gesture
                </div>
                {currentGesture && (
                  <div style={{
                    position: 'absolute',
                    top: '-8px',
                    right: '-8px',
                    background: '#10b981',
                    color: 'white',
                    borderRadius: '50%',
                    width: '16px',
                    height: '16px',
                    fontSize: '8px',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {currentGesture.split(' ')[0]}
                  </div>
                )}
              </div>

              {/* Safety Alerts */}
              {safetyAlerts.length > 0 && (
                <div style={{ 
                  position: 'relative',
                  marginRight: '8px'
                }}>
                  <button
                    onClick={() => clearSafetyAlerts()}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: 'none',
                      background: emergencyMode ? 'rgba(239, 68, 68, 0.3)' : 'rgba(245, 158, 11, 0.2)',
                      color: emergencyMode ? '#fca5a5' : '#f59e0b',
                      fontSize: '12px'
                    }}
                  >
                    {emergencyMode ? '🚨 EMERGENCY' : '⚠️ ALERTS'}
                  </button>
                  {safetyAlerts.length > 0 && (
                    <div style={{
                      position: 'absolute',
                      top: '-8px',
                      right: '-8px',
                      background: '#ef4444',
                      color: 'white',
                      borderRadius: '50%',
                      width: '18px',
                      height: '18px',
                      fontSize: '10px',
                      fontWeight: 'bold',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {safetyAlerts.length}
                    </div>
                  )}
                </div>
              )}

              {/* Emergency Landing Button */}
              <button
                onClick={handleEmergencyLanding}
                disabled={emergencyLanding}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontWeight: 600,
                  cursor: emergencyLanding ? 'not-allowed' : 'pointer',
                  border: 'none',
                  background: emergencyLanding 
                    ? 'rgba(239, 68, 68, 0.5)' 
                    : 'rgba(220, 38, 38, 0.2)',
                  color: emergencyLanding ? '#6b7280' : '#dc2626',
                  fontSize: '12px',
                  animation: emergencyLanding ? 'pulse 1s infinite' : 'none',
                  boxShadow: emergencyLanding 
                    ? '0 0 12px rgba(239, 68, 68, 0.4)' 
                    : '0 2px 8px rgba(220, 38, 38, 0.3)'
                }}
              >
                {emergencyLanding ? '🚁 LANDING...' : '🚁 EMERGENCY'}
              </button>
            </div>
          )}

          <button
            onClick={isConnected ? handleDisconnect : handleConnect}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              background: isConnected ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
              color: isConnected ? '#ef4444' : '#10b981'
            }}
          >
            {isConnected ? 'Disconnect' : 'Connect'}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
        
        {/* Fleet Status - LEFT */}
        <div style={{ 
          background: 'rgba(30, 41, 59, 0.5)', 
          borderRadius: '0.5rem', 
          padding: '1rem',
          height: '600px'
        }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#06b6d4', margin: '0 0 1rem 0' }}>
            Fleet Status
          </h2>

          {isConnected ? (
            <div>
              {connectedDrones.map((drone) => (
                <div key={drone.id} style={{ 
                  background: 'rgba(30, 41, 59, 0.3)', 
                  borderRadius: '0.5rem', 
                  padding: '0.75rem', 
                  marginBottom: '0.75rem',
                  border: `1px solid ${drone.connected ? 'rgba(6, 182, 212, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                  opacity: drone.connected ? 1 : 0.6
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ 
                        width: '0.5rem', 
                        height: '0.5rem', 
                        borderRadius: '50%', 
                        background: drone.connected ? drone.color : '#ef4444',
                        animation: drone.connected ? 'pulse 2s infinite' : 'none'
                      }}></div>
                      <span style={{ fontWeight: 600, color: '#f1f5f9' }}>{drone.id}</span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>
                      {drone.status}
                    </span>
                  </div>
                  
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span>Connection:</span>
                      <span style={{ color: drone.connected ? '#10b981' : '#ef4444' }}>
                        {drone.connected ? 'Connected' : 'Offline'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span>Battery:</span>
                      <span style={{ color: '#f1f5f9' }}>{drone.battery}%</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span>Signal:</span>
                      <span style={{ color: '#f1f5f9' }}>{drone.signal}%</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Location:</span>
                      <span style={{ color: '#f1f5f9', fontSize: '0.65rem' }}>
                        {drone.gps.lat.toFixed(4)}, {drone.gps.lng.toFixed(4)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ 
              textAlign: 'center', 
              color: '#94a3b8', 
              padding: '2rem' 
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚁</div>
              <div>Connect to view fleet status</div>
            </div>
          )}
        </div>

        {/* Drone Positioning Map - CENTER */}
        <div style={{ 
          background: 'rgba(30, 41, 59, 0.5)', 
          borderRadius: '0.5rem', 
          padding: '1rem',
          height: '600px',
          position: 'relative'
        }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#06b6d4', margin: '0 0 1rem 0' }}>
            Drone Positioning
          </h2>
          
          {/* Simple Map Container */}
          <div 
            ref={mapRef}
            style={{ 
              position: 'relative', 
              height: 'calc(100% - 3rem)', 
              background: 'radial-gradient(circle at center, rgba(6, 182, 212, 0.05), rgba(15, 23, 42, 0.3))', 
              borderRadius: '0.75rem',
              border: '1px solid rgba(6, 182, 212, 0.2)',
              overflow: 'hidden',
              boxShadow: 'inset 0 0 20px rgba(0, 0, 0, 0.2)'
            }}
          >
            {/* Grid Lines */}
            <div style={{ position: 'absolute', inset: 0, opacity: 0.15 }}>
              {[...Array(10)].map((_, i) => (
                <div key={`h-${i}`} style={{ 
                  position: 'absolute', 
                  width: '100%', 
                  borderTop: '1px dashed rgba(6, 182, 212, 0.1)', 
                  top: `${i * 10}%` 
                }}></div>
              ))}
              {[...Array(10)].map((_, i) => (
                <div key={`v-${i}`} style={{ 
                  position: 'absolute', 
                  height: '100%', 
                  borderLeft: '1px dashed rgba(6, 182, 212, 0.1)', 
                  left: `${i * 10}%` 
                }}></div>
              ))}
            </div>

            {/* Drone Markers - Only Show Connected Drones */}
            {connectedDrones.filter(drone => drone.connected).map((drone) => (
              <div key={drone.id} style={{ 
                position: 'absolute', 
                top: `${25 + (drone.id === 'Alpha' ? 0 : drone.id === 'Charlie' ? 25 : 0)}%`, 
                left: `${25 + (drone.id === 'Alpha' ? 0 : drone.id === 'Charlie' ? 25 : 0)}%`, 
                transform: 'translate(-50%, -50%)',
                cursor: 'pointer',
                transition: 'transform 0.3s ease'
              }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1.2)';
                  setSelectedDrone(drone.id);
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1)';
                  setSelectedDrone(null);
                }}
              >
                <div style={{ 
                  position: 'relative', 
                  width: '1.25rem', 
                  height: '1.25rem', 
                  borderRadius: '50%', 
                  background: `linear-gradient(135deg, ${drone.color}, ${drone.color}dd)`,
                  animation: 'pulse 2s infinite',
                  boxShadow: `0 0 20px ${drone.color}99`
                }}></div>
                <div style={{ 
                  position: 'absolute', 
                  inset: 0, 
                  width: '1.25rem', 
                  height: '1.25rem', 
                  borderRadius: '50%', 
                  background: `linear-gradient(135deg, ${drone.color}, ${drone.color}dd)`,
                  animation: 'ping 2s infinite'
                }}></div>
                <div style={{ 
                  position: 'absolute', 
                  top: '-2rem', 
                  left: '50%', 
                  transform: 'translateX(-50%)', 
                  fontSize: '0.7rem', 
                  color: drone.color, 
                  whiteSpace: 'nowrap',
                  fontWeight: 'bold',
                  background: 'rgba(30, 41, 59, 0.9)',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '0.25rem',
                  border: `1px solid ${drone.color}66`,
                  textAlign: 'center',
                  backdropFilter: 'blur(4px)'
                }}>
                  <div>{drone.id}</div>
                  <div style={{ fontSize: '0.6rem', opacity: 0.8 }}>
                    {drone.gps.lat.toFixed(4)}, {drone.gps.lng.toFixed(4)}
                  </div>
                  <div style={{ fontSize: '0.6rem', opacity: 0.8 }}>
                    Alt: {drone.gps.alt}m
                  </div>
                </div>
              </div>
            ))}

            {/* Map Controls */}
            <div style={{ 
              position: 'absolute', 
              bottom: '1rem', 
              left: '1rem', 
              fontSize: '0.75rem', 
              color: '#94a3b8',
              background: 'rgba(30, 41, 59, 0.9)',
              padding: '0.5rem 0.75rem',
              borderRadius: '0.5rem',
              border: '1px solid rgba(6, 182, 212, 0.2)',
              backdropFilter: 'blur(8px)'
            }}>
              <div style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                <span>Lat: {mapCenter.lat.toFixed(4)}</span>
                <span>Lng: {mapCenter.lng.toFixed(4)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                <span>Zoom: {mapZoom}x</span>
                {selectedDrone && <span style={{ color: '#06b6d4' }}>Selected: {selectedDrone}</span>}
              </div>
            </div>

            <div style={{ 
              position: 'absolute', 
              top: '1rem', 
              right: '1rem', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '0.5rem' 
            }}>
              <button style={{
                width: '2.5rem', 
                height: '2.5rem', 
                background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(30, 41, 59, 0.6))', 
                border: '1px solid rgba(6, 182, 212, 0.3)', 
                borderRadius: '0.5rem', 
                color: '#f1f5f9', 
                fontSize: '1.125rem', 
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
              }}
              onClick={() => setMapZoom(prev => Math.min(prev + 1, 20))}
              title="Zoom In"
              >+</button>
              <button style={{
                width: '2.5rem', 
                height: '2.5rem', 
                background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(30, 41, 59, 0.6))', 
                border: '1px solid rgba(6, 182, 212, 0.3)', 
                borderRadius: '0.5rem', 
                color: '#f1f5f9', 
                fontSize: '1.125rem', 
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
              }}
              onClick={() => setMapZoom(prev => Math.max(prev - 1, 1))}
              title="Zoom Out"
              >-</button>
              <button style={{
                width: '2.5rem', 
                height: '2.5rem', 
                background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(30, 41, 59, 0.6))', 
                border: '1px solid rgba(6, 182, 212, 0.3)', 
                borderRadius: '0.5rem', 
                color: '#f1f5f9', 
                fontSize: '1rem', 
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
              }}
              onClick={() => setMapCenter({ lat: 37.7749, lng: -122.4194 })}
              title="Reset View"
              >⊙</button>
            </div>
          </div>
        </div>

        {/* AI Chat Interface - RIGHT */}
        <div style={{ 
          background: 'rgba(30, 41, 59, 0.5)', 
          borderRadius: '8px', 
          padding: '20px',
          height: '600px',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#06b6d4', margin: '0 0 20px 0' }}>
            AI Mission Command
          </h2>

          {/* Messages */}
          <div style={{ 
            flex: 1, 
            overflowY: 'auto', 
            marginBottom: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '15px',
            padding: '10px',
            background: 'rgba(15, 23, 42, 0.3)',
            borderRadius: '8px',
            border: '1px solid rgba(6, 182, 212, 0.1)'
          }}>
            {messages.map((msg, index) => (
              <div key={index} style={{ 
                display: 'flex', 
                gap: '10px',
                justifyContent: msg.type === 'user' ? 'flex-end' : 'flex-start',
                animation: 'fadeInUp 0.3s ease-out'
              }}>
                {msg.type === 'ai' && (
                  <div style={{ 
                    width: '32px', 
                    height: '32px', 
                    background: 'linear-gradient(135deg, #06b6d4, #0891b2)', 
                    borderRadius: '50%', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    fontSize: '12px', 
                    fontWeight: 'bold', 
                    color: 'white',
                    flexShrink: 0,
                    boxShadow: '0 4px 12px rgba(6, 182, 212, 0.3)',
                    animation: 'pulse 2s infinite'
                  }}>
                    AI
                  </div>
                )}
                
                <div style={{ 
                  maxWidth: '80%',
                  background: msg.type === 'user' 
                    ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(6, 182, 212, 0.1))' 
                    : 'linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(30, 41, 59, 0.5))',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  border: `1px solid ${msg.type === 'user' ? 'rgba(6, 182, 212, 0.3)' : 'rgba(6, 182, 212, 0.2)'}`,
                  boxShadow: msg.type === 'user' 
                    ? '0 4px 12px rgba(6, 182, 212, 0.2)' 
                    : '0 4px 12px rgba(0, 0, 0, 0.3)',
                  position: 'relative'
                }}>
                  {msg.timestamp && (
                    <div style={{ 
                      fontSize: '10px', 
                      color: '#64748b', 
                      marginBottom: '8px',
                      opacity: 0.7
                    }}>
                      {msg.timestamp}
                    </div>
                  )}
                  <div style={{ fontSize: '14px', color: '#f1f5f9', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
                    {msg.text.includes('**') ? (
                      <div>
                        {msg.text.split('**').map((part, i) => 
                          i % 2 === 1 ? <strong key={i} style={{ color: '#06b6d4' }}>{part}</strong> : <span key={i}>{part}</span>
                        )}
                      </div>
                    ) : msg.text.includes('```') ? (
                      <div>
                        {msg.text.split('```').map((part, i) => 
                          i % 2 === 1 ? (
                            <pre key={i} style={{
                              background: 'rgba(6, 182, 212, 0.1)',
                              padding: '8px',
                              borderRadius: '4px',
                              margin: '8px 0',
                              fontSize: '12px',
                              overflowX: 'auto',
                              border: '1px solid rgba(6, 182, 212, 0.2)'
                            }}>
                              {part}
                            </pre>
                          ) : (
                            <span key={i}>{part}</span>
                          )
                        )}
                      </div>
                    ) : (
                      msg.text
                    )}
                  </div>
                </div>
                
                {msg.type === 'user' && (
                  <div style={{ 
                    width: '32px', 
                    height: '32px', 
                    background: 'linear-gradient(135deg, #3b82f6, #2563eb)', 
                    borderRadius: '50%', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    fontSize: '12px', 
                    fontWeight: 'bold', 
                    color: 'white',
                    flexShrink: 0,
                    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                  }}>
                    U
                  </div>
                )}
              </div>
            ))}
            
            {/* Typing Indicator */}
            {isTyping && (
              <div style={{ 
                display: 'flex', 
                gap: '10px',
                animation: 'fadeInUp 0.3s ease-out'
              }}>
                <div style={{ 
                  width: '32px', 
                  height: '32px', 
                  background: 'linear-gradient(135deg, #06b6d4, #0891b2)', 
                  borderRadius: '50%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  fontSize: '12px', 
                  fontWeight: 'bold', 
                  color: 'white',
                  flexShrink: 0,
                  boxShadow: '0 4px 12px rgba(6, 182, 212, 0.3)',
                  animation: 'pulse 2s infinite'
                }}>
                  AI
                </div>
                <div style={{ 
                  background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(30, 41, 59, 0.5))',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  border: '1px solid rgba(6, 182, 212, 0.2)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
                }}>
                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: '#06b6d4',
                      animation: 'typingBounce 1.4s infinite ease-in-out'
                    }}></div>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: '#06b6d4',
                      animation: 'typingBounce 1.4s infinite ease-in-out 0.2s'
                    }}></div>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: '#06b6d4',
                      animation: 'typingBounce 1.4s infinite ease-in-out 0.4s'
                    }}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Commands */}
          <div style={{ marginBottom: '15px' }}>
            <div style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '8px' }}>
              Quick commands:
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {[
                'Guard the perimeter',
                'Patrol the area', 
                'Celebration show', 
                'Cinema shot',
                'All drones take off',
                'All drones land'
              ].map((cmd) => (
                <button 
                  key={cmd}
                  onClick={() => setChatInput(cmd)}
                  style={{
                    background: 'rgba(6, 182, 212, 0.1)',
                    color: '#06b6d4',
                    border: '1px solid rgba(6, 182, 212, 0.3)',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  {cmd}
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendCommand()}
                placeholder="Type your drone command here..."
                disabled={isTyping}
                style={{
                  width: '100%',
                  background: 'rgba(30, 41, 59, 0.5)',
                  border: '2px solid rgba(6, 182, 212, 0.2)',
                  borderRadius: '12px',
                  padding: '14px 16px',
                  color: '#f1f5f9',
                  fontSize: '14px',
                  transition: 'all 0.3s ease',
                  outline: 'none',
                  opacity: isTyping ? 0.6 : 1,
                  cursor: isTyping ? 'not-allowed' : 'text'
                }}
              />
              
              {/* Voice Mic Icon */}
              {voiceSupported && (
                <button
                  onClick={startVoiceRecognition}
                  disabled={isListening}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: isListening ? 'not-allowed' : 'pointer',
                    fontSize: '18px',
                    padding: '4px',
                    borderRadius: '4px',
                    transition: 'all 0.2s ease',
                    animation: isListening ? 'pulse 2s infinite' : 'none'
                  }}
                  title={isListening ? 'Recording...' : 'Click to speak command'}
                >
                  {isListening ? '🔴' : '🎤'}
                </button>
              )}
              
              {voiceTranscript && (
                <div style={{
                  position: 'absolute',
                  top: '-30px',
                  left: '0',
                  right: '0',
                  background: 'rgba(6, 182, 212, 0.9)',
                  color: 'white',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  border: '1px solid rgba(6, 182, 212, 0.5)',
                  boxShadow: '0 4px 12px rgba(6, 182, 212, 0.3)',
                  zIndex: 10
                }}>
                  "{voiceTranscript}"
                </div>
              )}
              
              <div style={{ 
                position: 'absolute', 
                right: '16px', 
                top: '50%', 
                transform: 'translateY(-50%)', 
                fontSize: '12px', 
                color: '#64748b',
                opacity: isTyping ? 0.3 : 0.6
              }}>
                {chatInput.length}/500
              </div>
            </div>
            <button 
              onClick={handleSendCommand}
              disabled={!chatInput.trim() || isTyping}
              style={{
                background: (chatInput.trim() && !isTyping) 
                  ? 'linear-gradient(135deg, #06b6d4, #0891b2)' 
                  : 'linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(6, 182, 212, 0.1))',
                color: (chatInput.trim() && !isTyping) ? 'white' : '#64748b',
                border: 'none',
                padding: '14px 24px',
                borderRadius: '12px',
                fontWeight: 600,
                cursor: (chatInput.trim() && !isTyping) ? 'pointer' : 'not-allowed',
                transition: 'all 0.3s ease',
                boxShadow: (chatInput.trim() && !isTyping) 
                  ? '0 4px 12px rgba(6, 182, 212, 0.4)' 
                  : '0 2px 8px rgba(0, 0, 0, 0.1)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                opacity: isTyping ? 0.6 : 1
              }}
            >
              <span>{isTyping ? 'Processing...' : 'Send'}</span>
              {!isTyping && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22"></polygon>
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Drone Information Panel */}
      <div style={{ 
        background: 'rgba(30, 41, 59, 0.5)', 
        borderRadius: '0.5rem', 
        padding: '1.5rem',
        marginTop: '2rem',
        border: '1px solid rgba(6, 182, 212, 0.2)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
      }}>
        <h2 style={{ 
          fontSize: '1.25rem', 
          fontWeight: 'bold', 
          color: '#06b6d4', 
          margin: '0 0 1.5rem 0',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <span>🚁 System Information</span>
          <div style={{ 
            fontSize: '0.875rem', 
            color: '#94a3b8',
            fontWeight: 'normal'
          }}>
            ({connectedDrones.filter(d => d.connected).length} drones connected)
          </div>
        </h2>

        {isConnected ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {connectedDrones.filter(drone => drone.connected).map((drone) => (
              <div key={drone.id} style={{ 
                background: 'rgba(15, 23, 42, 0.4)', 
                borderRadius: '0.75rem', 
                padding: '1.25rem',
                border: `2px solid ${drone.color}33`,
                boxShadow: `0 4px 16px ${drone.color}22`,
                position: 'relative',
                overflow: 'hidden'
              }}>
                {/* Drone Header */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '1rem',
                  paddingBottom: '0.75rem',
                  borderBottom: `1px solid ${drone.color}22`
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ 
                      width: '1rem', 
                      height: '1rem', 
                      borderRadius: '50%', 
                      background: drone.color,
                      animation: 'pulse 2s infinite',
                      boxShadow: `0 0 12px ${drone.color}66`
                    }}></div>
                    <div>
                      <h3 style={{ 
                        fontSize: '1.125rem', 
                        fontWeight: 'bold', 
                        color: drone.color,
                        margin: '0 0 0.25rem 0'
                      }}>
                        Drone {drone.id}
                      </h3>
                      <div style={{ 
                        fontSize: '0.875rem', 
                        color: '#10b981',
                        fontWeight: '600'
                      }}>
                        ✅ Connected
                      </div>
                    </div>
                  </div>
                  <div style={{ 
                    fontSize: '0.75rem', 
                    color: '#94a3b8',
                    background: 'rgba(30, 41, 59, 0.6)',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '0.25rem',
                    border: '1px solid rgba(6, 182, 212, 0.2)'
                  }}>
                    {drone.status.toUpperCase()}
                  </div>
                </div>

                {/* Drone Details Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  {/* Left Column */}
                  <div>
                    <div style={{ marginBottom: '0.75rem' }}>
                      <div style={{ 
                        fontSize: '0.75rem', 
                        color: '#64748b', 
                        marginBottom: '0.25rem',
                        fontWeight: '600'
                      }}>
                        📍 GPS LOCATION
                      </div>
                      <div style={{ 
                        fontSize: '0.875rem', 
                        color: '#f1f5f9',
                        fontFamily: 'monospace',
                        background: 'rgba(6, 182, 212, 0.1)',
                        padding: '0.5rem',
                        borderRadius: '0.25rem',
                        border: '1px solid rgba(6, 182, 212, 0.2)'
                      }}>
                        <div>Lat: {drone.gps.lat.toFixed(6)}°</div>
                        <div>Lng: {drone.gps.lng.toFixed(6)}°</div>
                        <div>Alt: {drone.gps.alt}m</div>
                      </div>
                    </div>

                    <div style={{ marginBottom: '0.75rem' }}>
                      <div style={{ 
                        fontSize: '0.75rem', 
                        color: '#64748b', 
                        marginBottom: '0.25rem',
                        fontWeight: '600'
                      }}>
                        📡 SIGNAL STRENGTH
                      </div>
                      <div style={{ 
                        fontSize: '1.5rem', 
                        fontWeight: 'bold', 
                        color: drone.signal > 80 ? '#10b981' : drone.signal > 50 ? '#f59e0b' : '#ef4444'
                      }}>
                        {drone.signal}%
                      </div>
                      <div style={{ 
                        fontSize: '0.75rem', 
                        color: '#64748b',
                        marginTop: '0.25rem'
                      }}>
                        {drone.signal > 80 ? 'Excellent' : drone.signal > 50 ? 'Good' : 'Weak'}
                      </div>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div>
                    <div style={{ marginBottom: '0.75rem' }}>
                      <div style={{ 
                        fontSize: '0.75rem', 
                        color: '#64748b', 
                        marginBottom: '0.25rem',
                        fontWeight: '600'
                      }}>
                        🔋 BATTERY LEVEL
                      </div>
                      <div style={{ 
                        fontSize: '1.5rem', 
                        fontWeight: 'bold', 
                        color: drone.battery > 70 ? '#10b981' : drone.battery > 30 ? '#f59e0b' : '#ef4444'
                      }}>
                        {drone.battery}%
                      </div>
                      <div style={{ 
                        fontSize: '0.75rem', 
                        color: '#64748b',
                        marginTop: '0.25rem'
                      }}>
                        {drone.battery > 70 ? 'Healthy' : drone.battery > 30 ? 'Moderate' : 'Low'}
                      </div>
                    </div>

                    <div style={{ marginBottom: '0.75rem' }}>
                      <div style={{ 
                        fontSize: '0.75rem', 
                        color: '#64748b', 
                        marginBottom: '0.25rem',
                        fontWeight: '600'
                      }}>
                        ⏱️ LAST UPDATE
                      </div>
                      <div style={{ 
                        fontSize: '0.875rem', 
                        color: '#f1f5f9',
                        fontFamily: 'monospace',
                        background: 'rgba(6, 182, 212, 0.1)',
                        padding: '0.5rem',
                        borderRadius: '0.25rem',
                        border: '1px solid rgba(6, 182, 212, 0.2)'
                      }}>
                        {new Date().toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ 
            textAlign: 'center', 
            padding: '3rem',
            color: '#64748b'
          }}>
            <div style={{ 
              fontSize: '3rem', 
              marginBottom: '1rem',
              opacity: 0.5
            }}>🚁</div>
            <div style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>
              No Drones Connected
            </div>
            <div style={{ fontSize: '0.875rem', color: '#94a3b8' }}>
              Connect to view detailed drone information
            </div>
          </div>
        )}

        {/* System Statistics */}
        {isConnected && (
          <div style={{ 
            marginTop: '2rem', 
            padding: '1rem',
            background: 'rgba(15, 23, 42, 0.3)',
            borderRadius: '0.5rem',
            border: '1px solid rgba(6, 182, 212, 0.2)'
          }}>
            <h3 style={{ 
              fontSize: '1rem', 
              fontWeight: 'bold', 
              color: '#06b6d4', 
              margin: '0 0 1rem 0'
            }}>
              📊 Fleet Statistics
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#06b6d4' }}>
                  {connectedDrones.filter(d => d.connected).length}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#94a3b8' }}>
                  Connected Drones
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b' }}>
                  {Math.round(connectedDrones.filter(d => d.connected).reduce((sum, d) => sum + d.battery, 0) / connectedDrones.filter(d => d.connected).length)}%
                </div>
                <div style={{ fontSize: '0.875rem', color: '#94a3b8' }}>
                  Avg Battery
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>
                  {Math.round(connectedDrones.filter(d => d.connected).reduce((sum, d) => sum + d.signal, 0) / connectedDrones.filter(d => d.connected).length)}%
                </div>
                <div style={{ fontSize: '0.875rem', color: '#94a3b8' }}>
                  Avg Signal
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#8b5cf6' }}>
                  {Math.round((connectedDrones.filter(d => d.connected).length / connectedDrones.length) * 100)}%
                </div>
                <div style={{ fontSize: '0.875rem', color: '#94a3b8' }}>
                  Fleet Online
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Safety Alerts Panel */}
      {safetyAlerts.length > 0 && (
        <div style={{ 
          background: 'rgba(239, 68, 68, 0.1)', 
          borderRadius: '0.5rem', 
          padding: '1rem',
          marginTop: '1rem',
          border: '2px solid rgba(239, 68, 68, 0.3)',
          boxShadow: '0 8px 32px rgba(239, 68, 68, 0.2)',
          animation: emergencyMode ? 'pulse 2s infinite' : 'none'
        }}>
          <h3 style={{ 
            fontSize: '1.125rem', 
            fontWeight: 'bold', 
            color: emergencyMode ? '#dc2626' : '#ef4444', 
            margin: '0 0 1rem 0',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            {emergencyMode ? '🚨 EMERGENCY ACTIVE' : '⚠️ SAFETY ALERTS'}
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '300px', overflowY: 'auto' }}>
            {safetyAlerts.map((alert, index) => (
              <div key={`${alert.id}-${alert.timestamp}-${index}`} style={{
                background: alert.type === 'emergency_landing' 
                  ? 'rgba(220, 38, 38, 0.3)' 
                  : alert.type === 'signal_lost' 
                    ? 'rgba(245, 158, 11, 0.3)' 
                    : 'rgba(251, 146, 60, 0.3)',
                borderRadius: '0.5rem',
                padding: '0.75rem',
                border: `1px solid ${
                  alert.type === 'emergency_landing' ? '#dc2626' :
                  alert.type === 'signal_lost' ? '#f59e0b' : '#fbbf24'
                }`,
                borderLeft: `4px solid ${
                  alert.type === 'emergency_landing' ? '#dc2626' :
                  alert.type === 'signal_lost' ? '#f59e0b' : '#fbbf24'
                }`,
                animation: 'fadeInUp 0.3s ease-out'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1rem' }}>
                      {alert.type === 'emergency_landing' ? '🚁' :
                       alert.type === 'signal_lost' ? '📡' : '🔋'}
                    </span>
                    <strong style={{ 
                      color: alert.type === 'emergency_landing' ? '#dc2626' :
                             alert.type === 'signal_lost' ? '#f59e0b' : '#fbbf24'
                    }}>
                      {alert.type === 'emergency_landing' ? 'EMERGENCY LANDING' :
                       alert.type === 'signal_lost' ? 'SIGNAL LOST' : 'LOW BATTERY'}
                    </strong>
                  </div>
                  <span style={{ 
                    fontSize: '0.75rem', 
                    color: '#94a3b8',
                    fontFamily: 'monospace'
                  }}>
                    {alert.timestamp}
                  </span>
                </div>
                <div style={{ 
                  fontSize: '0.875rem', 
                  color: '#f1f5f9',
                  lineHeight: '1.4'
                }}>
                  {alert.message}
                </div>
              </div>
            ))}
          </div>

          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginTop: '1rem',
            paddingTop: '0.75rem',
            borderTop: '1px solid rgba(239, 68, 68, 0.2)'
          }}>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              {emergencyLanding ? 'Emergency landing in progress...' : `${safetyAlerts.length} active alerts`}
            </div>
            <button
              onClick={clearSafetyAlerts}
              disabled={emergencyLanding}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                fontWeight: 600,
                cursor: emergencyLanding ? 'not-allowed' : 'pointer',
                border: 'none',
                background: 'rgba(30, 41, 59, 0.5)',
                color: '#64748b',
                fontSize: '0.75rem'
              }}
            >
              Clear Alerts
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer style={{
        background: 'rgba(30, 41, 59, 0.5)',
        borderTop: '1px solid rgba(6, 182, 212, 0.2)',
        marginTop: '2rem',
        padding: '1rem 0'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          fontSize: '0.875rem',
          color: '#94a3b8'
        }}>
          <div>AeroVision AI v1.0 - Cross-platform Drone Command PWA</div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <span>Connection: {droneService.getConnectionType()}</span>
            <span>•</span>
            <span>Drones: {connectedDrones.filter(d => d.connected).length}/{connectedDrones.length}</span>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        @keyframes ping {
          75%, 100% {
            transform: scale(2);
            opacity: 0;
          }
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes typingBounce {
          0%, 60%, 100% {
            transform: translateY(0);
          }
          30% {
            transform: translateY(-10px);
          }
        }
      `}</style>
    </div>
  );
}

export default AppSimpleChat;
