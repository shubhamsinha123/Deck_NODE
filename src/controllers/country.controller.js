/* eslint-disable class-methods-use-this */
const express = require('express');
const countryService = require('../services/country.service');
const STATUS = require('../constants/statusConstants');

const router = express.Router();

class CountryController {
  async createCountries(req, res) {
    try {
      const response = await countryService.createCountries(req.body);
      return res.status(201).send({
        data: response,
        message: 'Countries created successfully',
        status: STATUS.SUCCESS,
      });
    } catch (error) {
      return res.status(400).send({
        data: null,
        message: error.message || 'Error creating countries',
        status: STATUS.FAILURE,
      });
    }
  }

  async getAllCountries(req, res) {
    try {
      const response = await countryService.getAllCountries();
      return res.status(200).send({
        data: response,
        message: 'Countries fetched successfully',
        status: STATUS.SUCCESS,
      });
    } catch (error) {
      return res.status(400).send({
        data: null,
        message: error.message || 'Error fetching countries',
        status: STATUS.FAILURE,
      });
    }
  }

  async getCountryByCode(req, res) {
    try {
      const response = await countryService.getCountryByCode(req.params.countryCode);
      if (!response) {
        return res.status(404).send({
          data: null,
          message: `Country with code '${req.params.countryCode}' not found`,
          status: STATUS.NOT_FOUND,
        });
      }
      return res.status(200).send({
        data: response,
        message: 'Country fetched successfully',
        status: STATUS.SUCCESS,
      });
    } catch (error) {
      return res.status(400).send({
        data: null,
        message: error.message || 'Error fetching country',
        status: STATUS.FAILURE,
      });
    }
  }

  async updateCountryByCode(req, res) {
    try {
      const { countryCode } = req.params;
      const updatedCountry = await countryService.updateCountryByCode(countryCode, req.body);
      if (!updatedCountry) {
        return res.status(404).send({
          data: null,
          message: `Country with code '${countryCode}' not found`,
          status: STATUS.NOT_FOUND,
        });
      }
      return res.status(200).send({
        data: updatedCountry,
        message: `Country '${countryCode}' updated successfully`,
        status: STATUS.SUCCESS,
      });
    } catch (error) {
      return res.status(400).send({
        data: null,
        message: error.message || 'Error updating country',
        status: STATUS.FAILURE,
      });
    }
  }

  async deleteCountryByCode(req, res) {
    try {
      const { countryCode } = req.params;
      const deletedCountry = await countryService.deleteCountryByCode(countryCode);
      if (!deletedCountry) {
        return res.status(404).send({
          data: null,
          message: `Country with code '${countryCode}' not found`,
          status: STATUS.NOT_FOUND,
        });
      }
      return res.status(200).send({
        data: deletedCountry,
        message: `Country '${countryCode}' deleted successfully`,
        status: STATUS.SUCCESS,
      });
    } catch (error) {
      return res.status(400).send({
        data: null,
        message: error.message || 'Error deleting country',
        status: STATUS.FAILURE,
      });
    }
  }
}

const countryController = new CountryController();

router.post('/api/v1/countries', countryController.createCountries.bind(countryController));
router.get('/api/v1/countries', countryController.getAllCountries.bind(countryController));
router.get('/api/v1/countries/:countryCode', countryController.getCountryByCode.bind(countryController));
router.patch('/api/v1/countries/:countryCode', countryController.updateCountryByCode.bind(countryController));
router.delete('/api/v1/countries/:countryCode', countryController.deleteCountryByCode.bind(countryController));

countryController.router = router;

module.exports = countryController;
