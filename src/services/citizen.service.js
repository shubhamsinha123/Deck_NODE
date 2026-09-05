/* eslint-disable class-methods-use-this */
const Citizen = require('../models/Citizen');

class CitizenService {
  async createCitizen(citizenData) {
    if (Array.isArray(citizenData)) {
      return Citizen.insertMany(citizenData);
    }
    return Citizen.create(citizenData);
  }

  async getAllCitizens() {
    return Citizen.find({});
  }

  async getCitizenById(id) {
    return Citizen.find({ id });
  }

  async updateCitizenById(id, updateData) {
    return Citizen.findOneAndUpdate({ id }, updateData, { new: true });
  }

  async deleteCitizenById(id) {
    return Citizen.findOneAndDelete({ id });
  }
}

module.exports = new CitizenService();
