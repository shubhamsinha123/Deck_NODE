/* eslint-disable linebreak-style */
/* eslint-disable consistent-return */
const express = require('express');

const adminAPI = express.Router();
const jwt = require('jsonwebtoken');

const crypto = require('crypto');
// const { log } = require('console');
const citizenSchema = require('../model/adminSchema');
const userSchema = require('../model/userSchema');

// JWT Secret Key Generator
const generateJWTSecret = () => crypto.randomBytes(32).toString('hex');

const secretKey = generateJWTSecret();
// console.log('Generated JWT Secret:', JWT_SECRET);

function verifyToken(req, res, next) {
  const bearerTokenHeader = req.headers.authorization;

  if (typeof bearerTokenHeader !== 'undefined') {
    const bearer = bearerTokenHeader.split(' ');
    const token = bearer[1];
    jwt.verify(token, secretKey, (err, authData) => {
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
// batch post
adminAPI.post('/adminPost', async (req, res) => {
  try {
    const citizenDataArray = req.body;
    const postBatchResponseData = await citizenSchema.insertMany(citizenDataArray);
    // res.json(generateToken);
    res.status(201).send({
      postBatchResponseData,
      message: 'Admin record created successfully.',
      status: 'SUCCESS',
    });
  } catch (e) {
    res.status(400).send({
      message: 'Failed to create admin record.',
      status: 'FAILURE',
    });
  }
});

adminAPI.post('/adminJwtLogin', async (req, res) => {
  const { MID, MPIN } = req.body;
  const user = await citizenSchema.findOne({ MID, MPIN });

  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = jwt.sign({}, secretKey, { expiresIn: '600s' });
  const decoded = jwt.decode(token);

  const newExp = decoded.exp;
  // const istDate = new Date(utcDate.toLocaleString('en-US', { timeZone: istTimezone }));
  // const expiresInIST = istDate.toLocaleString('en-US', { timeZone: istTimezone });
  // Calculate expiry time in IST
  const currentTime = Math.floor(Date.now() / 1000);
  const remainingTime = newExp - currentTime;
  return res.status(201).json({ token, expiresIn: `${remainingTime}s` });
});

adminAPI.get('/getData', verifyToken, async (req, res) => {
  try {
    const userData = await userSchema.find({});
    // console.log(userData);
    // globalArr.push(...userData);
    // const responseData = await addCitizenShip.save();
    // res.send(responseData);
    userData.sort((a, b) => {
      const numA = parseInt(a.id, 10);
      const numB = parseInt(b.id, 10);

      if (!Number.isNaN(numA) && !Number.isNaN(numB)) {
        return numA - numB; // Numerical sorting
      }
      return a.id.localeCompare(b.id); // Lexicographic sorting
    });
    res.send(userData);
  } catch (e) {
    res.status(400).send(e);
  }
});

adminAPI.get('/adminGet', verifyToken, async (req, res) => {
  try {
    const getCitizenShip = await citizenSchema.find({});
    // const responseData = await addCitizenShip.save();
    // res.send(responseData);
    getCitizenShip.sort((a, b) => {
      const numA = parseInt(a.MID, 10);
      const numB = parseInt(b.MID, 10);

      if (!Number.isNaN(numA) && !Number.isNaN(numB)) {
        return numA - numB; // Numerical sorting
      }
      return a.MID.localeCompare(b.MID); // Lexicographic sorting
    });
    res.send(getCitizenShip);
  } catch (e) {
    res.status(400).send(e);
  }
});
// adminAPI.get('/adminGet', verifyToken, async (req, res) => {
//   try {
//     jwt.verify(req.token, secretKey, async (err) => {
//       if (err) {
//         res.status(401).send({
//           message: 'Token Expired! Please Regenerate and apply again, Thanks.',
//         });
//       } else {
//         const getCitizenShip = await citizenSchema.find({});
//         // const responseData = await addCitizenShip.save();
//         // res.send(responseData);
//         getCitizenShip.sort((a, b) => {
//           const numA = parseInt(a.MID, 10);
//           const numB = parseInt(b.MID, 10);

//           if (!Number.isNaN(numA) && !Number.isNaN(numB)) {
//             return numA - numB; // Numerical sorting
//           }
//           return a.MID.localeCompare(b.MID); // Lexicographic sorting
//         });
//         res.status(201).send(getCitizenShip);
//       }
//     });
//   } catch (e) {
//     res.status(400).send(e);
//   }
// });

// Get particular data from API
adminAPI.get('/adminGet/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const getCitizenSingleData = await citizenSchema.find({ MID: id });
    // const responseData = await addCitizenShip.save();
    // res.send(responseData);
    res.send(getCitizenSingleData);
  } catch (e) {
    res.status(400).send(e);
  }
});
// to update the API
adminAPI.patch('/adminUpdate/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updatedCitizen = await citizenSchema.findOneAndUpdate(
      { MID: id },
      req.body,
      {
        new: true,
      },
    );
    if (!updatedCitizen) {
      return res.status(404).send('Admin not found');
    }

    res.status(202).send(updatedCitizen);
  } catch (e) {
    res.status(400).send(e);
  }
});
// to delete the API
adminAPI.delete('/removeAdmin/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleteCitizen = await citizenSchema.findOneAndDelete({ MID: id });
    if (!deleteCitizen) {
      return res.status(404).send('Admin not found');
    }

    return res.status(202).send(`Data with ${id} deleted successfully`);
  } catch (e) {
    res.status(400).send(e);
  }

  // Add a return statement here if needed
  // return res.status(200).send('Some message');
});

adminAPI.delete('/removeAdmin/bulk', async (req, res) => {
  try {
    const citizenDataArray = req.body;
    const postBatchResponseData = await citizenSchema.deleteMany(citizenDataArray);
    res.status(202).send(postBatchResponseData);
  } catch (e) {
    res.status(400).send(e);
  }
});

module.exports = adminAPI;
