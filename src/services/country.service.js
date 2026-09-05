/* eslint-disable class-methods-use-this */
const Country = require('../models/Country');

class CountryService {
  async createCountries(countriesData) {
    if (Array.isArray(countriesData)) {
      return Country.insertMany(countriesData);
    }
    return Country.create(countriesData);
  }

  async getAllCountries() {
    return Country.find({});
  }

  async getCountryByCode(code) {
    return Country.find({ code });
  }

  async updateCountryByCode(code, updateData) {
    return Country.findOneAndUpdate({ code }, updateData, { new: true });
  }

  async deleteCountryByCode(code) {
    return Country.findOneAndDelete({ code });
  }
}

module.exports = new CountryService();
