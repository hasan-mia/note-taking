const http = require('http');
const app = require('./app');
const { socket } = require('./config/socket');

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);

// Initialize Socket.io
socket(server);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});