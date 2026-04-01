import React from 'react';

export const CentralMap: React.FC = () => {
  return (
    <div className="aero-card h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-aero-cyan-400">Drone Positioning</h2>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-xs text-slate-400">3D View</span>
        </div>
      </div>

      <div className="flex-1 relative bg-aero-slate-800/30 rounded-lg border border-aero-cyan-500/20 overflow-hidden">
        {/* 3D Map Placeholder */}
        <div className="absolute inset-0 bg-gradient-to-br from-aero-slate-800/50 to-aero-slate-900/50">
          {/* Grid Lines */}
          <div className="absolute inset-0 opacity-20">
            {[...Array(10)].map((_, i) => (
              <div key={`h-${i}`} className="absolute w-full border-t border-aero-cyan-500/10" style={{ top: `${i * 10}%` }}></div>
            ))}
            {[...Array(10)].map((_, i) => (
              <div key={`v-${i}`} className="absolute h-full border-l border-aero-cyan-500/10" style={{ left: `${i * 10}%` }}></div>
            ))}
          </div>

          {/* Drone Position Indicators */}
          <div className="absolute top-1/4 left-1/4 transform -translate-x-1/2 -translate-y-1/2">
            <div className="relative">
              <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse"></div>
              <div className="absolute inset-0 w-4 h-4 bg-blue-500 rounded-full animate-ping"></div>
              <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs text-blue-400 whitespace-nowrap">Alpha</div>
            </div>
          </div>

          <div className="absolute top-1/2 right-1/3 transform translate-x-1/2 -translate-y-1/2">
            <div className="relative">
              <div className="w-4 h-4 bg-yellow-500 rounded-full animate-pulse"></div>
              <div className="absolute inset-0 w-4 h-4 bg-yellow-500 rounded-full animate-ping"></div>
              <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs text-yellow-400 whitespace-nowrap">Bravo</div>
            </div>
          </div>

          <div className="absolute bottom-1/3 left-1/2 transform -translate-x-1/2 translate-y-1/2">
            <div className="relative">
              <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
              <div className="absolute inset-0 w-4 h-4 bg-green-500 rounded-full animate-ping"></div>
              <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-green-400 whitespace-nowrap">Charlie</div>
            </div>
          </div>

          {/* 3D Depth Indicators */}
          <div className="absolute bottom-4 left-4 text-xs text-slate-400">
            <div>Alt: 120m</div>
            <div>Range: 500m</div>
            <div>Zoom: 1.0x</div>
          </div>

          {/* Controls */}
          <div className="absolute top-4 right-4 flex flex-col space-y-2">
            <button className="w-8 h-8 bg-aero-slate-700/50 hover:bg-aero-slate-600/50 rounded border border-aero-cyan-500/20 text-slate-300 text-xs transition-colors">
              +
            </button>
            <button className="w-8 h-8 bg-aero-slate-700/50 hover:bg-aero-slate-600/50 rounded border border-aero-cyan-500/20 text-slate-300 text-xs transition-colors">
              -
            </button>
            <button className="w-8 h-8 bg-aero-slate-700/50 hover:bg-aero-slate-600/50 rounded border border-aero-cyan-500/20 text-slate-300 text-xs transition-colors">
              ⊙
            </button>
          </div>
        </div>

        {/* Map Info Overlay */}
        <div className="absolute bottom-4 right-4 bg-aero-slate-800/80 backdrop-blur-sm rounded px-2 py-1 text-xs text-slate-300">
          3D Drone Map v1.0
        </div>
      </div>
    </div>
  );
};
