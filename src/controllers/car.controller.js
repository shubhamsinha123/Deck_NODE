/* eslint-disable class-methods-use-this */
const express = require('express');
const carService = require('../services/car.service');
const STATUS = require('../constants/statusConstants');

const router = express.Router();

class CarController {
  async createCars(req, res) {
    try {
      const response = await carService.createCars(req.body);
      return res.status(201).send({
        data: response,
        message: 'Cars data created successfully',
        status: STATUS.SUCCESS,
      });
    } catch (error) {
      return res.status(400).send({
        data: null,
        message: error.message || 'Error creating cars',
        status: STATUS.FAILURE,
      });
    }
  }

  async getCars(req, res) {
    try {
      const {
        engineType,
        model,
        transmission,
        maker,
      } = req.query;

      const validKeys = ['engineType', 'model', 'transmission', 'maker'];

      const providedKeys = Object.keys(req.query);
      const invalidKeys = providedKeys.filter((key) => !validKeys.includes(key));

      if (invalidKeys.length > 0) {
        return res.status(400).send({
          data: null,
          message: `Invalid filter criteria: ${invalidKeys.join(', ')}. Allowed: engineType, model, transmission, maker`,
          status: STATUS.FAILURE,
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
          data: null,
          message: 'No cars found matching the criteria',
          status: STATUS.NOT_FOUND,
        });
      }

      return res.status(200).send({
        data: filteredCars,
        message: 'Cars fetched successfully',
        status: STATUS.SUCCESS,
      });
    } catch (error) {
      return res.status(400).send({
        data: null,
        message: error.message || 'Error fetching cars',
        status: STATUS.FAILURE,
      });
    }
  }

  async deleteCar(req, res) {
    try {
      const { model } = req.params;
      const deleteCars = await carService.deleteCarByModel(model);
      if (!deleteCars) {
        return res.status(404).send({
          data: null,
          message: `No record found with model: ${model}`,
          status: STATUS.NOT_FOUND,
        });
      }
      return res.status(200).send({
        data: deleteCars,
        message: `Car with model '${model}' deleted successfully`,
        status: STATUS.SUCCESS,
      });
    } catch (error) {
      return res.status(400).send({
        data: null,
        message: error.message || 'Error deleting car',
        status: STATUS.FAILURE,
      });
    }
  }
}

const carController = new CarController();

router.post('/api/v1/cars', carController.createCars.bind(carController));
router.get('/api/v1/cars', carController.getCars.bind(carController));
router.delete('/api/v1/cars/by-model/:model', carController.deleteCar.bind(carController));

carController.router = router;

module.exports = carController;
