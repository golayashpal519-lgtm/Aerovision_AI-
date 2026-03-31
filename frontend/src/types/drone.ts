export interface DroneCommand {
  droneId: string | 'all';
  command: 'PATROL' | 'GUARD' | 'CELEBRATION' | 'CINEMA' | 'TAKEOFF' | 'LAND' | 'HOVER' | 'MOVE';
  coordinates?: [number, number, number];
  altitude?: number;
  speed?: number;
  duration?: number;
}

export interface DroneTelemetry {
  id: string;
  name: string;
  battery: number;
  gps: {
    lat: number;
    lng: number;
    alt: number;
  };
  signal: number;
  status: 'idle' | 'flying' | 'patrolling' | 'guarding' | 'celebrating' | 'filming';
  lastUpdate: Date;
}

export interface ParsedCommand {
  success: boolean;
  command?: DroneCommand;
  error?: string;
}

export interface DroneService {
  connect(): Promise<boolean>;
  disconnect(): Promise<void>;
  sendCommand(command: DroneCommand): Promise<boolean>;
  getTelemetry(): Promise<DroneTelemetry[]>;
}
