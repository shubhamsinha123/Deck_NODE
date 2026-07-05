/* eslint-disable class-methods-use-this */
const Country = require('../models/Country');
const AppError = require('../exceptions/AppError');

class CountryService {
  async createCountries(countriesData) {
    try {
      if (Array.isArray(countriesData)) {
        return await Country.insertMany(countriesData);
      }
      return await Country.create(countriesData);
    } catch (error) {
      throw new AppError('Failed to create country records', 500);
    }
  }

  async getAllCountries() {
    try {
      return await Country.find({});
    } catch (error) {
      throw new AppError('Failed to fetch countries', 500);
    }
  }

  async getCountryByCode(code) {
    try {
      return await Country.find({ code });
    } catch (error) {
      throw new AppError('Failed to fetch country by code', 500);
    }
  }

  async updateCountryByCode(code, updateData) {
    try {
      return await Country.findOneAndUpdate({ code }, updateData, {
        new: true,
      });
    } catch (error) {
      throw new AppError('Failed to update country', 500);
    }
  }

  async deleteCountryByCode(code) {
    try {
      return await Country.findOneAndDelete({ code });
    } catch (error) {
      throw new AppError('Failed to delete country', 500);
    }
  }
}

module.exports = new CountryService();
