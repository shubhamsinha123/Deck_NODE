/* eslint-disable class-methods-use-this */
const Car = require('../models/Car');

class CarService {
  async createCars(carsData) {
    if (Array.isArray(carsData)) {
      return Car.insertMany(carsData);
    }
    return Car.create(carsData);
  }

  async getCars(filterCriteria = {}) {
    return Car.find(filterCriteria);
  }

  async deleteCarByModel(model) {
    return Car.findOneAndDelete({ model });
  }
}

module.exports = new CarService();
