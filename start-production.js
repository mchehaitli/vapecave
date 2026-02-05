#!/usr/bin/env node

// Simple production startup script
import { spawn } from 'child_process';
import { existsSync } from 'fs';

const startProduction = () => {
  console.log('🚀 Starting Vape Cave in production mode...');
  
  // Check if build exists
  if (!existsSync('./dist/index.js')) {
    console.log('📦 Building application...');
    
    const buildProcess = spawn('npm', ['run', 'build'], { 
      stdio: 'inherit',
      shell: true 
    });
    
    buildProcess.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Build completed successfully');
        startServer();
      } else {
        console.error('❌ Build failed with code:', code);
        process.exit(1);
      }
    });
  } else {
    console.log('✅ Build files found, starting server...');
    startServer();
  }
};

const startServer = () => {
  console.log('🌐 Starting production server on port 5000...');
  
  const serverProcess = spawn('node', ['dist/index.js'], {
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      NODE_ENV: 'production',
      PORT: '5000'
    }
  });
  
  serverProcess.on('close', (code) => {
    console.log(`Server process exited with code: ${code}`);
  });
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Gracefully shutting down...');
    serverProcess.kill('SIGINT');
    process.exit(0);
  });
};

startProduction();