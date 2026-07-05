/* eslint-disable class-methods-use-this */
const express = require('express');
const carService = require('../services/car.service');

const router = express.Router();

class CarController {
  async createCars(req, res) {
    try {
      const response = await carService.createCars(req.body);
      return res.status(201).send({
        data: response,
        message: 'Cars data created successfully.',
        status: 'SUCCESS',
      });
    } catch (error) {
      return res.status(400).send(error);
    }
  }

  async getCars(req, res) {
    try {
      const { engineType, model, transmission, maker } = req.query;

      const validKeys = ['engineType', 'model', 'transmission', 'maker'];
      const providedKeys = Object.keys(req.query);
      const invalidKeys = providedKeys.filter(
        (key) => !validKeys.includes(key),
      );

      if (invalidKeys.length > 0) {
        return res.status(400).send({
          message: `Invalid filter criteria provided: ${invalidKeys.join(', ')}. Only engineType, model or transmission are allowed.`,
          status: 'FAILURE',
        });
      }

      const filterCriteria = {};
      if (engineType) filterCriteria.engineType = engineType;
      if (model) filterCriteria.model = model;
      if (transmission) filterCriteria.transmission = transmission;
      if (maker) filterCriteria.maker = maker;

      const filteredCars = await carService.getCars(filterCriteria);

      if (!filteredCars.length) {
        return res.status(404).send({
          message: 'No cars found matching the criteria.',
          status: 'FAILURE',
        });
      }

      return res.status(200).send({
        data: filteredCars,
        message: 'Cars filtered successfully.',
        status: 'SUCCESS',
      });
    } catch (error) {
      return res.status(400).send({
        message: 'Error filtering cars',
        error: error.message,
        status: 'FAILURE',
      });
    }
  }

  async deleteCar(req, res) {
    try {
      const model = req.params.model || req.params.name;
      const deleteCars = await carService.deleteCarByModel(model);
      if (!deleteCars) {
        return res.status(404).send({
          message: `No such record found with model: ${model}`,
          status: 'FAILURE',
        });
      }

      return res.status(200).send({
        message: `record with ${model} deleted successfully.`,
        status: 'SUCCESS',
      });
    } catch (error) {
      return res.status(400).send(error);
    }
  }
}

const carController = new CarController();

// Map legacy routes
router.post('/api/cars-post', carController.createCars.bind(carController));
router.get('/api/cars-get', carController.getCars.bind(carController));
router.delete(
  '/api/delete-cars-name/:name',
  carController.deleteCar.bind(carController),
);

carController.router = router;

module.exports = carController;
