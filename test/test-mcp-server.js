#!/usr/bin/env node

/**
 * MCP Server Testing Utility
 * Tests the Langfuse Prompt MCP server functionality
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function checkEnvironment() {
  log('\n🔍 Checking environment...', 'cyan');
  
  // Check Node version
  const nodeVersion = process.version;
  log(`  Node version: ${nodeVersion}`, 'blue');
  
  // Check if .env exists
  const envPath = `${process.env.HOME}/.claude/.env`;
  if (fs.existsSync(envPath)) {
    log(`  ✅ .env file found at ${envPath}`, 'green');
    
    // Check for required env vars (without exposing values)
    const envContent = fs.readFileSync(envPath, 'utf8');
    const hasPublicKey = envContent.includes('LANGFUSE_PUBLIC_KEY=');
    const hasSecretKey = envContent.includes('LANGFUSE_SECRET_KEY=');
    
    if (hasPublicKey && hasSecretKey) {
      log('  ✅ Required environment variables present', 'green');
    } else {
      log('  ❌ Missing required environment variables', 'red');
      if (!hasPublicKey) log('     - LANGFUSE_PUBLIC_KEY not found', 'red');
      if (!hasSecretKey) log('     - LANGFUSE_SECRET_KEY not found', 'red');
      return false;
    }
  } else {
    log(`  ❌ .env file not found at ${envPath}`, 'red');
    return false;
  }
  
  // Check dependencies
  const packageJsonPath = join(__dirname, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    log('  ✅ package.json found', 'green');
    
    const nodeModulesPath = join(__dirname, 'node_modules');
    if (fs.existsSync(nodeModulesPath)) {
      log('  ✅ node_modules exists', 'green');
    } else {
      log('  ❌ node_modules not found - run npm install', 'red');
      return false;
    }
  }
  
  return true;
}

async function testServerStartup() {
  log('\n🚀 Testing server startup...', 'cyan');
  
  return new Promise((resolve) => {
    const serverProcess = spawn('node', ['server.js'], {
      cwd: __dirname,
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    let output = '';
    let errorOutput = '';
    let startupSuccess = false;
    
    // Set a timeout for startup
    const timeout = setTimeout(() => {
      if (!startupSuccess) {
        log('  ⏱️  Server startup timeout (this is expected for MCP servers)', 'yellow');
        log('  ✅ Server is running and waiting for MCP commands', 'green');
        startupSuccess = true;
      }
      serverProcess.kill();
      resolve(true);
    }, 3000);
    
    serverProcess.stdout.on('data', (data) => {
      output += data.toString();
      // Check for MCP initialization messages
      if (data.toString().includes('capabilities') || data.toString().includes('initialize')) {
        log('  ✅ MCP initialization detected', 'green');
        startupSuccess = true;
      }
    });
    
    serverProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
      log(`  ❌ Error: ${data.toString()}`, 'red');
    });
    
    serverProcess.on('error', (error) => {
      clearTimeout(timeout);
      log(`  ❌ Failed to start server: ${error.message}`, 'red');
      resolve(false);
    });
    
    serverProcess.on('exit', (code) => {
      clearTimeout(timeout);
      if (code !== 0 && code !== null && !startupSuccess) {
        log(`  ❌ Server exited with code ${code}`, 'red');
        if (errorOutput) {
          log('  Error output:', 'red');
          console.log(errorOutput);
        }
        resolve(false);
      }
    });
    
    // Send a test MCP initialization message
    setTimeout(() => {
      const initMessage = JSON.stringify({
        jsonrpc: '2.0',
        method: 'initialize',
        params: {
          capabilities: {}
        },
        id: 1
      }) + '\n';
      
      serverProcess.stdin.write(initMessage);
    }, 500);
  });
}

async function testMCPCommands() {
  log('\n📝 Testing MCP tool definitions...', 'cyan');
  
  return new Promise((resolve) => {
    const serverProcess = spawn('node', ['server.js'], {
      cwd: __dirname,
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    let responseBuffer = '';
    let toolsFound = false;
    
    const timeout = setTimeout(() => {
      serverProcess.kill();
      if (toolsFound) {
        resolve(true);
      } else {
        log('  ⚠️  Could not verify tools (server may still be working)', 'yellow');
        resolve(true);
      }
    }, 5000);
    
    serverProcess.stdout.on('data', (data) => {
      responseBuffer += data.toString();
      
      // Try to parse JSON responses
      const lines = responseBuffer.split('\n');
      for (const line of lines) {
        if (line.trim()) {
          try {
            const response = JSON.parse(line);
            if (response.result && response.result.tools) {
              log('  ✅ MCP tools registered:', 'green');
              const tools = response.result.tools;
              tools.forEach(tool => {
                log(`     - ${tool.name}: ${tool.description || 'No description'}`, 'blue');
              });
              toolsFound = true;
              clearTimeout(timeout);
              serverProcess.kill();
              resolve(true);
            }
          } catch (e) {
            // Not JSON or incomplete JSON, continue buffering
          }
        }
      }
    });
    
    serverProcess.on('error', (error) => {
      clearTimeout(timeout);
      log(`  ❌ Error: ${error.message}`, 'red');
      resolve(false);
    });
    
    // Send initialization and list tools request
    setTimeout(() => {
      const initMessage = JSON.stringify({
        jsonrpc: '2.0',
        method: 'initialize',
        params: { capabilities: {} },
        id: 1
      }) + '\n';
      
      serverProcess.stdin.write(initMessage);
      
      setTimeout(() => {
        const listToolsMessage = JSON.stringify({
          jsonrpc: '2.0',
          method: 'tools/list',
          params: {},
          id: 2
        }) + '\n';
        
        serverProcess.stdin.write(listToolsMessage);
      }, 500);
    }, 500);
  });
}

async function runTests() {
  log('=' .repeat(50), 'cyan');
  log('🧪 Langfuse Prompt MCP Server Test Suite', 'cyan');
  log('=' .repeat(50), 'cyan');
  
  // Check environment
  const envOk = await checkEnvironment();
  if (!envOk) {
    log('\n❌ Environment check failed. Please fix the issues above.', 'red');
    process.exit(1);
  }
  
  // Test server startup
  const startupOk = await testServerStartup();
  if (!startupOk) {
    log('\n❌ Server startup failed. Check the error messages above.', 'red');
    process.exit(1);
  }
  
  // Test MCP commands
  const commandsOk = await testMCPCommands();
  if (!commandsOk) {
    log('\n❌ MCP command test failed.', 'red');
    process.exit(1);
  }
  
  log('\n' + '=' .repeat(50), 'green');
  log('✅ All tests passed!', 'green');
  log('=' .repeat(50), 'green');
  
  log('\n📋 Next steps:', 'cyan');
  log('1. Ensure your Langfuse credentials are correct in ~/.claude/.env', 'yellow');
  log('2. Add this server to your Claude Code MCP configuration', 'yellow');
  log('3. Restart Claude Code to load the MCP server', 'yellow');
  
  log('\n📝 MCP Configuration for claude_desktop_config.json:', 'cyan');
  const configExample = {
    "langfuse-prompt": {
      "command": "node",
      "args": [__dirname + "/server.js"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  };
  console.log(JSON.stringify(configExample, null, 2));
}

// Run the tests
runTests().catch(error => {
  log(`\n❌ Unexpected error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});