/* eslint-disable class-methods-use-this */
const jwt = require('jsonwebtoken');

const secretKey = 'secretKey';
const users = [{ id: '123', password: 'password123' }];

class AuthService {
  constructor() {
    this.secretKey = secretKey;
    this.users = users;
  }

  async login(id, password) {
    const user = this.users.find((u) => u.id === id && u.password === password);
    if (!user) {
      return null;
    }

    const userData = [
      {
        id: user.id,
        pass: user.password,
      },
    ];

    const token = jwt.sign({ userData }, this.secretKey, {
      expiresIn: '600s',
    });

    return { token };
  }

  verifyToken(token) {
    return jwt.verify(token, this.secretKey);
  }

  formatExpiryToIST(newExp) {
    const utcDate = new Date(newExp * 1000);
    const istTimezone = 'Asia/Kolkata';
    const istDate = new Date(
      utcDate.toLocaleString('en-US', { timeZone: istTimezone }),
    );
    return istDate.toLocaleString('en-US', { timeZone: istTimezone });
  }
}

module.exports = new AuthService();
