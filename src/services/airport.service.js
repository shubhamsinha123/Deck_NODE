/* eslint-disable class-methods-use-this */
const Airport = require('../models/Airport');
const AppError = require('../exceptions/AppError');

class AirportService {
  async getAllAirports() {
    try {
      return await Airport.find({});
    } catch (error) {
      throw new AppError('Failed to fetch airports', 500);
    }
  }

  async getAirportByCode(code) {
    try {
      return await Airport.find({ code });
    } catch (error) {
      throw new AppError('Failed to fetch airport by code', 500);
    }
  }

  async updateAirportByCode(code, updateData) {
    try {
      return await Airport.findOneAndUpdate({ code }, updateData, {
        new: true,
      });
    } catch (error) {
      throw new AppError('Failed to update airport', 500);
    }
  }
}

module.exports = new AirportService();
