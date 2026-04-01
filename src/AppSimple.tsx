import React, { useState } from 'react';
import { droneService } from './services/DroneService';
import type { DroneCommand } from './types/drone';

function AppSimple() {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [lastCommand, setLastCommand] = useState<DroneCommand | null>(null);
  const [chatInput, setChatInput] = useState('');

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

  const handleCommand = async (command: DroneCommand) => {
    setLastCommand(command);
    try {
      const success = await droneService.sendCommand(command);
      if (success) {
        console.log('Command executed successfully:', command);
      } else {
        console.error('Command execution failed:', command);
      }
    } catch (error) {
      console.error('Error executing command:', error);
    }
  };

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    // Simple command parsing
    let command: DroneCommand = {
      droneId: 'all',
      command: 'HOVER'
    };

    const input = chatInput.toLowerCase();
    if (input.includes('guard')) {
      command = { droneId: 'all', command: 'GUARD' };
    } else if (input.includes('patrol')) {
      command = { droneId: 'all', command: 'PATROL' };
    } else if (input.includes('celebration')) {
      command = { droneId: 'all', command: 'CELEBRATION' };
    } else if (input.includes('cinema')) {
      command = { droneId: 'all', command: 'CINEMA' };
    } else if (input.includes('take off')) {
      command = { droneId: 'all', command: 'TAKEOFF' };
    } else if (input.includes('land')) {
      command = { droneId: 'all', command: 'LAND' };
    }

    handleCommand(command);
    setChatInput('');
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header>
        <div className="container">
          <div className="header-content">
            <div className="logo">
              <div className="logo-icon">AV</div>
              <h1 className="logo-text">AeroVision AI</h1>
              <span className="subtitle">Drone Command Center</span>
            </div>
            
            <div className="connection-status">
              <div className="status-indicator">
                <div className={`status-dot ${connectionStatus}`}></div>
                <span className="status-text">
                  {connectionStatus === 'connected' ? 'Connected' :
                   connectionStatus === 'connecting' ? 'Connecting...' :
                   'Disconnected'}
                </span>
              </div>

              <button
                onClick={isConnected ? handleDisconnect : handleConnect}
                disabled={connectionStatus === 'connecting'}
                className={`connect-btn ${isConnected ? 'disconnect' : 'connect'}`}
              >
                {isConnected ? 'Disconnect' : 'Connect'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>
        <div className="container">
          <div className="dashboard-grid">
            
            {/* Fleet Sidebar */}
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Fleet Status</h2>
                <div className="status-indicator">
                  <div className="status-dot connected"></div>
                  <span className="status-text">3 Active</span>
                </div>
              </div>

              <div className="drone-card">
                <div className="drone-header">
                  <div className="drone-name">
                    <div className="status-dot connected"></div>
                    Alpha
                    <span className="drone-id">#1</span>
                  </div>
                  <span className="drone-status">patrolling</span>
                </div>
                <div className="telemetry-item">
                  <span className="telemetry-label">Battery</span>
                  <div className="telemetry-value">
                    <div className="progress-bar">
                      <div className="progress-fill battery-good" style={{width: '85%'}}></div>
                    </div>
                    <span>85%</span>
                  </div>
                </div>
                <div className="telemetry-item">
                  <span className="telemetry-label">Signal</span>
                  <div className="telemetry-value">
                    <div className="progress-bar">
                      <div className="progress-fill battery-good" style={{width: '92%'}}></div>
                    </div>
                    <span>92%</span>
                  </div>
                </div>
                <div className="telemetry-item">
                  <span className="telemetry-label">GPS</span>
                  <div className="telemetry-value">
                    <div>Lat: 37.7749</div>
                    <div>Lng: -122.4194</div>
                    <div>Alt: 120m</div>
                  </div>
                </div>
              </div>

              <div className="drone-card">
                <div className="drone-header">
                  <div className="drone-name">
                    <div className="status-dot connected"></div>
                    Bravo
                    <span className="drone-id">#2</span>
                  </div>
                  <span className="drone-status">idle</span>
                </div>
                <div className="telemetry-item">
                  <span className="telemetry-label">Battery</span>
                  <div className="telemetry-value">
                    <div className="progress-bar">
                      <div className="progress-fill battery-medium" style={{width: '67%'}}></div>
                    </div>
                    <span>67%</span>
                  </div>
                </div>
                <div className="telemetry-item">
                  <span className="telemetry-label">Signal</span>
                  <div className="telemetry-value">
                    <div className="progress-bar">
                      <div className="progress-fill battery-good" style={{width: '88%'}}></div>
                    </div>
                    <span>88%</span>
                  </div>
                </div>
                <div className="telemetry-item">
                  <span className="telemetry-label">GPS</span>
                  <div className="telemetry-value">
                    <div>Lat: 37.7849</div>
                    <div>Lng: -122.4094</div>
                    <div>Alt: 95m</div>
                  </div>
                </div>
              </div>

              <div className="drone-card">
                <div className="drone-header">
                  <div className="drone-name">
                    <div className="status-dot connected"></div>
                    Charlie
                    <span className="drone-id">#3</span>
                  </div>
                  <span className="drone-status">guarding</span>
                </div>
                <div className="telemetry-item">
                  <span className="telemetry-label">Battery</span>
                  <div className="telemetry-value">
                    <div className="progress-bar">
                      <div className="progress-fill battery-good" style={{width: '92%'}}></div>
                    </div>
                    <span>92%</span>
                  </div>
                </div>
                <div className="telemetry-item">
                  <span className="telemetry-label">Signal</span>
                  <div className="telemetry-value">
                    <div className="progress-bar">
                      <div className="progress-fill battery-good" style={{width: '95%'}}></div>
                    </div>
                    <span>95%</span>
                  </div>
                </div>
                <div className="telemetry-item">
                  <span className="telemetry-label">GPS</span>
                  <div className="telemetry-value">
                    <div>Lat: 37.7649</div>
                    <div>Lng: -122.4294</div>
                    <div>Alt: 150m</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Central Map */}
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Drone Positioning</h2>
                <div className="status-indicator">
                  <div className="status-dot connected"></div>
                  <span className="status-text">3D View</span>
                </div>
              </div>
              <div className="map-container">
                <div className="map-grid">
                  {[...Array(10)].map((_, i) => (
                    <div key={`h-${i}`} className="grid-line-h" style={{ top: `${i * 10}%` }}></div>
                  ))}
                  {[...Array(10)].map((_, i) => (
                    <div key={`v-${i}`} className="grid-line-v" style={{ left: `${i * 10}%` }}></div>
                  ))}
                </div>

                <div className="drone-marker alpha" style={{ top: '25%', left: '25%' }}></div>
                <div className="drone-label alpha" style={{ top: '25%', left: '25%', transform: 'translate(-50%, -150%)' }}>Alpha</div>

                <div className="drone-marker bravo" style={{ top: '50%', right: '33%' }}></div>
                <div className="drone-label bravo" style={{ top: '50%', right: '33%', transform: 'translate(50%, -150%)' }}>Bravo</div>

                <div className="drone-marker charlie" style={{ bottom: '33%', left: '50%' }}></div>
                <div className="drone-label charlie" style={{ bottom: '33%', left: '50%', transform: 'translate(-50%, 150%)' }}>Charlie</div>

                <div style={{ position: 'absolute', bottom: '1rem', left: '1rem', fontSize: '0.75rem', color: '#94a3b8' }}>
                  <div>Alt: 120m</div>
                  <div>Range: 500m</div>
                  <div>Zoom: 1.0x</div>
                </div>

                <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <button className="example-btn">+</button>
                  <button className="example-btn">-</button>
                  <button className="example-btn">⊙</button>
                </div>
              </div>
            </div>

            {/* AI Chat Zone */}
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">AI Mission Command</h2>
                <div className="status-indicator">
                  <div className="status-dot connected"></div>
                  <span className="status-text">AI Ready</span>
                </div>
              </div>

              <form onSubmit={handleChatSubmit} className="chat-form">
                <textarea
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Enter natural language command..."
                  className="chat-textarea"
                />

                <button type="submit" className="chat-submit">
                  Execute Command
                </button>

                {lastCommand && (
                  <div className="last-command">
                    <div className="last-command-title">Last Command Sent</div>
                    <pre className="last-command-code">
                      {JSON.stringify(lastCommand, null, 2)}
                    </pre>
                  </div>
                )}

                <div className="example-commands">
                  <div className="example-title">Example Commands:</div>
                  <div className="example-buttons">
                    <button type="button" className="example-btn" onClick={() => setChatInput('Guard the perimeter')}>
                      Guard the perimeter
                    </button>
                    <button type="button" className="example-btn" onClick={() => setChatInput('Patrol the area')}>
                      Patrol the area
                    </button>
                    <button type="button" className="example-btn" onClick={() => setChatInput('Celebration show')}>
                      Celebration show
                    </button>
                    <button type="button" className="example-btn" onClick={() => setChatInput('Cinema shot')}>
                      Cinema shot
                    </button>
                    <button type="button" className="example-btn" onClick={() => setChatInput('All drones take off')}>
                      All drones take off
                    </button>
                    <button type="button" className="example-btn" onClick={() => setChatInput('All drones land')}>
                      All drones land
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>

          {/* Mode Selectors */}
          <div className="mode-selector">
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Mission Modes</h2>
                <div className="status-indicator">
                  <div className="status-dot connected"></div>
                  <span className="status-text">Ready</span>
                </div>
              </div>

              <div className="mode-grid">
                <button className="mode-card" onClick={() => handleCommand({ droneId: 'all', command: 'GUARD' })}>
                  <div className="mode-icon">🛡️</div>
                  <div className="mode-name">Guard Mode</div>
                  <div className="mode-description">Perimeter surveillance</div>
                  <div className="mode-status">
                    <div className="mode-status-dot"></div>
                    Click to activate
                  </div>
                </button>

                <button className="mode-card" onClick={() => handleCommand({ droneId: 'all', command: 'CELEBRATION' })}>
                  <div className="mode-icon">🎆</div>
                  <div className="mode-name">Celebration Show</div>
                  <div className="mode-description">Aerial light display</div>
                  <div className="mode-status">
                    <div className="mode-status-dot"></div>
                    Click to activate
                  </div>
                </button>

                <button className="mode-card" onClick={() => handleCommand({ droneId: 'all', command: 'CINEMA' })}>
                  <div className="mode-icon">🎬</div>
                  <div className="mode-name">Cinema Shot</div>
                  <div className="mode-description">Cinematic filming</div>
                  <div className="mode-status">
                    <div className="mode-status-dot"></div>
                    Click to activate
                  </div>
                </button>
              </div>

              <div className="quick-actions">
                <div className="quick-buttons">
                  <button className="quick-btn takeoff" onClick={() => handleCommand({ droneId: 'all', command: 'TAKEOFF' })}>
                    🚁 All Takeoff
                  </button>
                  <button className="quick-btn land" onClick={() => handleCommand({ droneId: 'all', command: 'LAND' })}>
                    🛬 All Land
                  </button>
                  <button className="quick-btn hover" onClick={() => handleCommand({ droneId: 'all', command: 'HOVER' })}>
                    ⏸️ All Hover
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer>
        <div className="container">
          <div className="footer-content">
            <div className="footer-text">
              AeroVision AI v1.0 - Cross-platform Drone Command PWA
            </div>
            <div className="footer-info">
              <span>Connection: {droneService.getConnectionType()}</span>
              <span>•</span>
              <span>Drones: 3</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default AppSimple;
