#!/usr/bin/env node

/**
 * Production deployment script for Vape Cave
 * This script builds and starts the application in production mode
 * Avoids the 'dev' command security restriction in Replit deployments
 */

import { spawn } from 'child_process';
import { existsSync } from 'fs';

console.log('🚀 Deploying Vape Cave in production mode...');

// Set production environment
process.env.NODE_ENV = 'production';

const deploy = async () => {
  try {
    // Step 1: Build the application
    console.log('📦 Building application for production...');
    
    const buildProcess = spawn('npm', ['run', 'build'], {
      stdio: 'inherit',
      shell: true,
      env: { ...process.env, NODE_ENV: 'production' }
    });

    await new Promise((resolve, reject) => {
      buildProcess.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Build completed successfully');
          resolve();
        } else {
          console.error('❌ Build failed with code:', code);
          reject(new Error(`Build failed with code ${code}`));
        }
      });
    });

    // Step 2: Verify build output
    if (!existsSync('./dist/index.js')) {
      throw new Error('Build output not found at ./dist/index.js');
    }
    
    if (!existsSync('./dist/public')) {
      throw new Error('Frontend build output not found at ./dist/public');
    }

    console.log('✅ Build artifacts verified');

    // Step 3: Start production server
    console.log('🌐 Starting production server...');
    
    const serverProcess = spawn('node', ['dist/index.js'], {
      stdio: 'inherit',
      shell: true,
      env: {
        ...process.env,
        NODE_ENV: 'production',
        PORT: process.env.PORT || '5000'
      }
    });

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n🛑 Gracefully shutting down deployment...');
      serverProcess.kill('SIGINT');
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      console.log('\n🛑 Received SIGTERM, shutting down...');
      serverProcess.kill('SIGTERM');
      process.exit(0);
    });

    serverProcess.on('close', (code) => {
      console.log(`Server process exited with code: ${code}`);
      process.exit(code);
    });

  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    process.exit(1);
  }
};

deploy();