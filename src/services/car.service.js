/* eslint-disable class-methods-use-this */
const Car = require('../models/Car');
const AppError = require('../exceptions/AppError');

class CarService {
  async createCars(carsData) {
    try {
      if (Array.isArray(carsData)) {
        return await Car.insertMany(carsData);
      }
      return await Car.create(carsData);
    } catch (error) {
      throw new AppError('Failed to create car records', 500);
    }
  }

  async getCars(filterCriteria) {
    try {
      return await Car.find(filterCriteria);
    } catch (error) {
      throw new AppError('Failed to filter cars', 500);
    }
  }

  async deleteCarByModel(model) {
    try {
      return await Car.findOneAndDelete({ model });
    } catch (error) {
      throw new AppError('Failed to delete car record', 500);
    }
  }
}

module.exports = new CarService();
