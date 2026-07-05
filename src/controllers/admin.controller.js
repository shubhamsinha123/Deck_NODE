/* eslint-disable class-methods-use-this */
/* eslint-disable consistent-return */
const express = require('express');
const jwt = require('jsonwebtoken');
const adminService = require('../services/admin.service');

const router = express.Router();

function verifyToken(req, res, next) {
  const bearerTokenHeader = req.headers.authorization;

  if (typeof bearerTokenHeader !== 'undefined') {
    const bearer = bearerTokenHeader.split(' ');
    const token = bearer[1];
    jwt.verify(token, adminService.secretKey, (err, authData) => {
      if (err) {
        res.status(403).send({ result: 'Token is Invalid or Expired' });
      } else {
        req.user = authData;
        next();
      }
    });
  } else {
    res.status(403).send({
      result: 'Token is Invalid or Not Defined',
    });
  }
}

class AdminController {
  async getAllAdmins(req, res) {
    try {
      const admins = await adminService.getAllAdmins();
      return res.send(admins);
    } catch (error) {
      return res.status(400).send(error);
    }
  }

  async getAdminByMID(req, res) {
    try {
      const adminData = await adminService.getAdminByMID(req.params.id);
      return res.send(adminData);
    } catch (error) {
      return res.status(400).send(error);
    }
  }

  async createAdmin(req, res) {
    try {
      const postBatchResponseData = await adminService.createAdmin(req.body);
      return res.status(201).send({
        postBatchResponseData,
        message: 'Admin record created successfully.',
        status: 'SUCCESS',
      });
    } catch (error) {
      return res.status(400).send({
        message: 'Failed to create admin record.',
        status: 'FAILURE',
      });
    }
  }

  async updateAdminByMID(req, res) {
    try {
      const updatedAdmin = await adminService.updateAdminByMID(
        req.params.id,
        req.body,
      );
      if (!updatedAdmin) {
        return res.status(404).send('Admin not found');
      }
      return res.status(202).send(updatedAdmin);
    } catch (error) {
      return res.status(400).send(error);
    }
  }

  async deleteAdminByMID(req, res) {
    try {
      const deletedAdmin = await adminService.deleteAdminByMID(req.params.id);
      if (!deletedAdmin) {
        return res.status(404).send('Admin not found');
      }
      return res
        .status(202)
        .send(`Data with ${req.params.id} deleted successfully`);
    } catch (error) {
      return res.status(400).send(error);
    }
  }

  async deleteAdminsBulk(req, res) {
    try {
      const response = await adminService.deleteAdminsBulk(req.body);
      return res.status(202).send(response);
    } catch (error) {
      return res.status(400).send(error);
    }
  }

  async loginAdmin(req, res) {
    try {
      const { MID, MPIN } = req.body;
      const result = await adminService.loginAdmin(MID, MPIN);

      if (!result) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      return res.status(201).json(result);
    } catch (error) {
      return res.status(400).send(error);
    }
  }

  async getUsersData(req, res) {
    try {
      const userData = await adminService.getUsersData();
      return res.send(userData);
    } catch (error) {
      return res.status(400).send(error);
    }
  }
}

const adminController = new AdminController();

// Map routes
router.post('/adminPost', adminController.createAdmin.bind(adminController));
router.post('/adminJwtLogin', adminController.loginAdmin.bind(adminController));
router.get(
  '/getData',
  verifyToken,
  adminController.getUsersData.bind(adminController),
);
router.get(
  '/adminGet',
  verifyToken,
  adminController.getAllAdmins.bind(adminController),
);
router.get(
  '/adminGet/:id',
  adminController.getAdminByMID.bind(adminController),
);
router.patch(
  '/adminUpdate/:id',
  adminController.updateAdminByMID.bind(adminController),
);
router.delete(
  '/removeAdmin/bulk',
  adminController.deleteAdminsBulk.bind(adminController),
);
router.delete(
  '/removeAdmin/:id',
  adminController.deleteAdminByMID.bind(adminController),
);

adminController.router = router;

module.exports = adminController;
