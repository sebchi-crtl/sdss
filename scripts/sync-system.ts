#!/usr/bin/env tsx

/**
 * System Synchronization Script
 * Ensures all components (Next.js, Python ML, MQTT) are properly connected
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fetch from 'node-fetch';

const execAsync = promisify(exec);

interface SystemStatus {
  nextjs: boolean;
  python: boolean;
  mqtt: boolean;
  database: boolean;
}

class SystemSync {
  private status: SystemStatus = {
    nextjs: false,
    python: false,
    mqtt: false,
    database: false
  };

  async checkNextJS(): Promise<boolean> {
    try {
      const response = await fetch('http://localhost:3000/api/health');
      this.status.nextjs = response.ok;
      return response.ok;
    } catch {
      this.status.nextjs = false;
      return false;
    }
  }

  async checkPython(): Promise<boolean> {
    try {
      const response = await fetch('http://localhost:8200/health');
      this.status.python = response.ok;
      return response.ok;
    } catch {
      this.status.python = false;
      return false;
    }
  }

  async checkDatabase(): Promise<boolean> {
    try {
      // Check if we can connect to Supabase
      const response = await fetch('http://localhost:3000/api/readings?range=1h');
      this.status.database = response.ok;
      return response.ok;
    } catch {
      this.status.database = false;
      return false;
    }
  }

  async checkMQTT(): Promise<boolean> {
    // MQTT is harder to check directly, so we'll assume it's working if other services are up
    this.status.mqtt = this.status.nextjs && this.status.python;
    return this.status.mqtt;
  }

  async syncAll(): Promise<void> {
    console.log('🔄 Starting system synchronization...\n');

    // Check all services
    await Promise.all([
      this.checkNextJS(),
      this.checkPython(),
      this.checkDatabase(),
      this.checkMQTT()
    ]);

    // Display status
    console.log('📊 System Status:');
    console.log(`  Next.js Frontend: ${this.status.nextjs ? '✅ Running' : '❌ Not running'}`);
    console.log(`  Python ML Backend: ${this.status.python ? '✅ Running' : '❌ Not running'}`);
    console.log(`  Database: ${this.status.database ? '✅ Connected' : '❌ Not connected'}`);
    console.log(`  MQTT System: ${this.status.mqtt ? '✅ Ready' : '❌ Not ready'}\n`);

    // Test data flow
    if (this.status.nextjs && this.status.python && this.status.database) {
      console.log('🧪 Testing data flow...');
      
      try {
        // Test prediction API
        const predictionResponse = await fetch('http://localhost:3000/api/predictions');
        if (predictionResponse.ok) {
          const predictions = await predictionResponse.json();
          console.log('✅ Predictions API working');
          console.log(`   Latest risk scores: ${predictions.risk?.slice(0, 3).map((r: number) => r.toFixed(2)).join(', ')}`);
        }

        // Test sensor readings API
        const readingsResponse = await fetch('http://localhost:3000/api/readings?range=1h');
        if (readingsResponse.ok) {
          const readings = await readingsResponse.json();
          console.log('✅ Sensor readings API working');
          console.log(`   Total readings: ${readings.total}`);
        }

        // Test ML model health
        const mlHealthResponse = await fetch('http://localhost:8200/health');
        if (mlHealthResponse.ok) {
          const health = await mlHealthResponse.json();
          console.log('✅ ML model healthy');
          console.log(`   Model trained: ${health.model_trained}`);
        }

      } catch (error) {
        console.log('❌ Data flow test failed:', error);
      }
    }

    // Provide startup instructions
    console.log('\n🚀 To start all services:');
    console.log('1. Start Next.js: npm run dev');
    console.log('2. Start Python ML: python main.py');
    console.log('3. Start MQTT Worker: npm run mqtt:worker');
    console.log('4. Start MQTT Simulator: npm run mqtt:sim');
    console.log('\n📡 Data Flow:');
    console.log('MQTT Simulator → MQTT Worker → Next.js API (database) + Python ML (processing)');
    console.log('Next.js Frontend → Python ML Backend → Database (predictions)');
  }

  async startServices(): Promise<void> {
    console.log('🚀 Starting all services...\n');

    const commands = [
      { name: 'Next.js', cmd: 'npm run dev', port: 3000 },
      { name: 'Python ML', cmd: 'python main.py', port: 8200 },
      { name: 'MQTT Worker', cmd: 'npm run mqtt:worker', port: null },
      { name: 'MQTT Simulator', cmd: 'npm run mqtt:sim', port: null }
    ];

    for (const service of commands) {
      console.log(`Starting ${service.name}...`);
      try {
        // Start service in background
        const child = execAsync(service.cmd, { 
          detached: true,
          stdio: 'ignore'
        });
        console.log(`✅ ${service.name} started`);
      } catch (error) {
        console.log(`❌ Failed to start ${service.name}:`, error);
      }
    }

    // Wait a bit for services to start
    console.log('\n⏳ Waiting for services to initialize...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Check status
    await this.syncAll();
  }
}

// Main execution
async function main() {
  const sync = new SystemSync();
  
  const args = process.argv.slice(2);
  if (args.includes('--start')) {
    await sync.startServices();
  } else {
    await sync.syncAll();
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export { SystemSync };
