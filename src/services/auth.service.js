/* eslint-disable class-methods-use-this */
const jwt = require('jsonwebtoken');

const secretKey = 'secretKey';
const users = [{ id: '123', password: 'password123' }];

class AuthService {
  async login(id, password) {
    const user = users.find((u) => u.id === id && u.password === password);
    if (!user) {
      return null;
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
    return { token };
  }

  verifyToken(token) {
    return jwt.verify(token, secretKey);
  }

  formatExpiryToIST(exp) {
    const utcDate = new Date(exp * 1000);
    const istTimezone = 'Asia/Kolkata';
    const istDate = new Date(
      utcDate.toLocaleString('en-US', { timeZone: istTimezone }),
    );
    return istDate.toLocaleString('en-US', {
      timeZone: istTimezone,
    });
  }
}

module.exports = new AuthService();
