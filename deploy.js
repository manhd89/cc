const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

console.log('🚀 Starting deployment process...')

// Check if .env exists
if (!fs.existsSync('.env')) {
  console.log('⚠️  .env file not found. Creating from .env.example...')
  if (fs.existsSync('.env.example')) {
    fs.copyFileSync('.env.example', '.env')
    console.log('✅ Created .env file from .env.example')
  } else {
    console.error('❌ .env.example not found!')
    process.exit(1)
  }
}

// Install dependencies
console.log('📦 Installing dependencies...')
try {
  execSync('npm install', { stdio: 'inherit' })
} catch (error) {
  console.error('❌ Failed to install dependencies:', error.message)
  process.exit(1)
}

// Build project
console.log('🔨 Building project...')
try {
  execSync('npm run build', { stdio: 'inherit' })
} catch (error) {
  console.error('❌ Build failed:', error.message)
  process.exit(1)
}

// Check if dist folder exists
if (!fs.existsSync('dist')) {
  console.error('❌ dist folder not found after build!')
  process.exit(1)
}

console.log('✅ Build completed successfully!')

// Check for Vercel CLI
console.log('🔍 Checking for Vercel CLI...')
try {
  execSync('vercel --version', { stdio: 'pipe' })
  console.log('✅ Vercel CLI found')
  
  // Deploy to Vercel
  console.log('🚀 Deploying to Vercel...')
  execSync('vercel --prod', { stdio: 'inherit' })
  
} catch (error) {
  console.log('⚠️  Vercel CLI not found or deployment failed')
  console.log('📋 Manual deployment instructions:')
  console.log('1. Install Vercel CLI: npm i -g vercel')
  console.log('2. Run: vercel login')
  console.log('3. Run: vercel --prod')
  console.log('')
  console.log('📁 Or upload the "dist" folder to Vercel Dashboard')
}

console.log('✨ Deployment process completed!')
