/* eslint-disable linebreak-style, no-console */
const express = require('express');
require('./db/data');
const cors = require('cors');
const http = require('http');
// eslint-disable-next-line import/no-extraneous-dependencies
const { Server } = require('socket.io');
// API Routes
const userAPI = require('./controllers/user.controller').router;
const jwtapi = require('./controllers/auth.controller').router;
const adminAPI = require('./controllers/admin.controller').router;
const airportAPI = require('./controllers/airport.controller').router;
const priceAPI = require('./controllers/price.controller').router;
const blogAPI = require('./controllers/blog.controller').router;
const countriesAPI = require('./controllers/country.controller').router;
const bookingAPI = require('./controllers/booking.controller').router;
const carAPI = require('./controllers/car.controller').router;
const healthAPI = require('./controllers/health.controller').router;
// const otpAPI = require('./controllers/otp.controller').router;
// const flightStatus = require('./router/flightStatus');
const app = express();
const port = process.env.PORT || 5000;

// Apply middleware BEFORE routes
app.use(express.json());
app.use(
  cors({
    origin: [
      'http://localhost:3000',
      'https://deck-api-g59h.onrender.com',
      'https://deck-ui.onrender.com',
    ],
  }),
);

// 1. Create HTTP server from express app
const server = http.createServer(app);
// 2. Initialize Socket.io with CORS allowing your React app
const io = new Server(server, {
  cors: {
    origin: '*', // Or specify: ['http://localhost:3000', 'http://localhost:3001']
    methods: ['GET', 'POST', 'PATCH']
  }
});

// 3. Socket event handlers
io.on('connection', (socket) => {
  console.log('Socket client connected:', socket.id);
  // User opens chat for a specific blog post
  socket.on('join_blog_chat', ({ blogUser }) => {
    if (blogUser) {
      socket.join(blogUser);
    }
  });
  // User closes chat modal
  socket.on('leave_blog_chat', ({ blogUser }) => {
    if (blogUser) {
      socket.leave(blogUser);
    }
  });
  // Relay chat updates to all users in that blog post's room & update blog lists
  socket.on('chat:update', ({ blogUser, chat }) => {
    // Broadcast to everyone currently in the chat room (System A and System B)
    io.to(blogUser).emit('chat:updated', { blogUser, chat });

    // Also notify main blog list cards to update their comment counters
    socket.broadcast.emit('blog:updated');
  });
  socket.on('disconnect', () => {
    console.log('Socket client disconnected:', socket.id);
  });
});

app.use((req, res, next) => {
  req.io = io;
  next();
});

const routes = [
  userAPI,
  jwtapi,
  adminAPI,
  airportAPI,
  priceAPI,
  blogAPI,
  countriesAPI,
  bookingAPI,
  carAPI,
  healthAPI,
  // otpAPI,
];

routes.forEach((route) => app.use(route));
// app.use(flightStatus);
server.listen(port, () => {
  console.warn(`we are listening from port ${port}`);
});

module.exports = app;
