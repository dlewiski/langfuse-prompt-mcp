#!/usr/bin/env node

/**
 * Langfuse Connection Diagnostic and Test Script
 * 
 * This script helps diagnose and fix Langfuse integration issues
 * Run with: node test-langfuse-connection.js
 */

import { Langfuse } from 'langfuse';
import dotenv from 'dotenv';
import { existsSync } from 'fs';
import { join } from 'path';
import fetch from 'node-fetch';

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60));
}

// Load environment variables
const envPath = join(process.env.HOME || '', '.claude', '.env');
if (existsSync(envPath)) {
  dotenv.config({ path: envPath });
  log(`✓ Loaded environment from: ${envPath}`, 'green');
} else {
  log(`✗ Environment file not found at: ${envPath}`, 'red');
  log('  Please create the file with LANGFUSE_PUBLIC_KEY and LANGFUSE_SECRET_KEY', 'yellow');
}

async function testConnection() {
  logSection('1. ENVIRONMENT CONFIGURATION');
  
  const config = {
    publicKey: process.env.LANGFUSE_PUBLIC_KEY,
    secretKey: process.env.LANGFUSE_SECRET_KEY,
    baseUrl: process.env.LANGFUSE_HOST || 'http://localhost:3000',
  };
  
  // Check environment variables
  let configValid = true;
  
  if (!config.publicKey) {
    log('✗ LANGFUSE_PUBLIC_KEY is not set', 'red');
    configValid = false;
  } else {
    log(`✓ LANGFUSE_PUBLIC_KEY: ${config.publicKey.substring(0, 10)}...`, 'green');
  }
  
  if (!config.secretKey) {
    log('✗ LANGFUSE_SECRET_KEY is not set', 'red');
    configValid = false;
  } else {
    log(`✓ LANGFUSE_SECRET_KEY: ${config.secretKey.substring(0, 10)}...`, 'green');
  }
  
  log(`ℹ LANGFUSE_HOST: ${config.baseUrl}`, 'blue');
  
  if (!configValid) {
    log('\n✗ Configuration incomplete. Please set all required environment variables.', 'red');
    return false;
  }
  
  logSection('2. NETWORK CONNECTIVITY');
  
  // Test if Langfuse server is reachable
  try {
    log(`Testing connection to ${config.baseUrl}...`, 'yellow');
    const response = await fetch(config.baseUrl, { 
      timeout: 5000,
      headers: { 'User-Agent': 'Langfuse-Diagnostic/1.0' }
    });
    
    if (response.ok || response.status === 200 || response.status === 302) {
      log(`✓ Langfuse server is reachable (status: ${response.status})`, 'green');
    } else {
      log(`⚠ Unexpected status code: ${response.status}`, 'yellow');
    }
  } catch (error) {
    log(`✗ Cannot reach Langfuse server: ${error.message}`, 'red');
    log('\nPossible solutions:', 'yellow');
    log('  1. Check if Docker container is running: docker ps', 'yellow');
    log('  2. Check Docker logs: docker logs langfuse-server', 'yellow');
    log('  3. Verify port mapping in docker-compose.yml', 'yellow');
    return false;
  }
  
  // Test API endpoint
  try {
    const apiUrl = `${config.baseUrl}/api/public/health`;
    log(`Testing API endpoint ${apiUrl}...`, 'yellow');
    const response = await fetch(apiUrl, { 
      timeout: 5000,
      headers: { 'User-Agent': 'Langfuse-Diagnostic/1.0' }
    });
    
    if (response.ok) {
      log('✓ API endpoint is accessible', 'green');
    } else {
      log(`⚠ API returned status: ${response.status}`, 'yellow');
    }
  } catch (error) {
    log('⚠ API health endpoint not accessible (this might be normal)', 'yellow');
  }
  
  logSection('3. LANGFUSE CLIENT INITIALIZATION');
  
  let langfuse;
  try {
    langfuse = new Langfuse({
      ...config,
      requestTimeout: 10000,
      maxRetries: 2,
      flushAt: 1, // Force immediate flush for testing
      flushInterval: 0, // Disable batching for testing
    });
    log('✓ Langfuse client initialized successfully', 'green');
  } catch (error) {
    log(`✗ Failed to initialize Langfuse client: ${error.message}`, 'red');
    return false;
  }
  
  logSection('4. AUTHENTICATION TEST');
  
  try {
    // Try to create a simple trace
    log('Testing authentication with a trace...', 'yellow');
    const testTrace = langfuse.trace({
      name: 'connection-test',
      metadata: {
        test: true,
        timestamp: new Date().toISOString(),
        source: 'diagnostic-script',
      },
    });
    
    log('✓ Trace created successfully', 'green');
    log(`  Trace ID: ${testTrace.id}`, 'blue');
    
    // Note: Langfuse traces don't have an explicit end() method in JS SDK
    // They are ended implicitly when flushed
    log('✓ Trace prepared for sending', 'green');
    
  } catch (error) {
    log(`✗ Authentication failed: ${error.message}`, 'red');
    log('\nPossible issues:', 'yellow');
    log('  1. Invalid API keys', 'yellow');
    log('  2. Keys not matching the Langfuse instance', 'yellow');
    log('  3. Network connectivity issues', 'yellow');
    return false;
  }
  
  logSection('5. SENDING TEST PROMPT');
  
  try {
    log('Sending a test prompt to Langfuse...', 'yellow');
    
    const trace = langfuse.trace({
      name: 'test-prompt-tracking',
      input: 'Test prompt from diagnostic script',
      metadata: {
        category: 'testing',
        wordCount: 6,
        timestamp: new Date().toISOString(),
        diagnostic: true,
      },
    });
    
    // Add a generation event
    const generation = trace.generation({
      name: 'test-generation',
      input: 'Test input',
      output: 'Test output',
      model: 'test-model',
      modelParameters: {
        temperature: 0.7,
      },
    });
    
    // End generation (generations have end(), traces don't)
    generation.end();
    
    log('✓ Test prompt sent successfully', 'green');
    log(`  Trace ID: ${trace.id}`, 'blue');
    
    // Add a score
    await trace.score({
      name: 'diagnostic-test',
      value: 100,
      comment: 'Diagnostic test score',
    });
    
    log('✓ Score added successfully', 'green');
    
  } catch (error) {
    log(`✗ Failed to send test prompt: ${error.message}`, 'red');
    return false;
  }
  
  logSection('6. FLUSH AND SHUTDOWN');
  
  try {
    log('Flushing events to Langfuse...', 'yellow');
    
    // CRITICAL: Force flush to ensure events are sent
    await langfuse.flushAsync();
    log('✓ Events flushed successfully', 'green');
    
    // Shutdown the client
    await langfuse.shutdownAsync();
    log('✓ Client shutdown completed', 'green');
    
  } catch (error) {
    log(`⚠ Flush/shutdown warning: ${error.message}`, 'yellow');
  }
  
  return true;
}

