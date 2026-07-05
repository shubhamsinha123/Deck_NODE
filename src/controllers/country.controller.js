/* eslint-disable class-methods-use-this */
const express = require('express');
const countryService = require('../services/country.service');

const router = express.Router();

class CountryController {
  async createCountries(req, res) {
    try {
      const response = await countryService.createCountries(req.body);
      return res.status(201).send(response);
    } catch (error) {
      return res.status(400).send(error);
    }
  }

  async getAllCountries(req, res) {
    try {
      const response = await countryService.getAllCountries();
      return res.send(response);
    } catch (error) {
      return res.status(400).send(error);
    }
  }

  async getCountryByCode(req, res) {
    try {
      const response = await countryService.getCountryByCode(req.params.id);
      return res.send(response);
    } catch (error) {
      return res.status(400).send(error);
    }
  }

  async updateCountryByCode(req, res) {
    try {
      const { id } = req.params;
      const updatedCountry = await countryService.updateCountryByCode(
        id,
        req.body,
      );
      if (!updatedCountry) {
        return res.status(404).send('Country not found');
      }
      return res.status(202).send(updatedCountry);
    } catch (error) {
      return res.status(400).send(error);
    }
  }

  async deleteCountryByCode(req, res) {
    try {
      const { id } = req.params;
      const deletedCountry = await countryService.deleteCountryByCode(id);
      if (!deletedCountry) {
        return res.status(404).send('Country not found');
      }
      return res
        .status(202)
        .send(`country with code: ${id} deleted successfully`);
    } catch (error) {
      return res.status(400).send(error);
    }
  }
}

const countryController = new CountryController();

// Map legacy routes
router.post(
  '/addCountries',
  countryController.createCountries.bind(countryController),
);
router.get(
  '/countryList',
  countryController.getAllCountries.bind(countryController),
);
router.get(
  '/countryList/:id',
  countryController.getCountryByCode.bind(countryController),
);
router.patch(
  '/countryList/:id',
  countryController.updateCountryByCode.bind(countryController),
);
router.delete(
  '/countryList/:id',
  countryController.deleteCountryByCode.bind(countryController),
);

countryController.router = router;

module.exports = countryController;
