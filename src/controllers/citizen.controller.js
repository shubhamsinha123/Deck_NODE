/* eslint-disable class-methods-use-this */
const express = require('express');
const citizenService = require('../services/citizen.service');
const STATUS = require('../constants/statusConstants');

const router = express.Router();

class CitizenController {
  async createCitizen(req, res) {
    try {
      const response = await citizenService.createCitizen(req.body);
      return res.status(201).send({
        data: response,
        message: 'Citizen created successfully',
        status: STATUS.SUCCESS,
      });
    } catch (error) {
      return res.status(400).send({
        data: null,
        message: error.message || 'Error creating citizen',
        status: STATUS.FAILURE,
      });
    }
  }

  async getAllCitizens(req, res) {
    try {
      const response = await citizenService.getAllCitizens();
      return res.status(200).send({
        data: response,
        message: 'Citizens fetched successfully',
        status: STATUS.SUCCESS,
      });
    } catch (error) {
      return res.status(400).send({
        data: null,
        message: error.message || 'Error fetching citizens',
        status: STATUS.FAILURE,
      });
    }
  }

  async getCitizenById(req, res) {
    try {
      const response = await citizenService.getCitizenById(req.params.userId);
      if (!response) {
        return res.status(404).send({
          data: null,
          message: `Citizen with ID '${req.params.userId}' not found`,
          status: STATUS.NOT_FOUND,
        });
      }
      return res.status(200).send({
        data: response,
        message: 'Citizen fetched successfully',
        status: STATUS.SUCCESS,
      });
    } catch (error) {
      return res.status(400).send({
        data: null,
        message: error.message || 'Error fetching citizen',
        status: STATUS.FAILURE,
      });
    }
  }

  async updateCitizenById(req, res) {
    try {
      const updatedCitizen = await citizenService.updateCitizenById(
        req.params.userId,
        req.body,
      );
      if (!updatedCitizen) {
        return res.status(404).send({
          data: null,
          message: `Citizen with ID '${req.params.userId}' not found`,
          status: STATUS.NOT_FOUND,
        });
      }
      return res.status(200).send({
        data: updatedCitizen,
        message: `Citizen '${req.params.userId}' updated successfully`,
        status: STATUS.SUCCESS,
      });
    } catch (error) {
      return res.status(400).send({
        data: null,
        message: error.message || 'Error updating citizen',
        status: STATUS.FAILURE,
      });
    }
  }

  async deleteCitizenById(req, res) {
    try {
      const deletedCitizen = await citizenService.deleteCitizenById(req.params.userId);
      if (!deletedCitizen) {
        return res.status(404).send({
          data: null,
          message: `Citizen with ID '${req.params.userId}' not found`,
          status: STATUS.NOT_FOUND,
        });
      }
      return res.status(200).send({
        data: deletedCitizen,
        message: `Citizen '${req.params.userId}' deleted successfully`,
        status: STATUS.SUCCESS,
      });
    } catch (error) {
      return res.status(400).send({
        data: null,
        message: error.message || 'Error deleting citizen',
        status: STATUS.FAILURE,
      });
    }
  }
}

const citizenController = new CitizenController();

router.post('/api/v1/citizens', citizenController.createCitizen.bind(citizenController));
router.get('/api/v1/citizens', citizenController.getAllCitizens.bind(citizenController));
router.get('/api/v1/citizens/:userId', citizenController.getCitizenById.bind(citizenController));
router.patch('/api/v1/citizens/:userId', citizenController.updateCitizenById.bind(citizenController));
router.delete('/api/v1/citizens/:userId', citizenController.deleteCitizenById.bind(citizenController));

citizenController.router = router;

module.exports = citizenController;
