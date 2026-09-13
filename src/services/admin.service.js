/* eslint-disable class-methods-use-this */
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const User = require('../models/User');
const OAuthToken = require('../models/OAuthToken');
const AppError = require('../exceptions/AppError');
const {
  JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET,
  JWT_ACCESS_EXPIRES_IN,
  JWT_REFRESH_EXPIRES_IN,
} = require('../config/environment');

// Fallback secret for legacy verifyToken (kept for backward compat)
const secretKey = crypto.randomBytes(32).toString('hex');

class AdminService {
  constructor() {
    this.secretKey = secretKey;
  }

  // ─── Admin CRUD ──────────────────────────────────────────────────────────────

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
      const admin = await Admin.findOne({ MID: mid });
      if (!admin) {
        throw new AppError(`Admin with MID '${mid}' not found`, 404);
      }
      return admin;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to fetch admin by ID', 500);
    }
  }

  async createAdmin(adminData) {
    try {
      const hashMPIN = async (record) => {
        const hashed = await bcrypt.hash(record.MPIN, 10);
        return { ...record, MPIN: hashed };
      };

      if (Array.isArray(adminData)) {
        const hashed = await Promise.all(adminData.map(hashMPIN));
        return await Admin.insertMany(hashed);
      }
      const hashed = await hashMPIN(adminData);
      return await Admin.create(hashed);
    } catch (error) {
      throw new AppError('Failed to create admin record', 500);
    }
  }

  async updateAdminByMID(mid, updateData) {
    try {
      const data = { ...updateData };
      if (data.MPIN) {
        data.MPIN = await bcrypt.hash(data.MPIN, 10);
      }
      return await Admin.findOneAndUpdate({ MID: mid }, data, {
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

  // ─── OAuth 2.0 Token Methods ─────────────────────────────────────────────────

  /**
   * Login: validate credentials → issue access_token + refresh_token
   */
  async loginAdmin(MID, MPIN) {
    const admin = await Admin.findOne({ MID });
    if (!admin) return null;

    const mpinMatch = await bcrypt.compare(MPIN, admin.MPIN);
    if (!mpinMatch) return null;

    return this._issueTokenPair(admin);
  }

  /**
   * Refresh: validate refresh token → issue new access_token (and rotate refresh_token)
   */
  async refreshAccessToken(refreshToken) {
    // 1. Verify JWT signature
    let payload;
    try {
      payload = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    } catch {
      throw new AppError('Refresh token is invalid or expired', 401);
    }

    // 2. Check DB — must exist and not revoked
    const storedToken = await OAuthToken.findOne({ refreshToken });
    if (!storedToken || storedToken.revoked) {
      throw new AppError('Refresh token has been revoked', 401);
    }

    // 3. Load admin
    const admin = await Admin.findById(payload.sub);
    if (!admin) throw new AppError('Admin not found', 404);

    // 4. Revoke old token and issue a new pair (rotation)
    storedToken.revoked = true;
    await storedToken.save();

    return this._issueTokenPair(admin);
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
  async _issueTokenPair(admin) {
    const rolePermissions = {
      superadmin: ['read', 'write', 'delete', 'manage'],
      admin: ['read', 'write', 'delete'],
      user: ['read'],
    };
    const roleLevels = { superadmin: 3, admin: 2, user: 1 };
    const roleName = admin.role || 'admin';

    const accessToken = jwt.sign(
      {
        sub: admin._id.toString(),
        MID: admin.MID,
        name: admin.name,
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
      { sub: admin._id.toString(), jti: crypto.randomUUID() },
      JWT_REFRESH_SECRET,
      { expiresIn: JWT_REFRESH_EXPIRES_IN },
    );

    // Persist refresh token
    await OAuthToken.create({
      ownerId: admin._id,
      ownerType: 'admin',
      identifier: admin.MID,
      refreshToken,
      expiresAt: new Date(Date.now() + JWT_REFRESH_EXPIRES_IN * 1000),
    });

    return {
      name: admin.name,
      token_type: 'Bearer',
      access_token: accessToken,
      expires_in: JWT_ACCESS_EXPIRES_IN,
      refresh_token: refreshToken,
    };
  }

  // ─── Users Data ───────────────────────────────────────────────────────────────

  async getUsersData() {
    try {
      const query = User.find({});
      let userData;
      if (query && typeof query.select === 'function') {
        userData = await query.select('-password');
      } else {
        userData = await query;
      }
      if (Array.isArray(userData)) {
        userData.sort((a, b) => {
          const numA = parseInt(a.id, 10);
          const numB = parseInt(b.id, 10);

          if (!Number.isNaN(numA) && !Number.isNaN(numB)) {
            return numA - numB;
          }
          return (a.id || '').localeCompare(b.id || '');
        });
        return userData.map((u) => {
          const obj = u.toObject ? u.toObject() : { ...(u._doc || u) };
          delete obj.password;
          return obj;
        });
      }
      return userData;
    } catch (error) {
      throw new AppError('Failed to fetch user data', 500);
    }
  }
}

module.exports = new AdminService();
