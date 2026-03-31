import React, { useState, useEffect } from 'react';
import type { DroneTelemetry } from '../types/drone';

export const FleetSidebar: React.FC = () => {
  const [drones, setDrones] = useState<DroneTelemetry[]>([]);

  useEffect(() => {
    // Initialize mock telemetry data
    const mockDrones: DroneTelemetry[] = [
      {
        id: 'drone-1',
        name: 'Alpha',
        battery: 85,
        gps: { lat: 37.7749, lng: -122.4194, alt: 120 },
        signal: 92,
        status: 'patrolling',
        lastUpdate: new Date()
      },
      {
        id: 'drone-2',
        name: 'Bravo',
        battery: 67,
        gps: { lat: 37.7849, lng: -122.4094, alt: 95 },
        signal: 88,
        status: 'idle',
        lastUpdate: new Date()
      },
      {
        id: 'drone-3',
        name: 'Charlie',
        battery: 92,
        gps: { lat: 37.7649, lng: -122.4294, alt: 150 },
        signal: 95,
        status: 'guarding',
        lastUpdate: new Date()
      }
    ];
    setDrones(mockDrones);

    // Simulate real-time updates
    const interval = setInterval(() => {
      setDrones(prevDrones => 
        prevDrones.map(drone => ({
          ...drone,
          battery: Math.max(0, drone.battery - Math.random() * 0.5),
          signal: Math.max(70, Math.min(100, drone.signal + (Math.random() - 0.5) * 5)),
          gps: {
            ...drone.gps,
            lat: drone.gps.lat + (Math.random() - 0.5) * 0.0001,
            lng: drone.gps.lng + (Math.random() - 0.5) * 0.0001,
            alt: Math.max(50, Math.min(200, drone.gps.alt + (Math.random() - 0.5) * 10))
          },
          lastUpdate: new Date()
        }))
      );
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: DroneTelemetry['status']) => {
    switch (status) {
      case 'flying': return 'bg-green-500';
      case 'patrolling': return 'bg-blue-500';
      case 'guarding': return 'bg-yellow-500';
      case 'celebrating': return 'bg-purple-500';
      case 'filming': return 'bg-red-500';
      case 'idle': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getBatteryColor = (battery: number) => {
    if (battery > 60) return 'bg-green-500';
    if (battery > 30) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getSignalColor = (signal: number) => {
    if (signal > 80) return 'bg-green-500';
    if (signal > 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="aero-card h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-aero-cyan-400">Fleet Status</h2>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-xs text-slate-400">{drones.length} Active</span>
        </div>
      </div>

      <div className="space-y-4">
        {drones.map((drone) => (
          <div key={drone.id} className="bg-aero-slate-700/30 rounded-lg p-3 border border-aero-cyan-500/10">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${getStatusColor(drone.status)}`}></div>
                <h3 className="font-semibold text-slate-100">{drone.name}</h3>
                <span className="text-xs text-slate-400">#{drone.id.split('-')[1]}</span>
              </div>
              <span className="text-xs capitalize text-slate-400">{drone.status}</span>
            </div>

            <div className="space-y-2">
              {/* Battery */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Battery</span>
                <div className="flex items-center space-x-2">
                  <div className="w-16 bg-aero-slate-600 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${getBatteryColor(drone.battery)}`}
                      style={{ width: `${drone.battery}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-slate-300 w-8">{Math.round(drone.battery)}%</span>
                </div>
              </div>

              {/* Signal */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Signal</span>
                <div className="flex items-center space-x-2">
                  <div className="w-16 bg-aero-slate-600 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${getSignalColor(drone.signal)}`}
                      style={{ width: `${drone.signal}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-slate-300 w-8">{Math.round(drone.signal)}%</span>
                </div>
              </div>

              {/* GPS */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">GPS</span>
                <div className="text-xs text-slate-300">
                  <div>Lat: {drone.gps.lat.toFixed(4)}</div>
                  <div>Lng: {drone.gps.lng.toFixed(4)}</div>
                  <div>Alt: {Math.round(drone.gps.alt)}m</div>
                </div>
              </div>

              {/* Last Update */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Last Update</span>
                <span className="text-xs text-slate-300">
                  {drone.lastUpdate.toLocaleTimeString()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
