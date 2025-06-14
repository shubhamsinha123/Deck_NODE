/* eslint-disable linebreak-style */
/* eslint-disable consistent-return */
const express = require('express');

const priceAPI = express.Router();
const priceSchema = require('../model/priceSchema');
// batch post
priceAPI.post('/pricePost', async (req, res) => {
  try {
    const priceArray = req.body;
    const postBatchResponseData = await priceSchema.insertMany(priceArray);
    res.send(postBatchResponseData);
  } catch (e) {
    res.status(400).send(e);
  }
});
priceAPI.patch('/priceUpdate/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updatedCitizen = await priceSchema.findOneAndUpdate(
      { codeFrom: id },
      req.body,
      {
        new: true,
      },
    );
    if (!updatedCitizen) {
      return res.status(404).send('Admin not found');
    }

    res.send(updatedCitizen);
  } catch (e) {
    res.status(400).send(e);
  }
});

priceAPI.get('/priceGet', async (req, res) => {
  try {
    const getData = await priceSchema.find({});
    res.status(201).send(getData);
  } catch (e) {
    res.status(400).send(e);
  }
});

module.exports = priceAPI;
