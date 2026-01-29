module.exports = {
  apps: [{
    name: 'jarvis-tasks',
    script: 'npx',
    args: 'next start -p 3333',
    cwd: '/root/jarvis-tasks',
    env: {
      NODE_ENV: 'production'
    }
  }]
}
