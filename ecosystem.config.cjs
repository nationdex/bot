const path = require('node:path');

const root = __dirname;
const websiteDir = path.join(root, 'website');
const logsDir = path.join(root, 'logs');

module.exports = {
  apps: [
    {
      name: 'nationdex-bot',
      cwd: root,
      script: path.join(root, 'dist', 'index.js'),
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      merge_logs: true,
      time: true,
      out_file: path.join(logsDir, 'bot-out.log'),
      error_file: path.join(logsDir, 'bot-error.log'),
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'nationdex-admin',
      cwd: websiteDir,
      script: path.join(websiteDir, 'node_modules', 'vite', 'bin', 'vite.js'),
      args: 'preview --port 3000 --host',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      merge_logs: true,
      time: true,
      out_file: path.join(logsDir, 'admin-out.log'),
      error_file: path.join(logsDir, 'admin-error.log'),
      env: {
        NODE_ENV: 'production',
        PORT: '3000',
      },
    },
  ],
};
