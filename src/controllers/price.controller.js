/* eslint-disable class-methods-use-this */
const express = require('express');
const priceService = require('../services/price.service');
const STATUS = require('../constants/statusConstants');

const router = express.Router();

class PriceController {
  async createPrices(req, res) {
    try {
      const response = await priceService.createPrices(req.body);
      return res.status(201).send({
        data: response,
        message: 'Price records created successfully',
        status: STATUS.SUCCESS,
      });
    } catch (error) {
      return res.status(400).send({
        data: null,
        message: error.message || 'Error creating price records',
        status: STATUS.FAILURE,
      });
    }
  }

  async updatePriceByCodeFrom(req, res) {
    try {
      const { priceId } = req.params;
      const updatedPrice = await priceService.updatePriceByCodeFrom(priceId, req.body);
      if (!updatedPrice) {
        return res.status(404).send({
          data: null,
          message: `Price record '${priceId}' not found`,
          status: STATUS.NOT_FOUND,
        });
      }
      return res.status(200).send({
        data: updatedPrice,
        message: `Price record '${priceId}' updated successfully`,
        status: STATUS.SUCCESS,
      });
    } catch (error) {
      return res.status(400).send({
        data: null,
        message: error.message || 'Error updating price record',
        status: STATUS.FAILURE,
      });
    }
  }

  async getAllPrices(req, res) {
    try {
      const response = await priceService.getAllPrices();
      return res.status(200).send({
        data: response,
        message: 'Prices fetched successfully',
        status: STATUS.SUCCESS,
      });
    } catch (error) {
      return res.status(400).send({
        data: null,
        message: error.message || 'Error fetching prices',
        status: STATUS.FAILURE,
      });
    }
  }
}

const priceController = new PriceController();

router.post('/api/v1/prices', priceController.createPrices.bind(priceController));
router.patch('/api/v1/prices/:priceId', priceController.updatePriceByCodeFrom.bind(priceController));
router.get('/api/v1/prices', priceController.getAllPrices.bind(priceController));

priceController.router = router;

module.exports = priceController;
