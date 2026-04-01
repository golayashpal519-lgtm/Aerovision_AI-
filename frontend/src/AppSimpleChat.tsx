import { useState, useEffect, useRef } from 'react';
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
    console.log(`User response to the install prompt: ${outcome}`);
    setDeferredPrompt(null);
    setShowInstallButton(false);
  };

  const handleConnect = async () => {
    setConnectionStatus('connecting');
    try {
      const success = await droneService.connect();
      setIsConnected(success);
      setConnectionStatus(success ? 'connected' : 'disconnected');
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
    } catch (error) {
      console.error('Disconnection failed:', error);
    }
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
        
        {/* Chat Interface */}
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

        {/* Drone Positioning Map */}
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

            {/* Drone Markers */}
            <div style={{ 
              position: 'absolute', 
              top: '25%', 
              left: '25%', 
              transform: 'translate(-50%, -50%)',
              cursor: 'pointer',
              transition: 'transform 0.3s ease'
            }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1.2)';
                setSelectedDrone('Alpha');
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
                background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                animation: 'pulse 2s infinite',
                boxShadow: '0 0 20px rgba(59, 130, 246, 0.6)'
              }}></div>
              <div style={{ 
                position: 'absolute', 
                inset: 0, 
                width: '1.25rem', 
                height: '1.25rem', 
                borderRadius: '50%', 
                background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                animation: 'ping 2s infinite'
              }}></div>
              <div style={{ 
                position: 'absolute', 
                top: '-1.5rem', 
                left: '50%', 
                transform: 'translateX(-50%)', 
                fontSize: '0.75rem', 
                color: '#3b82f6', 
                whiteSpace: 'nowrap',
                fontWeight: 'bold',
                background: 'rgba(30, 41, 59, 0.8)',
                padding: '0.125rem 0.5rem',
                borderRadius: '0.25rem',
                border: '1px solid rgba(59, 130, 246, 0.3)'
              }}>
                Alpha
              </div>
            </div>

            <div style={{ 
              position: 'absolute', 
              top: '50%', 
              right: '33%', 
              transform: 'translate(50%, -50%)',
              cursor: 'pointer',
              transition: 'transform 0.3s ease'
            }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translate(50%, -50%) scale(1.2)';
                setSelectedDrone('Bravo');
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translate(50%, -50%) scale(1)';
                setSelectedDrone(null);
              }}
            >
              <div style={{ 
                position: 'relative', 
                width: '1.25rem', 
                height: '1.25rem', 
                borderRadius: '50%', 
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                animation: 'pulse 2s infinite',
                boxShadow: '0 0 20px rgba(245, 158, 11, 0.6)'
              }}></div>
              <div style={{ 
                position: 'absolute', 
                inset: 0, 
                width: '1.25rem', 
                height: '1.25rem', 
                borderRadius: '50%', 
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                animation: 'ping 2s infinite'
              }}></div>
              <div style={{ 
                position: 'absolute', 
                top: '-1.5rem', 
                left: '50%', 
                transform: 'translateX(-50%)', 
                fontSize: '0.75rem', 
                color: '#f59e0b', 
                whiteSpace: 'nowrap',
                fontWeight: 'bold',
                background: 'rgba(30, 41, 59, 0.8)',
                padding: '0.125rem 0.5rem',
                borderRadius: '0.25rem',
                border: '1px solid rgba(245, 158, 11, 0.3)'
              }}>
                Bravo
              </div>
            </div>

            <div style={{ 
              position: 'absolute', 
              bottom: '33%', 
              left: '50%', 
              transform: 'translate(-50%, 50%)',
              cursor: 'pointer',
              transition: 'transform 0.3s ease'
            }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translate(-50%, 50%) scale(1.2)';
                setSelectedDrone('Charlie');
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translate(-50%, 50%) scale(1)';
                setSelectedDrone(null);
              }}
            >
              <div style={{ 
                position: 'relative', 
                width: '1.25rem', 
                height: '1.25rem', 
                borderRadius: '50%', 
                background: 'linear-gradient(135deg, #10b981, #059669)',
                animation: 'pulse 2s infinite',
                boxShadow: '0 0 20px rgba(16, 185, 129, 0.6)'
              }}></div>
              <div style={{ 
                position: 'absolute', 
                inset: 0, 
                width: '1.25rem', 
                height: '1.25rem', 
                borderRadius: '50%', 
                background: 'linear-gradient(135deg, #10b981, #059669)',
                animation: 'ping 2s infinite'
              }}></div>
              <div style={{ 
                position: 'absolute', 
                bottom: '-1.5rem', 
                left: '50%', 
                transform: 'translateX(-50%)', 
                fontSize: '0.75rem', 
                color: '#10b981', 
                whiteSpace: 'nowrap',
                fontWeight: 'bold',
                background: 'rgba(30, 41, 59, 0.8)',
                padding: '0.125rem 0.5rem',
                borderRadius: '0.25rem',
                border: '1px solid rgba(16, 185, 129, 0.3)'
              }}>
                Charlie
              </div>
            </div>

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

        {/* Fleet Status */}
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
            // Show all drones with their statuses
            ['Alpha', 'Bravo', 'Charlie'].map((name, index) => (
              <div key={name} style={{ 
                background: 'rgba(30, 41, 59, 0.3)', 
                borderRadius: '0.5rem', 
                padding: '0.75rem', 
                marginBottom: '0.75rem',
                border: '1px solid rgba(6, 182, 212, 0.2)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ 
                      width: '0.5rem', 
                      height: '0.5rem', 
                      borderRadius: '50%', 
                      background: index === 0 ? '#10b981' : index === 1 ? '#f59e0b' : '#10b981',
                      animation: 'pulse 2s infinite'
                    }}></div>
                    <span style={{ fontWeight: 600, color: '#f1f5f9' }}>{name}</span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>
                    {index === 0 ? 'patrolling' : index === 1 ? 'idle' : 'guarding'}
                  </span>
                </div>
                
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span>Battery:</span>
                    <span style={{ color: '#f1f5f9' }}>{index === 0 ? '85%' : index === 1 ? '67%' : '92%'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span>Signal:</span>
                    <span style={{ color: '#f1f5f9' }}>{index === 0 ? '92%' : index === 1 ? '88%' : '95%'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span>GPS:</span>
                    <span style={{ color: '#f1f5f9' }}>Lat: {(37.7749 + index * 0.01).toFixed(4)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span></span>
                    <span style={{ color: '#f1f5f9' }}>Lng: {(-122.4194 + index * 0.01).toFixed(4)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Alt:</span>
                    <span style={{ color: '#f1f5f9' }}>{120 - index * 25}m</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            // Show disconnected state
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: 'calc(100% - 3rem)',
              color: '#64748b',
              textAlign: 'center'
            }}>
              <div style={{ 
                width: '4rem', 
                height: '4rem', 
                borderRadius: '50%', 
                background: 'rgba(30, 41, 59, 0.5)', 
                border: '2px solid rgba(239, 68, 68, 0.3)',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                marginBottom: '1rem',
                fontSize: '2rem'
              }}>
                🚁
              </div>
              <div style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem', color: '#ef4444' }}>
                No Drones Connected
              </div>
              <div style={{ fontSize: '0.875rem', opacity: 0.7 }}>
                Click "Connect" to establish drone connection
              </div>
            </div>
          )}
        </div>
      </div>
      </div>

      {/* Footer */}
      <div style={{ 
        background: 'rgba(30, 41, 59, 0.5)', 
        backdropFilter: 'blur(8px)', 
        borderTop: '1px solid rgba(6, 182, 212, 0.2)', 
        marginTop: '2rem', 
        padding: '1rem 0' 
      }}>
        <div style={{ maxWidth: '75rem', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: '0.875rem', color: '#94a3b8' }}>
            AeroVision AI v1.0 - Cross-platform Drone Command PWA
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.875rem', color: '#94a3b8' }}>
            <span>Connection: {droneService.getConnectionType()}</span>
            <span>•</span>
            <span>Drones: 3</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AppSimpleChat;
