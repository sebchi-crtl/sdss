#!/usr/bin/env tsx

/**
 * Integration Test Script
 * Tests the complete data flow between all components
 */

import fetch from 'node-fetch';

interface TestResult {
  name: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  message: string;
  duration: number;
}

class IntegrationTester {
  private results: TestResult[] = [];

  async runTest(name: string, testFn: () => Promise<boolean>, message: string): Promise<void> {
    const start = Date.now();
    try {
      const passed = await testFn();
      const duration = Date.now() - start;
      
      this.results.push({
        name,
        status: passed ? 'PASS' : 'FAIL',
        message: passed ? message : `Failed: ${message}`,
        duration
      });
      
      console.log(`${passed ? '✅' : '❌'} ${name}: ${passed ? 'PASS' : 'FAIL'} (${duration}ms)`);
    } catch (error) {
      const duration = Date.now() - start;
      this.results.push({
        name,
        status: 'FAIL',
        message: `Error: ${error}`,
        duration
      });
      console.log(`❌ ${name}: FAIL (${duration}ms) - ${error}`);
    }
  }

  async testNextJSHealth(): Promise<boolean> {
    const response = await fetch('http://localhost:3000/api/health');
    return response.ok;
  }

  async testPythonHealth(): Promise<boolean> {
    const response = await fetch('http://localhost:8200/health');
    return response.ok;
  }

  async testDatabaseConnection(): Promise<boolean> {
    const response = await fetch('http://localhost:3000/api/readings?range=1h');
    return response.ok;
  }

  async testPredictionsAPI(): Promise<boolean> {
    const response = await fetch('http://localhost:3000/api/predictions');
    if (!response.ok) return false;
    
    const data = await response.json();
    return data.risk && Array.isArray(data.risk) && data.risk.length > 0;
  }

  async testMLModelInfo(): Promise<boolean> {
    const response = await fetch('http://localhost:8200/model/info');
    if (!response.ok) return false;
    
    const data = await response.json();
    return data.is_trained !== undefined;
  }

  async testSensorDataIngest(): Promise<boolean> {
    const testData = {
      sensor_id: 'test-sensor-001',
      ts: new Date().toISOString(),
      value: 25.5,
      lat: 9.0,
      lon: 7.3,
      status: 'OK',
      raw: { test: true }
    };

    const response = await fetch('http://localhost:3000/api/ingest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });

    return response.ok;
  }

  async testMLDataProcessing(): Promise<boolean> {
    const testData = {
      sensor_id: 'test-sensor-002',
      ts: new Date().toISOString(),
      value: 15.2,
      type: 'RAIN',
      lat: 9.0,
      lon: 7.3
    };

    const response = await fetch('http://localhost:8200/process-sensor-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });

    return response.ok;
  }

  async runAllTests(): Promise<void> {
    console.log('🧪 Running Integration Tests...\n');

    // Health checks
    await this.runTest(
      'Next.js Health Check',
      () => this.testNextJSHealth(),
      'Next.js frontend is running and healthy'
    );

    await this.runTest(
      'Python ML Health Check',
      () => this.testPythonHealth(),
      'Python ML backend is running and healthy'
    );

    await this.runTest(
      'Database Connection',
      () => this.testDatabaseConnection(),
      'Database connection is working'
    );

    // API functionality tests
    await this.runTest(
      'Predictions API',
      () => this.testPredictionsAPI(),
      'Predictions API returns valid flood risk data'
    );

    await this.runTest(
      'ML Model Info',
      () => this.testMLModelInfo(),
      'ML model information is accessible'
    );

    // Data flow tests
    await this.runTest(
      'Sensor Data Ingest',
      () => this.testSensorDataIngest(),
      'Sensor data can be ingested into database'
    );

    await this.runTest(
      'ML Data Processing',
      () => this.testMLDataProcessing(),
      'ML backend can process sensor data'
    );

    // Summary
    this.printSummary();
  }

  private printSummary(): void {
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const total = this.results.length;
    const totalTime = this.results.reduce((sum, r) => sum + r.duration, 0);

    console.log('\n📊 Test Summary:');
    console.log(`  Total Tests: ${total}`);
    console.log(`  Passed: ${passed}`);
    console.log(`  Failed: ${failed}`);
    console.log(`  Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
    console.log(`  Total Time: ${totalTime}ms`);

    if (failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.results
        .filter(r => r.status === 'FAIL')
        .forEach(r => console.log(`  - ${r.name}: ${r.message}`));
    }

    if (passed === total) {
      console.log('\n🎉 All tests passed! System is fully synchronized.');
    } else {
      console.log('\n⚠️ Some tests failed. Check the services and try again.');
    }
  }
}

// Main execution
async function main() {
  const tester = new IntegrationTester();
  await tester.runAllTests();
}

if (require.main === module) {
  main().catch(console.error);
}

export { IntegrationTester };
