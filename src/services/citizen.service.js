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
    return Citizen.find({}).select('-password');
  }

  async getCitizenById(id) {
    return Citizen.find({ id }).select('-password');
  }

  async updateCitizenById(id, updateData) {
    return Citizen.findOneAndUpdate({ id }, updateData, { new: true }).select('-password');
  }

  async deleteCitizenById(id) {
    return Citizen.findOneAndDelete({ id }).select('-password');
  }
}

module.exports = new CitizenService();
