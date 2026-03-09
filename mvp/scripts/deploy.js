import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

const REPO_URL = 'https://github.com/shmuelpol/ammunition-report.git';
const BRANCH = 'gh-pages';
const BUILD_DIR = 'dist';

async function deploy() {
  try {
    console.log('📦 Building application...');
    await execAsync('npm run build');

    if (!fs.existsSync(BUILD_DIR)) {
      console.error('❌ Build directory not found!');
      process.exit(1);
    }

    // Check if .nojekyll exists for GitHub Pages
    const noJekyllPath = path.join(BUILD_DIR, '.nojekyll');
    if (!fs.existsSync(noJekyllPath)) {
      fs.writeFileSync(noJekyllPath, '');
      console.log('✓ Created .nojekyll for GitHub Pages');
    }

    console.log('✓ Build complete');
    console.log('');
    console.log('📝 Next steps:');
    console.log('1. Commit changes to main branch');
    console.log('2. Deploy to gh-pages branch:');
    console.log(`   git subtree push --prefix=${BUILD_DIR} origin ${BRANCH}`);
    console.log('');
    console.log('📌 GitHub Pages URL:');
    console.log('   https://shmuelpol.github.io/ammunition-report/');
  } catch (err) {
    console.error('❌ Deployment failed:', err);
    process.exit(1);
  }
}

deploy();
