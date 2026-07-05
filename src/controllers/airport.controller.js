/* eslint-disable class-methods-use-this */
const express = require('express');
const jwt = require('jsonwebtoken');
const airportService = require('../services/airport.service');

const router = express.Router();
const maxAge = 3 * 24 * 60 * 60;

const createToken = (id) =>
  jwt.sign({ id }, 'token data', { expiresIn: maxAge });

class AirportController {
  async getAllAirports(req, res) {
    try {
      const response = await airportService.getAllAirports();
      return res.status(201).send(response);
    } catch (error) {
      return res.status(400).send(error);
    }
  }

  async getAirportByCode(req, res) {
    try {
      const { id } = req.params;
      const getSingleData = await airportService.getAirportByCode(id);

      const codeValue = getSingleData.length > 0 ? getSingleData[0].code : id;
      const token = createToken(codeValue);

      res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000 });
      return res.status(201).send(getSingleData);
    } catch (error) {
      return res.status(400).send(error);
    }
  }

  async updateAirportByCode(req, res) {
    try {
      const { id } = req.params;
      const updatedAirport = await airportService.updateAirportByCode(
        id,
        req.body,
      );
      if (!updatedAirport) {
        return res.status(404).send('Airport not found');
      }
      return res.send(updatedAirport);
    } catch (error) {
      return res.status(400).send(error);
    }
  }
}

const airportController = new AirportController();

// Map legacy routes
router.get(
  '/airportGet',
  airportController.getAllAirports.bind(airportController),
);
router.get(
  '/airportGet/:id',
  airportController.getAirportByCode.bind(airportController),
);
router.patch(
  '/airportUpdate/:id',
  airportController.updateAirportByCode.bind(airportController),
);

airportController.router = router;

module.exports = airportController;
