/* eslint-disable linebreak-style */
/* eslint-disable consistent-return */
const express = require('express');

const carRouter = express.Router();
const carSchema = require('../model/carSchema');

carRouter.post('/api/cars-post', async (req, res) => {
  try {
    const bulkCarData = req.body;
    const postBatchResponseData = await carSchema.insertMany(bulkCarData);
    res.status(201).send({
      data: postBatchResponseData,
      message: 'Cars data created successfully.',
      status: 'SUCCESS',
    });
  } catch (e) {
    res.status(400).send(e);
  }
});

carRouter.get('/api/cars-get', async (req, res) => {
  try {
    const {
      engineType, model, transmission, maker,
    } = req.query;

    const validKeys = ['engineType', 'model', 'transmission', 'maker'];
    const providedKeys = Object.keys(req.query);
    const invalidKeys = providedKeys.filter((key) => !validKeys.includes(key));

    if (invalidKeys.length > 0) {
      return res.status(400).send({
        message: `Invalid filter criteria provided: ${invalidKeys.join(', ')}. Only engineType, model or transmission are allowed.`,
        status: 'FAILURE',
      });
    }

    // Build filter criteria dynamically (only include fields that are provided)
    const filterCriteria = {};
    if (engineType) filterCriteria.engineType = engineType;
    if (model) filterCriteria.model = model;
    if (transmission) filterCriteria.transmission = transmission;
    if (maker) filterCriteria.maker = maker;

    const filteredCars = await carSchema.find(filterCriteria);

    if (!filteredCars.length) {
      return res.status(404).send({
        message: 'No cars found matching the criteria.',
        status: 'FAILURE',
      });
    }

    res.status(200).send({
      data: filteredCars,
      message: 'Cars filtered successfully.',
      status: 'SUCCESS',
    });
  } catch (e) {
    res.status(400).send({
      message: 'Error filtering cars',
      error: e.message,
      status: 'FAILURE',
    });
  }
});

carRouter.delete('/api/delete-cars-name/:name', async (req, res) => {
  try {
    const { model } = req.params;
    const deleteCars = await carSchema.findOneAndDelete({ model });
    if (!deleteCars) {
      return res.status(404).send({
        message: `No such record found with model: ${model}`,
        status: 'FAILURE',
      });
    }

    res.status(200).send({
      message: `record with ${model} deleted successfully.`,
      status: 'SUCCESS',
    });
  } catch (e) {
    res.status(400).send(e);
  }
});

module.exports = carRouter;
