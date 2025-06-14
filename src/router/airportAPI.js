/* eslint-disable linebreak-style */
/* eslint-disable consistent-return */
const express = require('express');

const airportAPI = express.Router();
const jwt = require('jsonwebtoken');

// const crypto = require('crypto');
const airportSchema = require('../model/airportSchema');

// JWT Secret Key Generator
// const generateJWTSecret = () => crypto.randomBytes(32).toString('hex');

// const JWT_SECRET = generateJWTSecret();
// console.log("Generated JWT Secret:", JWT_SECRET);
const maxAge = 3 * 24 * 60 * 60;
const createToken = (id) => {
  jwt.sign({ id }, 'token data', {
    expiresIn: maxAge,
  });
};
airportAPI.get('/airportGet', async (req, res) => {
  try {
    const getData = await airportSchema.find({});
    res.status(201).send(getData);
  } catch (e) {
    // console.log(e);
    res.status(400).send(e);
  }
});

// Get particular data from API
airportAPI.get('/airportGet/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // can be country also, depends
    const getSingleData = await airportSchema.find({ code: id });
    // const responseData = await addCitizenShip.save();
    // res.send(responseData);
    const token = createToken(getSingleData.code);
    // console.log(token);
    res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000 });
    res.status(201).send(getSingleData);
  } catch (e) {
    res.status(400).send(e);
  }
});

airportAPI.patch('/airportUpdate/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updatedAirport = await airportSchema.findOneAndUpdate(
      { code: id },
      req.body,
      {
        new: true,
      },
    );
    if (!updatedAirport) {
      return res.status(404).send('Airport not found');
    }

    res.send(updatedAirport);
  } catch (e) {
    res.status(400).send(e);
  }
});
module.exports = airportAPI;
