/* eslint-disable class-methods-use-this */
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const User = require('../models/User');
const AppError = require('../exceptions/AppError');

const secretKey = crypto.randomBytes(32).toString('hex');

class AdminService {
  constructor() {
    this.secretKey = secretKey;
  }

  async getAllAdmins() {
    try {
      const getCitizenShip = await Admin.find({});
      getCitizenShip.sort((a, b) => {
        const numA = parseInt(a.MID, 10);
        const numB = parseInt(b.MID, 10);

        if (!Number.isNaN(numA) && !Number.isNaN(numB)) {
          return numA - numB;
        }
        return a.MID.localeCompare(b.MID);
      });
      return getCitizenShip;
    } catch (error) {
      throw new AppError('Failed to fetch admins', 500);
    }
  }

  async getAdminByMID(mid) {
    try {
      return await Admin.find({ MID: mid });
    } catch (error) {
      throw new AppError('Failed to fetch admin by ID', 500);
    }
  }

  async createAdmin(adminData) {
    try {
      if (Array.isArray(adminData)) {
        return await Admin.insertMany(adminData);
      }
      return await Admin.create(adminData);
    } catch (error) {
      throw new AppError('Failed to create admin record', 500);
    }
  }

  async updateAdminByMID(mid, updateData) {
    try {
      return await Admin.findOneAndUpdate({ MID: mid }, updateData, {
        new: true,
      });
    } catch (error) {
      throw new AppError('Failed to update admin', 500);
    }
  }

  async deleteAdminByMID(mid) {
    try {
      return await Admin.findOneAndDelete({ MID: mid });
    } catch (error) {
      throw new AppError('Failed to delete admin', 500);
    }
  }

  async deleteAdminsBulk(filterArray) {
    try {
      return await Admin.deleteMany(filterArray);
    } catch (error) {
      throw new AppError('Failed to delete admins bulk', 500);
    }
  }

  async loginAdmin(MID, MPIN) {
    const user = await Admin.findOne({ MID, MPIN });
    if (!user) {
      return null;
    }

    const token = jwt.sign({}, this.secretKey, { expiresIn: '600s' });
    const decoded = jwt.decode(token);

    const newExp = decoded.exp;
    const currentTime = Math.floor(Date.now() / 1000);
    const remainingTime = newExp - currentTime;

    return { token, expiresIn: `${remainingTime}s` };
  }

  async getUsersData() {
    try {
      const userData = await User.find({});
      userData.sort((a, b) => {
        const numA = parseInt(a.id, 10);
        const numB = parseInt(b.id, 10);

        if (!Number.isNaN(numA) && !Number.isNaN(numB)) {
          return numA - numB;
        }
        return a.id.localeCompare(b.id);
      });
      return userData;
    } catch (error) {
      throw new AppError('Failed to fetch user data', 500);
    }
  }
}

module.exports = new AdminService();
