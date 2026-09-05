/* eslint-disable class-methods-use-this */
const Airport = require('../models/Airport');

class AirportService {
  async getAllAirports() {
    return Airport.find({});
  }

  async getAirportByCode(code) {
    return Airport.find({ code });
  }

  async updateAirportByCode(code, updateData) {
    return Airport.findOneAndUpdate({ code }, updateData, { new: true });
  }
}

module.exports = new AirportService();
