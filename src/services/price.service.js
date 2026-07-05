/* eslint-disable class-methods-use-this */
const Price = require('../models/Price');
const AppError = require('../exceptions/AppError');

class PriceService {
  async createPrices(pricesData) {
    try {
      if (Array.isArray(pricesData)) {
        return await Price.insertMany(pricesData);
      }
      return await Price.create(pricesData);
    } catch (error) {
      throw new AppError('Failed to create price records', 500);
    }
  }

  async updatePriceByCodeFrom(codeFrom, updateData) {
    try {
      return await Price.findOneAndUpdate({ codeFrom }, updateData, {
        new: true,
      });
    } catch (error) {
      throw new AppError('Failed to update price record', 500);
    }
  }

  async getAllPrices() {
    try {
      return await Price.find({});
    } catch (error) {
      throw new AppError('Failed to fetch prices', 500);
    }
  }
}

module.exports = new PriceService();
