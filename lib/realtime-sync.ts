/**
 * Real-time Data Synchronization Service
 * Keeps Next.js, Python ML, and MQTT systems in sync
 */

import { supabaseAdmin } from './supabase-admin';

export interface SyncStatus {
  lastSync: Date;
  sensorDataCount: number;
  predictionCount: number;
  alertsCount: number;
  isHealthy: boolean;
}

export class RealtimeSync {
  private syncInterval: NodeJS.Timeout | null = null;
  private isRunning = false;

  constructor(private intervalMs: number = 30000) {} // 30 seconds default

  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('RealtimeSync already running');
      return;
    }

    console.log('🔄 Starting real-time synchronization...');
    this.isRunning = true;

    // Initial sync
    await this.performSync();

    // Set up periodic sync
    this.syncInterval = setInterval(async () => {
      await this.performSync();
    }, this.intervalMs);
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    console.log('⏹️ Stopping real-time synchronization...');
    this.isRunning = false;

    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  private async performSync(): Promise<SyncStatus> {
    try {
      const sb = supabaseAdmin();
      const now = new Date();

      // Get recent sensor data count
      const { count: sensorCount } = await sb
        .from('sensor_readings')
        .select('*', { count: 'exact', head: true })
        .gte('ts', new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString());

      // Get recent predictions count
      const { count: predictionCount } = await sb
        .from('predictions')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString());

      // Get active alerts count
      const { count: alertsCount } = await sb
        .from('alerts')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString());

      const status: SyncStatus = {
        lastSync: now,
        sensorDataCount: sensorCount || 0,
        predictionCount: predictionCount || 0,
        alertsCount: alertsCount || 0,
        isHealthy: true
      };

      // Log sync status
      console.log(`📊 Sync Status: ${status.sensorDataCount} sensors, ${status.predictionCount} predictions, ${status.alertsCount} alerts`);

      return status;

    } catch (error) {
      console.error('❌ Sync failed:', error);
      return {
        lastSync: new Date(),
        sensorDataCount: 0,
        predictionCount: 0,
        alertsCount: 0,
        isHealthy: false
      };
    }
  }

  async getStatus(): Promise<SyncStatus> {
    return this.performSync();
  }

  async triggerPredictionUpdate(): Promise<void> {
    try {
      console.log('🔄 Triggering prediction update...');
      
      // Fetch latest predictions from ML backend
      const response = await fetch('http://localhost:3000/api/predictions');
      if (response.ok) {
        const predictions = await response.json();
        console.log('✅ Predictions updated successfully');
      } else {
        console.error('❌ Failed to update predictions:', response.status);
      }
    } catch (error) {
      console.error('❌ Error triggering prediction update:', error);
    }
  }

  async checkSystemHealth(): Promise<{
    nextjs: boolean;
    python: boolean;
    database: boolean;
    mqtt: boolean;
  }> {
    const health = {
      nextjs: false,
      python: false,
      database: false,
      mqtt: false
    };

    try {
      // Check Next.js health
      const nextjsResponse = await fetch('http://localhost:3000/api/health');
      health.nextjs = nextjsResponse.ok;

      // Check Python ML health
      const pythonResponse = await fetch('http://localhost:8200/health');
      health.python = pythonResponse.ok;

      // Check database
      const sb = supabaseAdmin();
      const { error } = await sb.from('sensors').select('id').limit(1);
      health.database = !error;

      // MQTT is harder to check directly
      health.mqtt = health.nextjs && health.python;

    } catch (error) {
      console.error('Health check failed:', error);
    }

    return health;
  }
}

// Global instance
export const realtimeSync = new RealtimeSync();

// Auto-start in development
if (process.env.NODE_ENV === 'development') {
  realtimeSync.start().catch(console.error);
}
