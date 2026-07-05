/* eslint-disable class-methods-use-this */
/* eslint-disable no-param-reassign */
const express = require('express');
const jwt = require('jsonwebtoken');
const userService = require('../services/user.service');

const router = express.Router();

function verifyToken(req, res, next) {
  const bearerTokenHeader = req.headers.authorization;

  if (typeof bearerTokenHeader !== 'undefined') {
    const bearer = bearerTokenHeader.split(' ');
    const token = bearer[1];
    req.token = token; // Fix legacy bug where req.token wasn't set
    jwt.verify(token, userService.secretKey, (err, authData) => {
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

class UserController {
  async loginUser(req, res) {
    try {
      const { id, password } = req.body;
      const result = await userService.loginUser(id, password);
      if (!result) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      return res.json(result);
    } catch (error) {
      return res.status(400).send(error);
    }
  }

  async verifyProfile(req, res) {
    jwt.verify(req.token, userService.secretKey, (err, authData) => {
      if (err) {
        res.send({
          message: 'Token Expired! Please Regenerate and apply again, Thanks.',
        });
      } else {
        res.status(201).json({
          message: 'Tokken verified',
          authData,
        });
      }
    });
  }

  async loginUserWithDetails(req, res) {
    try {
      const { id, password } = req.body;
      const result = await userService.loginUserWithDetails(id, password);
      if (!result) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      return res.status(201).json(result);
    } catch (error) {
      return res.status(400).send(error);
    }
  }

  async createUsers(req, res) {
    try {
      const response = await userService.createUsers(req.body);
      return res.status(201).send({
        data: response,
        message: "User's data created successfully.",
        status: 'SUCCESS',
      });
    } catch (error) {
      return res.status(400).send(error);
    }
  }

  async getUserById(req, res) {
    try {
      const { id } = req.params;
      const getCitizenSingleData = await userService.getUserById(id);
      if (!getCitizenSingleData?.length) {
        return res.status(404).send({
          message: 'Failed to find this particular record in DB',
          status: 'FAILURE',
        });
      }
      return res.send({
        data: getCitizenSingleData,
        message: 'User data fetched successfully',
        status: 'SUCCESS',
      });
    } catch (error) {
      return res.status(400).send(error);
    }
  }

  async updateUserById(req, res) {
    try {
      const { id } = req.params;
      const updatedCitizen = await userService.updateUserById(id, req.body);
      if (!updatedCitizen) {
        return res.status(404).send('Citizen not found');
      }
      return res.status(202).send(updatedCitizen);
    } catch (error) {
      return res.status(400).send(error);
    }
  }

  async deleteUserById(req, res) {
    try {
      const { id } = req.params;
      const deleteCitizen = await userService.deleteUserById(id);
      if (!deleteCitizen) {
        return res.status(404).send('Citizen not found');
      }
      return res.status(202).send(`record with ${id} deleted successfully`);
    } catch (error) {
      return res.status(400).send(error);
    }
  }
}

const userController = new UserController();

// Map legacy routes
router.post('/userJwtLogin', userController.loginUser.bind(userController));
router.post(
  '/userProfileJwt',
  verifyToken,
  userController.verifyProfile.bind(userController),
);
router.post(
  '/jwtUserLogin',
  userController.loginUserWithDetails.bind(userController),
);
router.post(
  '/postData',
  verifyToken,
  userController.createUsers.bind(userController),
);
router.get('/getData/:id', userController.getUserById.bind(userController));
router.patch(
  '/updateData/:id',
  userController.updateUserById.bind(userController),
);
router.delete(
  '/removeData/:id',
  userController.deleteUserById.bind(userController),
);

userController.router = router;
userController.verifyTokenMiddleware = verifyToken;

module.exports = userController;
