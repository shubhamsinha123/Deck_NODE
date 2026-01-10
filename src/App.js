/* eslint-disable linebreak-style */
const express = require('express');
require('./db/data');
const cors = require('cors');
// API Routes
const userAPI = require('./router/userAPI');
const jwtapi = require('./router/jwtapi');
const adminAPI = require('./router/adminAPI');
const airportAPI = require('./router/airportAPI');
const priceAPI = require('./router/priceAPI');
const blogAPI = require('./router/blogAPI');
const countriesAPI = require('./router/countriesAPI');
const bookingAPI = require('./router/bookingAPI');
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

const routes = [
  userAPI,
  jwtapi,
  adminAPI,
  airportAPI,
  priceAPI,
  blogAPI,
  countriesAPI,
  bookingAPI,
];

routes.forEach((route) => app.use(route));
// app.use(flightStatus);
app.listen(port, () => {
  console.warn(`we are listening from port ${port}`);
});
