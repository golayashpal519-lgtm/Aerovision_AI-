import React from 'react';
import type { DroneCommand } from '../types/drone';

interface ModeSelectorsProps {
  onModeSelect: (command: DroneCommand) => void;
}

export const ModeSelectors: React.FC<ModeSelectorsProps> = ({ onModeSelect }) => {
  const modes = [
    {
      id: 'guard',
      name: 'Guard Mode',
      description: 'Perimeter surveillance',
      icon: '🛡️',
      command: { droneId: 'all', command: 'GUARD' } as DroneCommand,
      color: 'from-yellow-600 to-orange-600'
    },
    {
      id: 'celebration',
      name: 'Celebration Show',
      description: 'Aerial light display',
      icon: '🎆',
      command: { droneId: 'all', command: 'CELEBRATION' } as DroneCommand,
      color: 'from-purple-600 to-pink-600'
    },
    {
      id: 'cinema',
      name: 'Cinema Shot',
      description: 'Cinematic filming',
      icon: '🎬',
      command: { droneId: 'all', command: 'CINEMA' } as DroneCommand,
      color: 'from-red-600 to-rose-600'
    }
  ];

  return (
    <div className="aero-card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-aero-cyan-400">Mission Modes</h2>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-xs text-slate-400">Ready</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {modes.map((mode) => (
          <button
            key={mode.id}
            onClick={() => onModeSelect(mode.command)}
            className="group relative overflow-hidden rounded-lg border border-aero-cyan-500/20 bg-aero-slate-800/30 p-6 text-left transition-all duration-300 hover:border-aero-cyan-500/40 hover:bg-aero-slate-800/50 hover:scale-105 hover:shadow-lg hover:shadow-aero-cyan-500/10"
          >
            {/* Gradient Background */}
            <div className={`absolute inset-0 bg-gradient-to-br ${mode.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
            
            {/* Content */}
            <div className="relative z-10">
              <div className="text-4xl mb-3 group-hover:animate-bounce">{mode.icon}</div>
              <h3 className="text-lg font-bold text-slate-100 mb-2 group-hover:text-aero-cyan-400 transition-colors">
                {mode.name}
              </h3>
              <p className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">
                {mode.description}
              </p>
              
              {/* Activation Indicator */}
              <div className="mt-4 flex items-center space-x-2">
                <div className="w-2 h-2 bg-slate-600 rounded-full group-hover:bg-aero-cyan-500 transition-colors"></div>
                <span className="text-xs text-slate-500 group-hover:text-aero-cyan-400 transition-colors">
                  Click to activate
                </span>
              </div>
            </div>

            {/* Hover Effect Border */}
            <div className="absolute inset-0 rounded-lg border-2 border-transparent group-hover:border-aero-cyan-500/30 transition-all duration-300 pointer-events-none"></div>
          </button>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mt-6 pt-4 border-t border-aero-cyan-500/20">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onModeSelect({ droneId: 'all', command: 'TAKEOFF' })}
            className="px-4 py-2 bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 rounded-lg text-green-400 text-sm font-medium transition-colors"
          >
            🚁 All Takeoff
          </button>
          <button
            onClick={() => onModeSelect({ droneId: 'all', command: 'LAND' })}
            className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 rounded-lg text-red-400 text-sm font-medium transition-colors"
          >
            🛬 All Land
          </button>
          <button
            onClick={() => onModeSelect({ droneId: 'all', command: 'HOVER' })}
            className="px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 rounded-lg text-blue-400 text-sm font-medium transition-colors"
          >
            ⏸️ All Hover
          </button>
        </div>
      </div>
    </div>
  );
};
