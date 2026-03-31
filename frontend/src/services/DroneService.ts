import type { DroneCommand, DroneTelemetry, DroneService as IDroneService } from '../types/drone';

// Type declarations for Web Bluetooth and Web Serial APIs
declare global {
  interface Navigator {
    bluetooth: {
      requestDevice(options: BluetoothRequestDeviceOptions): Promise<BluetoothDevice>;
    } | undefined;
    serial: {
      requestPort(): Promise<SerialPort>;
    } | undefined;
  }

  interface BluetoothDevice {
    name: string;
    id: string;
  }

  interface BluetoothRequestDeviceOptions {
    acceptAllDevices?: boolean;
    optionalServices?: string[];
  }

  interface SerialPort {
    open(options: SerialOptions): Promise<void>;
    close(): Promise<void>;
    readable: ReadableStream<Uint8Array> | null;
    writable: WritableStream<Uint8Array> | null;
  }

  interface SerialOptions {
    baudRate: number;
  }
}

export class DroneService implements IDroneService {
  private isConnected = false;
  private bluetoothDevice: BluetoothDevice | null = null;
  private serialPort: SerialPort | null = null;
  private telemetryInterval: number | null = null;

  async connect(): Promise<boolean> {
    try {
      console.log('Attempting to connect to drone controller...');
      
      // Try Web Bluetooth API first
      if (navigator.bluetooth) {
        const device = await navigator.bluetooth.requestDevice({
          acceptAllDevices: true,
          optionalServices: ['battery_service', 'device_information']
        });
        
        this.bluetoothDevice = device;
        console.log('Connected via Bluetooth:', device.name);
      }
      
      // Fallback to Web Serial API
      else if (navigator.serial) {
        const port = await navigator.serial.requestPort();
        await port.open({ baudRate: 115200 });
        this.serialPort = port;
        console.log('Connected via Serial Port');
      }
      
      // Mock connection for development
      else {
        console.log('Using mock connection for development');
        await this.mockConnect();
      }
      
      this.isConnected = true;
      this.startTelemetryUpdates();
      return true;
      
    } catch (error) {
      console.error('Connection failed:', error);
      return false;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.serialPort && this.serialPort.readable) {
        await this.serialPort.close();
        this.serialPort = null;
      }
      
      this.bluetoothDevice = null;
      this.isConnected = false;
      
      if (this.telemetryInterval) {
        clearInterval(this.telemetryInterval);
        this.telemetryInterval = null;
      }
      
      console.log('Disconnected from drone controller');
    } catch (error) {
      console.error('Disconnection error:', error);
    }
  }

  async sendCommand(command: DroneCommand): Promise<boolean> {
    if (!this.isConnected) {
      console.warn('Not connected to drone controller');
      return false;
    }

    try {
      const commandString = JSON.stringify(command);
      console.log('Sending command:', commandString);
      
      // Send via Bluetooth if available
      if (this.bluetoothDevice) {
        // Implementation would depend on specific drone protocol
        console.log('Command sent via Bluetooth');
      }
      
      // Send via Serial if available
      else if (this.serialPort && this.serialPort.writable) {
        const writer = this.serialPort.writable.getWriter();
        await writer.write(new TextEncoder().encode(commandString + '\n'));
        writer.releaseLock();
        console.log('Command sent via Serial');
      }
      
      // Mock command execution
      else {
        await this.mockSendCommand(command);
      }
      
      return true;
      
    } catch (error) {
      console.error('Command sending failed:', error);
      return false;
    }
  }

  async getTelemetry(): Promise<DroneTelemetry[]> {
    // Return mock telemetry data
    return [
      {
        id: 'drone-1',
        name: 'Alpha',
        battery: 85 + Math.random() * 10,
        gps: {
          lat: 37.7749 + (Math.random() - 0.5) * 0.001,
          lng: -122.4194 + (Math.random() - 0.5) * 0.001,
          alt: 100 + Math.random() * 50
        },
        signal: 85 + Math.random() * 10,
        status: 'patrolling',
        lastUpdate: new Date()
      },
      {
        id: 'drone-2',
        name: 'Bravo',
        battery: 70 + Math.random() * 10,
        gps: {
          lat: 37.7849 + (Math.random() - 0.5) * 0.001,
          lng: -122.4094 + (Math.random() - 0.5) * 0.001,
          alt: 80 + Math.random() * 40
        },
        signal: 80 + Math.random() * 15,
        status: 'idle',
        lastUpdate: new Date()
      },
      {
        id: 'drone-3',
        name: 'Charlie',
        battery: 90 + Math.random() * 8,
        gps: {
          lat: 37.7649 + (Math.random() - 0.5) * 0.001,
          lng: -122.4294 + (Math.random() - 0.5) * 0.001,
          alt: 120 + Math.random() * 60
        },
        signal: 90 + Math.random() * 8,
        status: 'guarding',
        lastUpdate: new Date()
      }
    ];
  }

  private async mockConnect(): Promise<void> {
    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  private async mockSendCommand(command: DroneCommand): Promise<void> {
    // Simulate command execution delay
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log('Mock command executed:', command);
  }

  private startTelemetryUpdates(): void {
    // Simulate real-time telemetry updates
    this.telemetryInterval = setInterval(() => {
      // This would typically update a telemetry store or emit events
    }, 1000);
  }

  // Utility methods for specific drone operations
  async calibrateDrone(droneId: string): Promise<boolean> {
    return this.sendCommand({
      droneId,
      command: 'HOVER',
      altitude: 10
    });
  }

  async emergencyLand(droneId: string): Promise<boolean> {
    return this.sendCommand({
      droneId,
      command: 'LAND'
    });
  }

  async returnToHome(droneId: string): Promise<boolean> {
    return this.sendCommand({
      droneId,
      command: 'MOVE',
      coordinates: [0, 0, 0] // Home coordinates
    });
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  getConnectionType(): 'bluetooth' | 'serial' | 'mock' {
    if (this.bluetoothDevice) return 'bluetooth';
    if (this.serialPort) return 'serial';
    return 'mock';
  }
}

// Singleton instance for app-wide use
export const droneService = new DroneService();
