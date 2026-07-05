/* eslint-disable linebreak-style */
const express = require('express');
const cors = require('cors');
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
// const flightStatus = require('./router/flightStatus');
const app = express();

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
];

routes.forEach((route) => app.use(route));
// app.use(flightStatus);
module.exports = app;
