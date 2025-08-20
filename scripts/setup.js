#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function setupEnvironment() {
  console.log('🚀 Seruvo Environment Setup\n');
  
  console.log('Please provide the following information:\n');
  
  const supabaseUrl = await question('Supabase Project URL: ');
  const supabaseAnonKey = await question('Supabase Anon Key: ');
  const supabaseServiceKey = await question('Supabase Service Role Key: ');
  const backendUrl = await question('Backend URL (your Render service URL): ');
  
  const envContent = `# Supabase Configuration (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=${supabaseUrl}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${supabaseAnonKey}
SUPABASE_SERVICE_ROLE_KEY=${supabaseServiceKey}

# Next.js Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_here

# App Configuration (OPTIONAL)
NEXT_PUBLIC_APP_NAME=Seruvo
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Backend API Configuration
NEXT_PUBLIC_API_URL=${backendUrl || 'https://your-backend-url.onrender.com'}
`;

  // Write to .env.local
  fs.writeFileSync('.env.local', envContent);
  
  // Write to server/.env
  const serverEnvContent = `NEXT_PUBLIC_SUPABASE_URL=${supabaseUrl}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${supabaseAnonKey}
SUPABASE_SERVICE_ROLE_KEY=${supabaseServiceKey}
PORT=3001
`;

  if (!fs.existsSync('server')) {
    fs.mkdirSync('server');
  }
  
  fs.writeFileSync('server/.env', serverEnvContent);
  
  console.log('\n✅ Environment files created successfully!');
  console.log('📁 Created: .env.local (for frontend)');
  console.log('📁 Created: server/.env (for backend)');
  console.log('\nNext steps:');
  console.log('1. Run "npm install" to install frontend dependencies');
  console.log('2. Deploy your backend to Render first');
  console.log('3. Update NEXT_PUBLIC_API_URL with your actual Render URL');
  console.log('4. Run "npm run dev" to start the frontend (uses Render backend)');
  
  rl.close();
}

setupEnvironment().catch(console.error);
