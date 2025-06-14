/* eslint-disable linebreak-style */
// const express = require('express');

// const router = express.Router();
// const jwt = require('jsonwebtoken');
// // const citizenSchema = require('../model/citizenSchema');
// // router.post("/post", async (req, res) => {
// //   try {
// //     const addCitizenShip = new citizenSchema(req.body);
// //     const postResponseData = await addCitizenShip.save();
// //     res.send(postResponseData);
// //   } catch (e) {
// //     res.status(400).send(e);
// //   }
// // });
// // batch post

// const secretKey = 'secretKey';

// function verifyToken(req, res, next) {
//   const bearerTokenHeader = req.headers.authorization;

//   if (typeof bearerTokenHeader !== 'undefined') {
//     const bearer = bearerTokenHeader.split(' ');
//     const token = bearer[1];
//     req.token = token;
//     next();
//   } else {
//     res.send({
//       result: 'Token is Invalid/Not Defined...',
//     });
//   }
// }

// router.post('/loginToken', async (req, res) => {
//   try {
//     const getCitizenShip = await citizenSchema.find({});
//     jwt.sign(
//       { getCitizenShip },
//       secretKey,
//       { expiresIn: '300s' },
//       (err, token) => {
//         res.json({
//           token,
//         });
//       },
//     );
//   } catch (e) {
//     res.status(400).send(e);
//   }
// });

// router.post('/postData', async (req, res) => {
//   try {
//     const citizenDataArray = req.body;
//     const postBatchResponseData = await citizenSchema.insertMany(
//       citizenDataArray,
//     );
//     res.send(postBatchResponseData);
//   } catch (e) {
//     res.status(400).send(e);
//   }
// });

// router.get('/getData', async (req, res) => {
//   try {
//     const getCitizenShip = await citizenSchema.find({});
//     // const responseData = await addCitizenShip.save();
//     // res.send(responseData);
//     getCitizenShip.sort((a, b) => {
//       const numA = parseInt(a.id, 10);
//       const numB = parseInt(b.id, 10);

//       if (!isNaN(numA) && !isNaN(numB)) {
//         return numA - numB; // Numerical sorting
//       }
//       return a.id.localeCompare(b.id); // Lexicographic sorting
//     });
//     res.status(201).send(getCitizenShip);
//   } catch (e) {
//     res.status(400).send(e);
//   }
// });

// // Get particular data from API
// router.get('/getData/:id', verifyToken, async (req, res) => {
//   try {
//     // Extracting id from request parameters
//     const { id } = req.params;

//     // Verify JWT token
//     jwt.verify(req.token, secretKey, async (err, authData) => {
//       if (err) {
//         res.status(401).send({
//           message: 'Token Expired! Please Regenerate and apply again, Thanks.',
//         });
//       } else {
//         // If token is valid, proceed with fetching data
//         const getCitizenSingleData = await citizenSchema.find({ id });
//         res
//           .status(201)
//           .send(getCitizenSingleData);
//       }
//     });
//   } catch (e) {
//     res.status(400).send(e);
//   }
// });
// // to update the API
// router.patch('/updateData/:id', async (req, res) => {
//   try {
//     const { id } = req.params;
//     const updatedCitizen = await citizenSchema.findOneAndUpdate(
//       { id },
//       req.body,
//       {
//         new: true,
//       },
//     );
//     if (!updatedCitizen) {
//       return res.status(404).send('Citizen not found');
//     }

//     // res.send(updatedCitizen);
//     res
//       .status(200)
//       // .json({
//       //   message: `record with ID ${id} got updated successfully`,
//       // })
//       .send(updatedCitizen);
//   } catch (e) {
//     res.status(400).send(e);
//   }
// });
// // to update the API
// router.delete('/removeData/:id', async (req, res) => {
//   try {
//     const { id } = req.params;
//     const deleteCitizen = await citizenSchema.findOneAndDelete({ id });
//     if (!deleteCitizen) {
//       return res.status(404).send('Citizen not found');
//     }

//     res.send(`record with ${id} deleted successfully`);
//   } catch (e) {
//     res.status(400).send(e);
//   }
// });

// module.exports = demo;
