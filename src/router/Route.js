/* eslint-disable linebreak-style */
/* eslint-disable consistent-return */
const express = require('express');

const router = express.Router();
const citizenSchema = require('../model/citizenSchema');
// router.post("/post", async (req, res) => {
//   try {
//     const addCitizenShip = new citizenSchema(req.body);
//     const postResponseData = await addCitizenShip.save();
//     res.send(postResponseData);
//   } catch (e) {
//     res.status(400).send(e);
//   }
// });
// batch post
router.post('/postData', async (req, res) => {
  try {
    const citizenDataArray = req.body;
    const postBatchResponseData = await citizenSchema.insertMany(citizenDataArray);
    res.send(postBatchResponseData);
  } catch (e) {
    res.status(400).send(e);
  }
});

router.get('/getData', async (req, res) => {
  try {
    const getCitizenShip = await citizenSchema.find({});
    // const responseData = await addCitizenShip.save();
    // res.send(responseData);
    getCitizenShip.sort((a, b) => {
      const numA = parseInt(a.id, 10);
      const numB = parseInt(b.id, 10);

      if (!Number.isNaN(numA) && !Number.isNaN(numB)) {
        return numA - numB; // Numerical sorting
      }
      return a.id.localeCompare(b.id); // Lexicographic sorting
    });
    res.status(201).send(getCitizenShip);
  } catch (e) {
    res.status(400).send(e);
  }
});

// Get particular data from API
router.get('/getData/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const getCitizenSingleData = await citizenSchema.find({ id });
    // const responseData = await addCitizenShip.save();
    // res.send(responseData);
    res.status(201).send(getCitizenSingleData);
  } catch (e) {
    res.status(400).send(e);
  }
});
// to update the API
router.patch('/updateData/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updatedCitizen = await citizenSchema.findOneAndUpdate(
      { id },
      req.body,
      {
        new: true,
      },
    );
    if (!updatedCitizen) {
      return res.status(404).send('Citizen not found');
    }

    res.send(updatedCitizen);
  } catch (e) {
    res.status(400).send(e);
  }
});
// to update the API
router.delete('/removeData/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleteCitizen = await citizenSchema.findOneAndDelete({ id });
    if (!deleteCitizen) {
      return res.status(404).send('Citizen not found');
    }

    res.send(deleteCitizen);
  } catch (e) {
    res.status(400).send(e);
  }
});

module.exports = router;
