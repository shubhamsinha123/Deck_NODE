/* eslint-disable linebreak-style */
/* eslint-disable no-param-reassign */
const express = require('express');
const jwt = require('jsonwebtoken');

const jwtApp = express();
const secretKey = 'secretKey';
const users = [{ id: '123', password: 'password123' }]; // Example user data

function verifyToken(req, res, next) {
  const bearerTokenHeader = req.headers.authorization;

  if (typeof bearerTokenHeader !== 'undefined') {
    const bearer = bearerTokenHeader.split(' ');
    const token = bearer[1];
    req.token = token;
    next();
  } else {
    res.send({
      result: 'Token is Invalid/Not Defined',
    });
  }
}
jwtApp.get('/infoJwt', (req, res) => {
  res.json({
    message: 'Hello from local',
  });
});

// jwtApp.post('/loginJwt', (req, res) => {
//   const user = [
//     {
//       id: 1,
//       userName: 'John',
//       pass: 'admin',
//     },
//   ];
//   jwt.sign({ user }, secretKey, { expiresIn: '300s' }, (err, token) => {
//     res.json({
//       token,
//     });
//   });
// });

jwtApp.post('/jwtLogin', (req, res) => {
  const { id, password } = req.body;
  const user = users.find((u) => u.id === id && u.password === password);
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const userData = [
    {
      id: user.id,
      pass: user.password,
    },
  ];

  const token = jwt.sign({ userData }, secretKey, {
    expiresIn: '600s',
  });
  return res.json({ token });
});

jwtApp.post('/profileJwt', verifyToken, async (req, res) => {
  jwt.verify(req.token, secretKey, (err, authData) => {
    if (err) {
      res.send({
        message: 'Token Expired! Please Regenerate and apply again, Thanks.',
      });
    } else {
      const newExp = authData.exp;
      const utcDate = new Date(newExp * 1000);

      // Specify the Indian Standard Timezone (IST)
      const istTimezone = 'Asia/Kolkata';

      // Get the local time by converting the UTC time to IST
      const istDate = new Date(
        utcDate.toLocaleString('en-US', { timeZone: istTimezone }),
      );

      // Format the IST date and time as a string
      authData.expiresIn = istDate.toLocaleString('en-US', {
        timeZone: istTimezone,
      });

      res.json({
        message: 'Tokken verified',
        authData,
      });
    }
  });
});

module.exports = jwtApp;
