import React, { useState } from 'react';
import { AIChatZone } from './components/AIChatZone';
import { FleetSidebar } from './components/FleetSidebar';
import { CentralMap } from './components/CentralMap';
import { ModeSelectors } from './components/ModeSelectors';
import { droneService } from './services/DroneService';
import type { DroneCommand } from './types/drone';

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [lastCommand, setLastCommand] = useState<DroneCommand | null>(null);

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

  return (
    <div className="min-h-screen bg-aero-slate-900 text-slate-100">
      {/* Header */}
      <header className="bg-aero-slate-800/50 backdrop-blur-sm border-b border-aero-cyan-500/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-aero-cyan-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">AV</span>
                </div>
                <h1 className="text-2xl font-bold text-aero-cyan-400">AeroVision AI</h1>
              </div>
              <span className="text-sm text-slate-400">Drone Command Center</span>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Connection Status */}
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  connectionStatus === 'connected' ? 'bg-green-500 animate-pulse' :
                  connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' :
                  'bg-red-500'
                }`}></div>
                <span className="text-sm text-slate-400">
                  {connectionStatus === 'connected' ? 'Connected' :
                   connectionStatus === 'connecting' ? 'Connecting...' :
                   'Disconnected'}
                </span>
              </div>

              {/* Connection Button */}
              <button
                onClick={isConnected ? handleDisconnect : handleConnect}
                disabled={connectionStatus === 'connecting'}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  isConnected 
                    ? 'bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30'
                    : 'bg-green-600/20 hover:bg-green-600/30 text-green-400 border border-green-500/30'
                } disabled:opacity-50`}
              >
                {isConnected ? 'Disconnect' : 'Connect'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-8rem)]">
          
          {/* Fleet Sidebar - Left */}
          <div className="lg:col-span-3">
            <FleetSidebar />
          </div>

          {/* Central Map - Middle */}
          <div className="lg:col-span-6">
            <CentralMap />
          </div>

          {/* AI Chat Zone - Right */}
          <div className="lg:col-span-3">
            <AIChatZone onCommand={handleCommand} />
          </div>
        </div>

        {/* Mode Selectors - Bottom */}
        <div className="mt-6">
          <ModeSelectors onModeSelect={handleCommand} />
        </div>

        {/* Last Command Display */}
        {lastCommand && (
          <div className="mt-6 aero-card">
            <h3 className="text-lg font-semibold text-aero-cyan-400 mb-2">Last Command Sent</h3>
            <pre className="text-sm text-slate-300 overflow-x-auto">
              {JSON.stringify(lastCommand, null, 2)}
            </pre>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-aero-slate-800/50 backdrop-blur-sm border-t border-aero-cyan-500/20 mt-8">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-400">
              AeroVision AI v1.0 - Cross-platform Drone Command PWA
            </div>
            <div className="flex items-center space-x-4 text-sm text-slate-400">
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

export default App;
