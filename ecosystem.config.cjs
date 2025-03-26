module.exports = {
  apps: [
    {
      name: "everleigh",
      script: "npm",
      args: "run start",
      cwd: "/var/www/html/everleigh",
      env: {
        NODE_ENV: "production",
        PORT: 3005,
        HOST: "127.0.0.1"
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      error_file: "/var/log/pm2/everleigh-error.log",
      out_file: "/var/log/pm2/everleigh-out.log",
      merge_logs: true,
      restart_delay: 1000,
      wait_ready: true,
      listen_timeout: 10000,
      kill_timeout: 5000,
      exec_mode: "fork"
    }
  ]
};
