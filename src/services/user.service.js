/* eslint-disable class-methods-use-this */
/* eslint-disable no-underscore-dangle */
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../exceptions/AppError');

const secretKey = crypto.randomBytes(32).toString('hex');

class UserService {
  constructor() {
    this.secretKey = secretKey;
  }

  async loginUser(id, password) {
    const user = await User.findOne({ id, password });
    if (!user) {
      return null;
    }

    const token = jwt.sign({ id: user.id }, this.secretKey, {
      expiresIn: '600s',
    });
    const decoded = jwt.decode(token);

    const currentTime = Math.floor(Date.now() / 1000);
    const remainingTime = decoded.exp - currentTime;

    return { token, expiresIn: `${remainingTime}s` };
  }

  async loginUserWithDetails(id, password) {
    const user = await User.findOne({ id, password });
    if (!user) {
      return null;
    }

    const responseData = { ...user };
    if (responseData._doc) {
      // eslint-disable-next-line no-underscore-dangle
      delete responseData._doc.password;
    }

    const token = jwt.sign({ id: user.id }, this.secretKey, {
      expiresIn: '600s',
    });
    // eslint-disable-next-line no-underscore-dangle
    return { token, userDetail: responseData._doc };
  }

  async createUsers(usersData) {
    try {
      if (Array.isArray(usersData)) {
        return await User.insertMany(usersData);
      }
      return await User.create(usersData);
    } catch (error) {
      throw new AppError('Failed to create user records', 500);
    }
  }

  async getUserById(id) {
    try {
      return await User.find({ id });
    } catch (error) {
      throw new AppError('Failed to fetch user', 500);
    }
  }

  async updateUserById(id, updateData) {
    try {
      return await User.findOneAndUpdate({ id }, updateData, { new: true });
    } catch (error) {
      throw new AppError('Failed to update user', 500);
    }
  }

  async deleteUserById(id) {
    try {
      return await User.findOneAndDelete({ id });
    } catch (error) {
      throw new AppError('Failed to delete user', 500);
    }
  }
}

module.exports = new UserService();
