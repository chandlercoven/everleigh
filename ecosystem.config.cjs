module.exports = {
  apps: [
    {
      name: "everleigh",
      script: "npm",
      args: "start",
      cwd: "/var/www/html/everleigh",
      env: {
        NODE_ENV: "production",
        PORT: 3000
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      error_file: "/var/log/pm2/everleigh-error.log",
      out_file: "/var/log/pm2/everleigh-out.log",
      merge_logs: true,
      restart_delay: 1000
    }
  ]
}; 