/* eslint-disable class-methods-use-this */
/* eslint-disable consistent-return */
const express = require('express');
const adminService = require('../services/admin.service');
const { verifyToken } = require('../middleware/auth.middleware');
const STATUS = require('../constants/statusConstants');

const router = express.Router();

class AdminController {
  // ─── Admin CRUD ─────────────────────────────────────────────────────────────

  async getAllAdmins(req, res) {
    try {
      const admins = await adminService.getAllAdmins();
      return res.status(200).send({
        data: admins,
        message: 'Data fetched successfully',
        status: STATUS.SUCCESS,
      });
    } catch (error) {
      const status = error.statusCode || 400;
      return res.status(status).send({ message: error.message, status: STATUS.FAILURE });
    }
  }

  async getAdminByMID(req, res) {
    try {
      const { MID } = req.params;
      const adminData = await adminService.getAdminByMID(MID);
      return res.status(200).send({ data: adminData, status: STATUS.SUCCESS });
    } catch (error) {
      const status = error.statusCode || 400;
      return res.status(status).send({ message: error.message, status: STATUS.FAILURE });
    }
  }

  async createAdmin(req, res) {
    try {
      const postBatchResponseData = await adminService.createAdmin(req.body);
      return res.status(201).send({
        postBatchResponseData,
        message: 'Admin record created successfully.',
        status: STATUS.SUCCESS,
      });
    } catch (error) {
      return res.status(400).send({
        message: 'Failed to create admin record.',
        status: STATUS.FAILURE,
      });
    }
  }

  async updateAdminByMID(req, res) {
    try {
      const updatedAdmin = await adminService.updateAdminByMID(
        req.params.MID,
        req.body,
      );
      if (!updatedAdmin) {
        return res.status(404).send({
          message: `Data with ${req.params.MID} not found`,
          status: STATUS.FAILURE,
        });
      }
      return res.status(202).send({
        data: updatedAdmin,
        message: `Data with ${req.params.MID} updated successfully`,
        status: STATUS.SUCCESS,
      });
    } catch (error) {
      const status = error.statusCode || 400;
      return res.status(status).send({ message: error.message, status: STATUS.FAILURE });
    }
  }

  async deleteAdminByMID(req, res) {
    try {
      const deletedAdmin = await adminService.deleteAdminByMID(req.params.MID);
      if (!deletedAdmin) {
        return res.status(404).send({
          message: `Data with ${req.params.MID} not found or already deleted`,
          status: STATUS.FAILURE,
        });
      }
      return res.status(202).send({
        data: deletedAdmin,
        message: `Data with ${req.params.MID} deleted successfully`,
        status: STATUS.SUCCESS,
      });
    } catch (error) {
      const status = error.statusCode || 400;
      return res.status(status).send({ message: error.message, status: STATUS.FAILURE });
    }
  }

  async deleteAdminsBulk(req, res) {
    try {
      const response = await adminService.deleteAdminsBulk(req.body);
      return res.status(202).send({
        data: response,
        message: 'Whole ADMIN data has been deleted successfully',
        status: STATUS.SUCCESS,
      });
    } catch (error) {
      const status = error.statusCode || 400;
      return res.status(status).send({ message: error.message, status: STATUS.FAILURE });
    }
  }

  // ─── OAuth 2.0 Auth Endpoints ────────────────────────────────────────────────

  /**
   * POST /api/v1/auth/admin-sessions
   * Login with MID + MPIN → returns access_token + refresh_token
   */
  async loginAdmin(req, res) {
    try {
      const { MID, MPIN } = req.body;
      if (!MID || !MPIN) {
        return res.status(400).json({
          message: 'MID and MPIN are required',
          status: STATUS.FAILURE,
        });
      }
      const result = await adminService.loginAdmin(MID, MPIN);
      if (!result) {
        return res.status(401).json({
          message: 'Invalid credentials',
          status: STATUS.UNAUTHORIZED,
        });
      }
      return res.status(200).json({ ...result, status: STATUS.SUCCESS });
    } catch (error) {
      const status = error.statusCode || 400;
      return res.status(status).json({ message: error.message, status: 'FAILURE' });
    }
  }

  /**
   * POST /api/v1/auth/admin-sessions/refresh
   * Body: { refresh_token }
   * Returns a new access_token (+ rotated refresh_token)
   */
  async refreshToken(req, res) {
    try {
      const { refresh_token } = req.body;
      if (!refresh_token) {
        return res.status(400).json({
          message: 'refresh_token is required',
          status: STATUS.FAILURE,
        });
      }
      const result = await adminService.refreshAccessToken(refresh_token);
      return res.status(200).json({ ...result, status: STATUS.SUCCESS });
    } catch (error) {
      const status = error.statusCode || 401;
      return res.status(status).json({ message: error.message, status: 'FAILURE' });
    }
  }

  /**
   * POST /api/v1/auth/admin-sessions/revoke
   * Body: { refresh_token }
   * Invalidates the refresh token (logout)
   */
  async revokeToken(req, res) {
    try {
      const { refresh_token } = req.body;
      if (!refresh_token) {
        return res.status(400).json({
          message: 'refresh_token is required',
          status: STATUS.FAILURE,
        });
      }
      await adminService.revokeToken(refresh_token);
      return res.status(200).json({
        message: 'Token revoked successfully. You are logged out.',
        status: STATUS.SUCCESS,
      });
    } catch (error) {
      const status = error.statusCode || 400;
      return res.status(status).json({ message: error.message, status: STATUS.FAILURE });
    }
  }

  // ─── Users Data ──────────────────────────────────────────────────────────────

  async getUsersData(req, res) {
    try {
      const userData = await adminService.getUsersData();
      return res.status(200).send({ data: userData, status: STATUS.SUCCESS });
    } catch (error) {
      const status = error.statusCode || 400;
      return res.status(status).send({ message: error.message, status: STATUS.FAILURE });
    }
  }
}

const adminController = new AdminController();

// ─── Public Routes (no auth required) ────────────────────────────────────────
router.post('/api/v1/admins', adminController.createAdmin.bind(adminController));
router.post('/api/v1/auth/admin-sessions', adminController.loginAdmin.bind(adminController));
router.post('/api/v1/auth/admin-sessions/refresh', adminController.refreshToken.bind(adminController));
router.post('/api/v1/auth/admin-sessions/revoke', adminController.revokeToken.bind(adminController));

// ─── Protected Routes (OAuth 2.0 Bearer token required) ──────────────────────
router.get(
  '/api/v1/users-details',
  verifyToken,
  adminController.getUsersData.bind(adminController),
);
router.get(
  '/api/v1/admins',
  verifyToken,
  adminController.getAllAdmins.bind(adminController),
);
router.get(
  '/api/v1/admins/:MID',
  verifyToken,
  adminController.getAdminByMID.bind(adminController),
);
router.patch(
  '/api/v1/admins/:MID',
  verifyToken,
  adminController.updateAdminByMID.bind(adminController),
);
router.delete(
  '/api/v1/admins/bulk',
  verifyToken,
  adminController.deleteAdminsBulk.bind(adminController),
);
router.delete(
  '/api/v1/admins/:MID',
  verifyToken,
  adminController.deleteAdminByMID.bind(adminController),
);

adminController.router = router;

module.exports = adminController;
