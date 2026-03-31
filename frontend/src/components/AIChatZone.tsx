import React, { useState } from 'react';
import type { DroneCommand, ParsedCommand } from '../types/drone';

interface AIChatZoneProps {
  onCommand: (command: DroneCommand) => void;
}

export const AIChatZone: React.FC<AIChatZoneProps> = ({ onCommand }) => {
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastCommand, setLastCommand] = useState<DroneCommand | null>(null);

  const parseNaturalLanguage = (text: string): ParsedCommand => {
    const lowerText = text.toLowerCase().trim();
    
    // Extract drone ID
    let droneId: string | 'all' = 'all';
    if (lowerText.includes('drone 1') || lowerText.includes('first drone')) {
      droneId = 'drone-1';
    } else if (lowerText.includes('drone 2') || lowerText.includes('second drone')) {
      droneId = 'drone-2';
    } else if (lowerText.includes('drone 3') || lowerText.includes('third drone')) {
      droneId = 'drone-3';
    }

    // Extract command
    let command: DroneCommand['command'] = 'HOVER';
    if (lowerText.includes('guard') || lowerText.includes('perimeter')) {
      command = 'GUARD';
    } else if (lowerText.includes('patrol') || lowerText.includes('surveillance')) {
      command = 'PATROL';
    } else if (lowerText.includes('celebration') || lowerText.includes('show') || lowerText.includes('fireworks')) {
      command = 'CELEBRATION';
    } else if (lowerText.includes('cinema') || lowerText.includes('film') || lowerText.includes('shot')) {
      command = 'CINEMA';
    } else if (lowerText.includes('take off') || lowerText.includes('launch')) {
      command = 'TAKEOFF';
    } else if (lowerText.includes('land') || lowerText.includes('return')) {
      command = 'LAND';
    } else if (lowerText.includes('move') || lowerText.includes('go to') || lowerText.includes('fly to')) {
      command = 'MOVE';
    }

    // Extract coordinates (simple pattern matching)
    const coordRegex = /(\d+\.?\d*)[,\s]+(\d+\.?\d*)[,\s]+(\d+\.?\d*)/;
    const coordMatch = lowerText.match(coordRegex);
    let coordinates: [number, number, number] | undefined;
    
    if (coordMatch) {
      coordinates = [
        parseFloat(coordMatch[1]),
        parseFloat(coordMatch[2]),
        parseFloat(coordMatch[3])
      ];
    }

    // Extract altitude
    const altitudeRegex = /(\d+)\s*(?:m|meter|feet|ft)/i;
    const altitudeMatch = lowerText.match(altitudeRegex);
    const altitude = altitudeMatch ? parseFloat(altitudeMatch[1]) : undefined;

    // Extract speed
    const speedRegex = /(\d+)\s*(?:km\/h|mph|knots)/i;
    const speedMatch = lowerText.match(speedRegex);
    const speed = speedMatch ? parseFloat(speedMatch[1]) : undefined;

    // Extract duration
    const durationRegex = /(\d+)\s*(?:min|minutes?|sec|seconds?|hour|hours?)/i;
    const durationMatch = lowerText.match(durationRegex);
    const duration = durationMatch ? parseFloat(durationMatch[1]) : undefined;

    return {
      success: true,
      command: {
        droneId,
        command,
        coordinates,
        altitude,
        speed,
        duration
      }
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setIsProcessing(true);
    
    try {
      const parsed = parseNaturalLanguage(input);
      
      if (parsed.success && parsed.command) {
        setLastCommand(parsed.command);
        onCommand(parsed.command);
        setInput('');
      }
    } catch (error) {
      console.error('Error parsing command:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const exampleCommands = [
    'Guard the perimeter',
    'Patrol the area',
    'Celebration show',
    'Cinema shot at coordinates 10.5, 20.3, 100',
    'Drone 1 take off',
    'All drones land',
    'Move to coordinates 15.2, 30.1, 50'
  ];

  return (
    <div className="aero-card h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-aero-cyan-400">AI Mission Command</h2>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-xs text-slate-400">AI Ready</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
        <div className="flex-1 mb-4">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter natural language command..."
            className="aero-input w-full h-32 resize-none focus:ring-2 focus:ring-aero-cyan-500/50"
            disabled={isProcessing}
          />
        </div>

        <button
          type="submit"
          disabled={!input.trim() || isProcessing}
          className="aero-button w-full mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? 'Processing...' : 'Execute Command'}
        </button>

        {lastCommand && (
          <div className="mb-4 p-3 bg-aero-slate-700/50 rounded-lg border border-aero-cyan-500/20">
            <h3 className="text-sm font-semibold text-aero-cyan-400 mb-2">Last Command:</h3>
            <pre className="text-xs text-slate-300 overflow-x-auto">
              {JSON.stringify(lastCommand, null, 2)}
            </pre>
          </div>
        )}

        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-400">Example Commands:</h3>
          <div className="flex flex-wrap gap-2">
            {exampleCommands.map((cmd, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setInput(cmd)}
                className="text-xs bg-aero-slate-700/50 hover:bg-aero-slate-600/50 text-slate-300 px-2 py-1 rounded border border-aero-cyan-500/20 transition-colors"
              >
                {cmd}
              </button>
            ))}
          </div>
        </div>
      </form>
    </div>
  );
};
