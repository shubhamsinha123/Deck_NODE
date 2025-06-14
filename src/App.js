/* eslint-disable linebreak-style */
const express = require('express');
require('./db/data');
const cors = require('cors');
const router = require('./router/userAPI');
const adminAPI = require('./router/adminAPI');
const airportAPI = require('./router/airportAPI');
const priceAPI = require('./router/priceAPI');
const jwtapp = require('./router/jwtapi');
const blogRouter = require('./router/blogAPI');
const countriesRouter = require('./router/countriesAPI');
// const flight = require('./router/flightStatus');
const app = express();
const port = process.env.PORT || 5000;
app.use(express.json());

app.use(router);
app.use(jwtapp);
app.use(adminAPI);
app.use(airportAPI);
app.use(priceAPI);
app.use(blogRouter);
app.use(countriesRouter);
// app.use(flight);
app.use(
  cors({
    origin: ['http://localhost:3000', 'https://deckdigital.netlify.app'],
  }),
);
app.listen(port, () => {
  console.log(`we are listening from port ${port}`);
});
