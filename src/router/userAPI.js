/* eslint-disable linebreak-style */
/* eslint-disable consistent-return */
const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const generateJWTSecret = () => crypto.randomBytes(32).toString('hex');

const secretKey = generateJWTSecret();

// To generate the secret key, use the below two line commands all together
// node -e "console.log(require('crypto').randomBytes(32)
// .toString('hex'))"node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

// // let globalArr = [];
// const users = [{ id: '123', password: 'password123' }]; // Example user data
const router = express.Router();
const citizenSchema = require('../model/userSchema');

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

router.post('/userJwtLogin', async (req, res) => {
  const { id, password } = req.body;
  const user = await citizenSchema.findOne({ id, password });

  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = jwt.sign({ id: user.id }, secretKey, { expiresIn: '600s' });
  const decoded = jwt.decode(token);

  const newExp = decoded.exp;
  // const istDate = new Date(utcDate.toLocaleString('en-US', { timeZone: istTimezone }));
  // const expiresInIST = istDate.toLocaleString('en-US', { timeZone: istTimezone });
  // Calculate expiry time in IST
  const currentTime = Math.floor(Date.now() / 1000);
  const remainingTime = newExp - currentTime;
  return res.json({ token, expiresIn: `${remainingTime}s` });
});

router.post('/userProfileJwt', verifyToken, async (req, res) => {
  jwt.verify(req.token, secretKey, (err, authData) => {
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
});

router.post('/jwtUserLogin', async (req, res) => {
  const { id, password } = req.body;
  const getCitizenShip = await citizenSchema.find({});
  const user = await getCitizenShip.find(
    (u) => u.id === id && u.password === password,
  );
  const responseData = { ...user };
  // eslint-disable-next-line no-underscore-dangle
  delete responseData._doc.password;

  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  const token = jwt.sign({ id: user.id }, secretKey, { expiresIn: '600s' });
  // eslint-disable-next-line no-underscore-dangle
  res.status(201).json({ token, userDetail: responseData._doc });
});

router.post('/postData', verifyToken, async (req, res) => {
  try {
    const citizenDataArray = req.body;
    const postBatchResponseData = await citizenSchema.insertMany(citizenDataArray);
    res.status(201).send({
      data: postBatchResponseData,
      message: "User's data created successfully.",
      status: 'SUCCESS',
    });
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
    if (!getCitizenSingleData?.length) {
      return res.status(404).send({
        message: 'Failed to find this particular record in DB',
        status: 'FAILURE',
      });
    }
    res.send({
      data: getCitizenSingleData,
      message: 'User data fetched successfully',
      status: 'SUCCESS',
    });
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

    // res.send(updatedCitizen);
    res
      .status(202)
      // .json({
      //   message: `record with ID ${id} got updated successfully`,
      // })
      .send(updatedCitizen);
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

    res.status(202).send(`record with ${id} deleted successfully`);
  } catch (e) {
    res.status(400).send(e);
  }
});

module.exports = router;