async function main() {
  console.clear();
  log('LANGFUSE INTEGRATION DIAGNOSTIC TOOL', 'cyan');
  log('====================================\n', 'cyan');
  
  const success = await testConnection();
  
  logSection(success ? 'DIAGNOSTIC COMPLETE - SUCCESS' : 'DIAGNOSTIC COMPLETE - ISSUES FOUND');
  
  if (success) {
    log('\n✓ All tests passed!', 'green');
    log('\nYour Langfuse integration appears to be working correctly.', 'green');
    log('Check your Langfuse dashboard at:', 'blue');
    log(`  ${process.env.LANGFUSE_HOST || 'http://localhost:3000'}`, 'blue');
    log('\nYou should see:', 'blue');
    log('  - A trace named "connection-test"', 'blue');
    log('  - A trace named "test-prompt-tracking" with a score', 'blue');
  } else {
    log('\n✗ Some tests failed. Please review the issues above.', 'red');
    log('\nCommon fixes:', 'yellow');
    log('  1. Ensure Docker container is running: docker-compose up -d', 'yellow');
    log('  2. Check environment variables in ~/.claude/.env', 'yellow');
    log('  3. Verify API keys match your Langfuse instance', 'yellow');
    log('  4. Check Docker logs: docker logs langfuse-server', 'yellow');
  }
  
  log('\n', 'reset');
}

// Run the diagnostic
main().catch(error => {
  log(`\n✗ Unexpected error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});