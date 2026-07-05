/* eslint-disable class-methods-use-this */
const Citizen = require('../models/Citizen');
const AppError = require('../exceptions/AppError');

class CitizenService {
  async createCitizen(citizenData) {
    try {
      if (Array.isArray(citizenData)) {
        return await Citizen.insertMany(citizenData);
      }
      return await Citizen.create(citizenData);
    } catch (error) {
      throw new AppError('Failed to create citizen record', 500);
    }
  }

  async getAllCitizens() {
    try {
      const citizens = await Citizen.find({});
      citizens.sort((a, b) => {
        const numA = parseInt(a.id, 10);
        const numB = parseInt(b.id, 10);

        if (!Number.isNaN(numA) && !Number.isNaN(numB)) {
          return numA - numB;
        }
        return a.id.localeCompare(b.id);
      });
      return citizens;
    } catch (error) {
      throw new AppError('Failed to fetch citizens', 500);
    }
  }

  async getCitizenById(id) {
    try {
      return await Citizen.find({ id });
    } catch (error) {
      throw new AppError('Failed to fetch citizen', 500);
    }
  }

  async updateCitizenById(id, updateData) {
    try {
      return await Citizen.findOneAndUpdate({ id }, updateData, { new: true });
    } catch (error) {
      throw new AppError('Failed to update citizen', 500);
    }
  }

  async deleteCitizenById(id) {
    try {
      return await Citizen.findOneAndDelete({ id });
    } catch (error) {
      throw new AppError('Failed to delete citizen', 500);
    }
  }
}

module.exports = new CitizenService();
