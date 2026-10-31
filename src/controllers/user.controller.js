/* eslint-disable class-methods-use-this */
const express = require('express');
const userService = require('../services/user.service');
const { verifyToken, requireRole } = require('../middleware/auth.middleware');
const STATUS = require('../constants/statusConstants');

const router = express.Router();

class UserController {
  // ─── OAuth 2.0 Auth Endpoints ─────────────────────────────────────────────────

  /**
   * POST /api/v1/auth/user-sessions
   * Login with id + password → returns access_token + refresh_token
   */
  async loginUser(req, res) {
    try {
      const { id, password } = req.body;
      if (!id || !password) {
        return res.status(400).json({
          data: null,
          message: 'id and password are required',
          status: STATUS.FAILURE,
        });
      }
      const result = await userService.loginUser(id, password);
      if (!result) {
        return res.status(401).json({
          data: null,
          message: 'Invalid credentials',
          status: STATUS.UNAUTHORIZED,
        });
      }
      return res.status(200).json({
        data: result,
        message: 'Login successful',
        status: STATUS.SUCCESS,
      });
    } catch (error) {
      return res.status(400).send({
        data: null,
        message: error.message || 'Login failed',
        status: STATUS.FAILURE,
      });
    }
  }

  /**
   * POST /api/v1/auth/user-sessions/login
   * Login and return user details alongside tokens
   */
  async loginUserWithDetails(req, res) {
    try {
      const { id, password } = req.body;
      if (!id || !password) {
        return res.status(400).json({
          data: null,
          message: 'id and password are required',
          status: STATUS.FAILURE,
        });
      }
      const result = await userService.loginUserWithDetails(id, password);
      if (!result) {
        return res.status(401).json({
          data: null,
          message: 'Invalid credentials',
          status: STATUS.UNAUTHORIZED,
        });
      }
      return res.status(200).json({
        data: result,
        message: 'Login successful',
        status: STATUS.SUCCESS,
      });
    } catch (error) {
      return res.status(400).send({
        data: null,
        message: error.message || 'Login failed',
        status: STATUS.FAILURE,
      });
    }
  }

  /**
   * POST /api/v1/auth/user-sessions/refresh
   * Body: { refresh_token }
   * Returns a new access_token (+ rotated refresh_token)
   */
  async refreshToken(req, res) {
    try {
      // eslint-disable-next-line camelcase
      const { refresh_token } = req.body;
      // eslint-disable-next-line camelcase
      if (!refresh_token) {
        return res.status(400).json({
          data: null,
          message: 'refresh_token is required',
          status: STATUS.FAILURE,
        });
      }
      const result = await userService.refreshAccessToken(refresh_token);
      return res.status(200).json({
        data: result,
        message: 'Token refreshed successfully',
        status: STATUS.SUCCESS,
      });
    } catch (error) {
      const status = error.statusCode || 401;
      return res.status(status).json({
        data: null,
        message: error.message,
        status: STATUS.FAILURE,
      });
    }
  }

  /**
   * POST /api/v1/auth/user-sessions/revoke
   * Body: { refresh_token }
   * Invalidates the refresh token (logout)
   */
  async revokeToken(req, res) {
    try {
      // eslint-disable-next-line camelcase
      const { refresh_token } = req.body;
      // eslint-disable-next-line camelcase
      if (!refresh_token) {
        return res.status(400).json({
          data: null,
          message: 'refresh_token is required',
          status: STATUS.FAILURE,
        });
      }
      await userService.revokeToken(refresh_token);
      return res.status(200).json({
        data: null,
        message: 'Token revoked successfully. You are logged out.',
        status: STATUS.SUCCESS,
      });
    } catch (error) {
      const status = error.statusCode || 400;
      return res.status(status).json({
        data: null,
        message: error.message,
        status: STATUS.FAILURE,
      });
    }
  }

  // ─── User CRUD ────────────────────────────────────────────────────────────────

  async createUsers(req, res) {
    try {
      const response = await userService.createUsers(req.body);
      return res.status(201).send({
        data: response,
        message: "User's data created successfully",
        status: STATUS.SUCCESS,
      });
    } catch (error) {
      return res.status(400).send({
        data: null,
        message: error.message || 'Error creating users',
        status: STATUS.FAILURE,
      });
    }
  }

  async getUserById(req, res) {
    try {
      const { userId } = req.params;
      const userData = await userService.getUserById(userId);
      if (!userData?.length) {
        return res.status(404).send({
          data: null,
          message: `User with ID '${userId}' not found`,
          status: STATUS.NOT_FOUND,
        });
      }
      return res.status(200).send({
        data: userData,
        message: 'User fetched successfully',
        status: STATUS.SUCCESS,
      });
    } catch (error) {
      return res.status(400).send({
        data: null,
        message: error.message || 'Error fetching user',
        status: STATUS.FAILURE,
      });
    }
  }

