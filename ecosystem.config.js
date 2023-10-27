module.exports = {
  apps: [
    {
      name: "Gameserver-backend",
      script: "./server.ts",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
    },
  ],
};
