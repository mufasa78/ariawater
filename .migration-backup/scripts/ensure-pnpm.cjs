const fs = require('fs');
const path = require('path');

const userAgent = process.env.npm_config_user_agent || '';

if (userAgent && !userAgent.startsWith('pnpm/')) {
  console.error('Use pnpm instead of npm/yarn for this workspace.');
  process.exit(1);
}

for (const lockfile of ['package-lock.json', 'yarn.lock']) {
  const filePath = path.join(process.cwd(), lockfile);
  if (fs.existsSync(filePath)) {
    fs.rmSync(filePath, { force: true });
  }
}