  async updateUserById(req, res) {
    try {
      const userId = req.params.userId || req.params.id;
      if (!userId) {
        return res.status(400).send({
          data: null,
          message: 'User ID is required',
          status: STATUS.FAILURE,
        });
      }

      let updatePayload;
      if (Array.isArray(req.body)) {
        updatePayload = [...req.body];
        const avatarOperation = [...updatePayload].reverse().find((operation) => (
          operation
          && typeof operation === 'object'
          && typeof operation.path === 'string'
          && operation.path.toLowerCase() === '/avatar'
          && ['add', 'replace', 'remove'].includes(
            typeof operation.op === 'string' ? operation.op.toLowerCase() : '',
          )
        ));

        if (avatarOperation) {
          const removesAvatar = avatarOperation.op.toLowerCase() === 'remove';
          const avatar = avatarOperation.value;
          if (!removesAvatar && typeof avatar === 'string' && avatar.length > 150000) {
            return res.status(400).send({
              data: null,
              message: 'Avatar payload exceeds safe free-tier limit (max ~100 KB)',
              status: STATUS.FAILURE,
            });
          }

          let avatarType;
          if (removesAvatar || !avatar) {
            avatarType = 'initials';
          } else if (typeof avatar === 'string' && avatar.startsWith('data:image')) {
            avatarType = 'image';
          } else if (typeof avatar === 'string' && avatar.startsWith('http')) {
            avatarType = 'vector';
          }

          if (avatarType) {
            updatePayload.push({ op: 'add', path: '/avatarType', value: avatarType });
          }
        }
      } else {
        const { avatar, avatarSeed, ...restOfBody } = req.body;
        updatePayload = { ...restOfBody };

        if (avatar !== undefined) {
          if (typeof avatar === 'string' && avatar.length > 150000) {
            return res.status(400).send({
              data: null,
              message: 'Avatar payload exceeds safe free-tier limit (max ~100 KB)',
              status: STATUS.FAILURE,
            });
          }
          updatePayload.avatar = avatar;
          if (!avatar) {
            updatePayload.avatarType = 'initials';
          } else if (typeof avatar === 'string' && avatar.startsWith('data:image')) {
            updatePayload.avatarType = 'image';
          } else if (typeof avatar === 'string' && avatar.startsWith('http')) {
            updatePayload.avatarType = 'vector';
          }
        }
        if (avatarSeed !== undefined) {
          updatePayload.avatarSeed = avatarSeed;
        }
      }

      const updatedUser = await userService.updateUserById(userId, updatePayload);
      if (!updatedUser) {
        return res.status(404).send({
          data: null,
          message: `User with ID '${userId}' not found`,
          status: STATUS.NOT_FOUND,
        });
      }
      return res.status(200).send({
        data: updatedUser,
        message: `User '${userId}' updated successfully`,
        status: STATUS.SUCCESS,
      });
    } catch (error) {
      return res.status(error.statusCode || 400).send({
        data: null,
        message: error.message || 'Error updating user',
        status: STATUS.FAILURE,
      });
    }
  }

  async deleteUserById(req, res) {
    try {
      const { userId } = req.params;
      const deletedUser = await userService.deleteUserById(userId);
      if (!deletedUser) {
        return res.status(404).send({
          data: null,
          message: `User with ID '${userId}' not found`,
          status: STATUS.NOT_FOUND,
        });
      }
      return res.status(200).send({
        data: deletedUser,
        message: `User '${userId}' deleted successfully`,
        status: STATUS.SUCCESS,
      });
    } catch (error) {
      return res.status(400).send({
        data: null,
        message: error.message || 'Error deleting user',
        status: STATUS.FAILURE,
      });
    }
  }

  async checkUserExists(req, res) {
    try {
      const { userId } = req.params;
      if (!userId) {
        return res.status(400).json({
          exists: false,
          hasPassword: false,
          message: 'userId parameter is required',
          status: STATUS.FAILURE,
        });
      }
      const result = await userService.checkUserExists(userId);
      return res.status(200).json({
        exists: result.exists,
        hasPassword: result.hasPassword,
        message: 'User status checked successfully',
        status: STATUS.SUCCESS,
      });
    } catch (error) {
      return res.status(400).send({
        exists: false,
        hasPassword: false,
        data: null,
        message: error.message || 'Error checking user status',
        status: STATUS.FAILURE,
      });
    }
  }
}

const userController = new UserController();

// ─── Public Routes (no auth) ─────────────────────────────────────────────────
router.get('/v1/auth/check-user/:userId', userController.checkUserExists.bind(userController));
router.get('/api/v1/auth/check-user/:userId', userController.checkUserExists.bind(userController));
router.post('/api/v1/auth/user-sessions', userController.loginUser.bind(userController));
router.post('/api/v1/auth/user-sessions/login', userController.loginUserWithDetails.bind(userController));
router.post('/api/v1/auth/user-sessions/refresh', userController.refreshToken.bind(userController));
router.post('/api/v1/auth/user-sessions/revoke', userController.revokeToken.bind(userController));

router.post('/api/v1/users', verifyToken, requireRole('admin', 'superadmin'), userController.createUsers.bind(userController));
router.patch('/api/v1/users/:userId', verifyToken, requireRole('admin', 'superadmin', 'user', 'superuser'), userController.updateUserById.bind(userController));

// ─── User Routes ─────────────────────────────────────────────────────────────
router.get('/api/v1/users/:userId', verifyToken, requireRole('user', 'superuser', 'admin', 'superadmin'), userController.getUserById.bind(userController));
router.delete('/api/v1/users/:userId', verifyToken, requireRole('admin', 'superadmin'), userController.deleteUserById.bind(userController));

userController.router = router;

module.exports = userController;
