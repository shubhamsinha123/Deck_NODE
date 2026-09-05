/* eslint-disable class-methods-use-this */
const express = require('express');
const airportService = require('../services/airport.service');
const STATUS = require('../constants/statusConstants');

const router = express.Router();

class AirportController {
  async getAllAirports(req, res) {
    try {
      const response = await airportService.getAllAirports();
      return res.status(200).send({
        data: response,
        message: 'Airports fetched successfully',
        status: STATUS.SUCCESS,
      });
    } catch (error) {
      return res.status(400).send({
        data: null,
        message: error.message || 'Error fetching airports',
        status: STATUS.FAILURE,
      });
    }
  }

  async getAirportByCode(req, res) {
    try {
      const { airportCode } = req.params;
      const getSingleData = await airportService.getAirportByCode(airportCode);
      if (!getSingleData || getSingleData.length === 0) {
        return res.status(404).send({
          data: null,
          message: `Airport with code '${airportCode}' not found`,
          status: STATUS.NOT_FOUND,
        });
      }
      return res.status(200).send({
        data: getSingleData,
        message: 'Airport fetched successfully',
        status: STATUS.SUCCESS,
      });
    } catch (error) {
      return res.status(400).send({
        data: null,
        message: error.message || 'Error fetching airport',
        status: STATUS.FAILURE,
      });
    }
  }

  async updateAirportByCode(req, res) {
    try {
      const { airportCode } = req.params;
      const updatedAirport = await airportService.updateAirportByCode(
        airportCode,
        req.body,
      );
      if (!updatedAirport) {
        return res.status(404).send({
          data: null,
          message: `Airport with code '${airportCode}' not found`,
          status: STATUS.NOT_FOUND,
        });
      }
      return res.status(200).send({
        data: updatedAirport,
        message: `Airport '${airportCode}' updated successfully`,
        status: STATUS.SUCCESS,
      });
    } catch (error) {
      return res.status(400).send({
        data: null,
        message: error.message || 'Error updating airport',
        status: STATUS.FAILURE,
      });
    }
  }
}

const airportController = new AirportController();

router.get('/api/v1/airports', airportController.getAllAirports.bind(airportController));
router.get('/api/v1/airports/:airportCode', airportController.getAirportByCode.bind(airportController));
router.patch('/api/v1/airports/:airportCode', airportController.updateAirportByCode.bind(airportController));

airportController.router = router;

module.exports = airportController;
