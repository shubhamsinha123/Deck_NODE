/* eslint-disable class-methods-use-this, no-underscore-dangle */
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const OAuthToken = require('../models/OAuthToken');
const AppError = require('../exceptions/AppError');
const { applyJsonPatch } = require('../utils/jsonPatch');
const {
  JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET,
  JWT_ACCESS_EXPIRES_IN,
  JWT_REFRESH_EXPIRES_IN,
} = require('../config/environment');

// Legacy secret kept for backward compat with old verifyToken
const secretKey = crypto.randomBytes(32).toString('hex');

class UserService {
  constructor() {
    this.secretKey = secretKey;
  }

  // ─── OAuth 2.0 Token Methods ─────────────────────────────────────────────────

  /**
   * Login: validate credentials → issue access_token + refresh_token + user details
   */
  async loginUser(id, password) {
    const user = await User.findOne({ id });
    if (!user) return null;

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) return null;

    const tokens = await this._issueTokenPair(user);
    const userDetail = user.toObject ? user.toObject() : { ...(user._doc || user) };
    delete userDetail.password;

    return {
      ...tokens,
      userData: {
        id: user.id,
        name: user.name,
      },
    };
  }

  /**
   * Login with full user details returned alongside tokens
   */

  async loginUserWithDetails(id, password) {
    return this.loginUser(id, password);
  }

  /**
   * Refresh: validate refresh token → issue new access_token + rotated refresh_token
   */
  async refreshAccessToken(refreshToken) {
    let payload;
    try {
      payload = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    } catch {
      throw new AppError('Refresh token is invalid or expired', 401);
    }

    const storedToken = await OAuthToken.findOne({ refreshToken });
    if (!storedToken || storedToken.revoked) {
      throw new AppError('Refresh token has been revoked', 401);
    }

    const user = await User.findById(payload.sub);
    if (!user) throw new AppError('User not found', 404);

    storedToken.revoked = true;
    await storedToken.save();

    return this._issueTokenPair(user);
  }

  /**
   * Revoke: mark a refresh token as revoked (logout)
   */
  async revokeToken(refreshToken) {
    const storedToken = await OAuthToken.findOne({ refreshToken });
    if (!storedToken) throw new AppError('Token not found', 404);
    storedToken.revoked = true;
    await storedToken.save();
    return true;
  }

  /**
   * Internal helper: sign JWT pair and persist refresh token in DB
   */
  async _issueTokenPair(user) {
    const rolePermissions = {
      superuser: ['read', 'write', 'delete'],
      user: ['read'],
    };
    const roleLevels = { superuser: 2, user: 1 };
    const roleName = user.role || 'user';

    const accessToken = jwt.sign(
      {
        sub: user._id.toString(),
        id: user.id,
        role: {
          name: roleName,
          permissions: rolePermissions[roleName] ?? ['read'],
          level: roleLevels[roleName] ?? 1,
        },
        issuer: 'deck-api',
        tokenType: 'access',
      },
      JWT_ACCESS_SECRET,
      { expiresIn: JWT_ACCESS_EXPIRES_IN },
    );

    const refreshToken = jwt.sign(
      { sub: user._id.toString(), jti: crypto.randomUUID() },
      JWT_REFRESH_SECRET,
      { expiresIn: JWT_REFRESH_EXPIRES_IN },
    );

    await OAuthToken.create({
      ownerId: user._id,
      ownerType: 'user',
      identifier: user.id,
      refreshToken,
      expiresAt: new Date(Date.now() + JWT_REFRESH_EXPIRES_IN * 1000),
    });

    return {
      token_type: 'Bearer',
      access_token: accessToken,
      expires_in: JWT_ACCESS_EXPIRES_IN,
      refresh_token: refreshToken,
    };
  }

  // ─── User CRUD ────────────────────────────────────────────────────────────────

  async createUsers(usersData) {
    try {
      const items = Array.isArray(usersData) ? usersData : [usersData];
      const idsToCheck = items.map((item) => item?.id).filter(Boolean);

      if (idsToCheck.length > 0) {
        const existingUsers = await User.find({ id: { $in: idsToCheck } });
        if (existingUsers && existingUsers.length > 0) {
          const existingIds = existingUsers.map((u) => u.id).join(', ');
          throw new AppError(`User with ID '${existingIds}' already exists`, 400);
        }
      }

      const hashPassword = async (record) => {
        if (!record.password) return record;
        const hashed = await bcrypt.hash(record.password, 10);
        return { ...record, password: hashed, hasPassword: true };
      };

      const sanitizeUser = (u) => {
        const userObj = u.toObject ? u.toObject() : { ...(u._doc || u) };
        delete userObj.password;
        return userObj;
      };

      if (Array.isArray(usersData)) {
        const hashed = await Promise.all(usersData.map(hashPassword));
        const createdUsers = await User.insertMany(hashed);
        return createdUsers.map(sanitizeUser);
      }
      const hashed = await hashPassword(usersData);
      const createdUser = await User.create(hashed);
      return sanitizeUser(createdUser);
    } catch (error) {
      if (error instanceof AppError) throw error;
      if (error.code === 11000) {
        throw new AppError('User with this ID already exists', 400);
      }
      throw new AppError('Failed to create user records', 500);
    }
  }

  async getAllUsers() {
    try {
      const query = User.find({});
      let result;
      if (query && typeof query.select === 'function') {
        result = await query.select('-password');
      } else {
        result = await query;
      }
      if (Array.isArray(result)) {
        result.sort((a, b) => {
          const numA = parseInt(a.id, 10);
          const numB = parseInt(b.id, 10);
          if (!Number.isNaN(numA) && !Number.isNaN(numB)) {
            return numA - numB;
          }
          return (a.id || '').localeCompare(b.id || '');
        });
        return result.map((doc) => {
          const obj = doc.toObject ? doc.toObject() : { ...(doc._doc || doc) };
          delete obj.password;
          return obj;
        });
      }
      return result;
    } catch (error) {
      throw new AppError('Failed to fetch users', 500);
    }
  }

  async getUserById(id) {
    try {
      const query = User.find({ id });
      let result;
      if (query && typeof query.select === 'function') {
        result = await query.select('-password');
      } else {
        result = await query;
      }
      if (Array.isArray(result)) {
        return result.map((doc) => {
          const obj = doc.toObject ? doc.toObject() : { ...(doc._doc || doc) };
          delete obj.password;
          return obj;
        });
      }
      return result;
    } catch (error) {
      throw new AppError('Failed to fetch user', 500);
    }
  }

  async updateUserById(id, updateData) {
    if (!updateData || typeof updateData !== 'object') {
      throw new AppError('Invalid update payload. Expected an object or a JSON patch array', 400);
    }

    try {
      const existingUser = await User.findOne({ id });
      if (!existingUser) return null;

      const userObj = existingUser.toObject ? existingUser.toObject() : { ...existingUser };
      let patchedObj;

      if (Array.isArray(updateData)) {
        if (updateData.length === 0) {
          throw new AppError(
            'Invalid JSON patch format. Expected a non-empty array of patch operations: [{ op, path, value }]',
            400,
          );
        }
        const { target } = applyJsonPatch(userObj, updateData);
        patchedObj = target;
      } else {
        if (Object.keys(updateData).length === 0) {
          throw new AppError('Update payload cannot be empty', 400);
        }
        patchedObj = { ...userObj };
        Object.keys(updateData).forEach((key) => {
          if (key === 'properties' && typeof updateData.properties === 'object' && updateData.properties !== null) {
            patchedObj.properties = {
              ...(patchedObj.properties || {}),
              ...updateData.properties,
            };
          } else {
            patchedObj[key] = updateData[key];
          }
        });
      }

      if (patchedObj.playlists && !patchedObj.musicList) {
        patchedObj.musicList = patchedObj.playlists;
      } else if (patchedObj.musicList && !patchedObj.playlists) {
        patchedObj.playlists = patchedObj.musicList;
      }

      if (patchedObj.password && patchedObj.password !== existingUser.password) {
        patchedObj.password = await bcrypt.hash(patchedObj.password, 10);
        patchedObj.hasPassword = true;
      }

      delete patchedObj.__v;
      patchedObj._id = existingUser._id;

      const replaceQuery = User.findOneAndReplace(
        { id },
        patchedObj,
        { new: true, runValidators: true },
      );
      let result;
      if (replaceQuery && typeof replaceQuery.select === 'function') {
        result = await replaceQuery.select('-password');
      } else {
        result = await replaceQuery;
      }
      if (result) {
        const resultObj = result.toObject ? result.toObject() : { ...(result._doc || result) };
        delete resultObj.password;
        return resultObj;
      }
      return result;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(error.message || 'Failed to update user', 500);
    }
  }

  async checkUserExists(id) {
    try {
      const user = await User.findOne({ id });

      if (!user) {
        return {
          exists: false,
          hasPassword: false,
        };
      }
      const hasPassword = Boolean(user.hasPassword || (user.password && user.password.length > 0));
      return {
        exists: true,
        hasPassword,
      };
    } catch (error) {
      throw new AppError('Failed to check user status', 500);
    }
  }

  async deleteUserById(id) {
    try {
      const query = User.findOneAndDelete({ id });
      let result;
      if (query && typeof query.select === 'function') {
        result = await query.select('-password');
      } else {
        result = await query;
      }
      if (result) {
        const resultObj = result.toObject ? result.toObject() : { ...(result._doc || result) };
        delete resultObj.password;
        return resultObj;
      }
      return result;
    } catch (error) {
      throw new AppError('Failed to delete user', 500);
    }
  }
}

module.exports = new UserService();
