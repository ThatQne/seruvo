import { execSync } from 'child_process';
import fs from 'fs';

console.log('🚀 Starting deployment process...');

try {
  // Check if we're in a git repository
  execSync('git status', { stdio: 'ignore' });

  // Check if we have a remote origin
  try {
    execSync('git remote get-url origin', { stdio: 'ignore' });
  } catch (remoteError) {
    console.log('⚠️  No git remote origin found.');
    console.log('📋 To set up deployment:');
    console.log('1. Create a repository on GitHub');
    console.log('2. Run: git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git');
    console.log('3. Run: git push -u origin main');
    console.log('4. Then run: npm run publish');
    process.exit(1);
  }

  // Check if there are any changes to commit
  try {
    execSync('git diff --quiet && git diff --cached --quiet', { stdio: 'ignore' });
    console.log('📝 No changes to commit...');
  } catch (changesError) {
    // There are changes, let's commit them
    console.log('📝 Committing changes...');
    execSync('git add .', { stdio: 'inherit' });
    // Get current timestamp for commit message
    const timestamp = new Date().toLocaleString();
    execSync(`git commit -m "Update seruvo - ${timestamp}"`, { stdio: 'inherit' });
  }

  console.log('⬆️  Pushing to main branch...');
  execSync('git push origin main', { stdio: 'inherit' });

  console.log('✅ Changes pushed successfully!');
  console.log('🚀 Deployment Strategy:');
  console.log('');
  console.log('📦 BACKEND (Render):');
  console.log('   1. Connect your GitHub repo to Render');
  console.log('   2. Create a Web Service pointing to /server directory');
  console.log('   3. Set build command: npm install && npm run build');
  console.log('   4. Set start command: npm start');
  console.log('');
  console.log('🌐 FRONTEND (GitHub Pages):');
  console.log('   1. ✅ GitHub Actions will build and deploy automatically');
  console.log('   2. ✅ Add NEXT_PUBLIC_API_URL secret in repo settings');
  console.log('   3. ✅ Site will be available at: https://ThatQne.github.io/seruvo');
  console.log('');
  console.log('🔗 Setup Guide: https://github.com/ThatQne/seruvo/blob/main/DEPLOYMENT.md');
  console.log('📊 Check deployment status: https://github.com/ThatQne/seruvo/actions');

} catch (error) {
  console.error('❌ Deployment failed:', error.message);
  process.exit(1);
}
