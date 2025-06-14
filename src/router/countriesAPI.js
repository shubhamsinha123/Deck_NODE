/* eslint-disable linebreak-style */
/* eslint-disable consistent-return */
const express = require('express');

const countriesAPI = express.Router();
const countrySchema = require('../model/countriesSchema');

countriesAPI.post('/addCountries', async (req, res) => {
  try {
    const blogArray = req.body;
    const postBatchResponseData = await countrySchema.insertMany(blogArray);
    res.status(201).send(postBatchResponseData);
  } catch (e) {
    res.status(400).send(e);
  }
});

countriesAPI.get('/countryList', async (req, res) => {
  try {
    const getData = await countrySchema.find({});
    res.send(getData);
  } catch (e) {
    res.status(400).send(e);
  }
});

// Get particular data from API
countriesAPI.get('/countryList/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const getSingleData = await countrySchema.find({ code: id });
    res.send(getSingleData);
  } catch (e) {
    res.status(400).send(e);
  }
});

countriesAPI.patch('/countryList/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updatedAirport = await countrySchema.findOneAndUpdate(
      { code: id },
      req.body,
      {
        new: true,
      },
    );
    if (!updatedAirport) {
      return res.status(404).send('Country not found');
    }

    res.status(202).send(updatedAirport);
  } catch (e) {
    res.status(400).send(e);
  }
});

// to update the API
countriesAPI.delete('/countryList/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleteCitizen = await countrySchema.findOneAndDelete({ code: id });
    if (!deleteCitizen) {
      return res.status(404).send('Country not found');
    }

    res.status(202).send(`country with code: ${id} deleted successfully`);
  } catch (e) {
    res.status(400).send(e);
  }
});
module.exports = countriesAPI;
