/* eslint-disable class-methods-use-this */
const express = require('express');
const citizenService = require('../services/citizen.service');

const router = express.Router();

class CitizenController {
  async createCitizen(req, res) {
    try {
      const response = await citizenService.createCitizen(req.body);
      return res.status(200).send(response);
    } catch (error) {
      return res.status(400).send(error);
    }
  }

  async getAllCitizens(req, res) {
    try {
      const response = await citizenService.getAllCitizens();
      return res.status(201).send(response);
    } catch (error) {
      return res.status(400).send(error);
    }
  }

  async getCitizenById(req, res) {
    try {
      const response = await citizenService.getCitizenById(req.params.id);
      return res.status(201).send(response);
    } catch (error) {
      return res.status(400).send(error);
    }
  }

  async updateCitizenById(req, res) {
    try {
      const updatedCitizen = await citizenService.updateCitizenById(
        req.params.id,
        req.body,
      );
      if (!updatedCitizen) {
        return res.status(404).send('Citizen not found');
      }
      return res.status(200).send(updatedCitizen);
    } catch (error) {
      return res.status(400).send(error);
    }
  }

  async deleteCitizenById(req, res) {
    try {
      const deletedCitizen = await citizenService.deleteCitizenById(
        req.params.id,
      );
      if (!deletedCitizen) {
        return res.status(404).send('Citizen not found');
      }
      return res.status(200).send(deletedCitizen);
    } catch (error) {
      return res.status(400).send(error);
    }
  }
}

const citizenController = new CitizenController();

// Map legacy routes
router.post(
  '/postData',
  citizenController.createCitizen.bind(citizenController),
);
router.get(
  '/getData',
  citizenController.getAllCitizens.bind(citizenController),
);
router.get(
  '/getData/:id',
  citizenController.getCitizenById.bind(citizenController),
);
router.patch(
  '/updateData/:id',
  citizenController.updateCitizenById.bind(citizenController),
);
router.delete(
  '/removeData/:id',
  citizenController.deleteCitizenById.bind(citizenController),
);

citizenController.router = router;

module.exports = citizenController;
