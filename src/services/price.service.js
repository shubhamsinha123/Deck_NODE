/* eslint-disable class-methods-use-this */
const Price = require('../models/Price');

class PriceService {
  async createPrices(pricesData) {
    if (Array.isArray(pricesData)) {
      return Price.insertMany(pricesData);
    }
    return Price.create(pricesData);
  }

  async updatePriceByCodeFrom(codeFrom, updateData) {
    return Price.findOneAndUpdate({ codeFrom }, updateData, { new: true });
  }

  async getAllPrices() {
    return Price.find({});
  }
}

module.exports = new PriceService();
