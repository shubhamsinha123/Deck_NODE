/* eslint-disable class-methods-use-this */
const express = require('express');
const priceService = require('../services/price.service');

const router = express.Router();

class PriceController {
  async createPrices(req, res) {
    try {
      const response = await priceService.createPrices(req.body);
      return res.send(response);
    } catch (error) {
      return res.status(400).send(error);
    }
  }

  async updatePriceByCodeFrom(req, res) {
    try {
      const { id } = req.params;
      const updatedPrice = await priceService.updatePriceByCodeFrom(
        id,
        req.body,
      );
      if (!updatedPrice) {
        return res.status(404).send('Price record not found');
      }
      return res.send(updatedPrice);
    } catch (error) {
      return res.status(400).send(error);
    }
  }

  async getAllPrices(req, res) {
    try {
      const response = await priceService.getAllPrices();
      return res.status(201).send(response);
    } catch (error) {
      return res.status(400).send(error);
    }
  }
}

const priceController = new PriceController();

// Map legacy routes
router.post('/pricePost', priceController.createPrices.bind(priceController));
router.patch(
  '/priceUpdate/:id',
  priceController.updatePriceByCodeFrom.bind(priceController),
);
router.get('/priceGet', priceController.getAllPrices.bind(priceController));

priceController.router = router;

module.exports = priceController;
