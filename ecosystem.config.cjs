module.exports = {
  apps: [
    {
      name: "my-app",
      script: "server.ts", // Replace with the entry point of your Node.js application
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
    },
  ],
};
