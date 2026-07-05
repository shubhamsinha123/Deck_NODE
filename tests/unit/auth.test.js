const authService = require("../../src/services/auth.service");
const jwt = require("jsonwebtoken");

describe("AuthService Unit Tests", () => {
  describe("login", () => {
    it("should return null if login credentials do not match", async () => {
      const result = await authService.login("invalidId", "invalidPassword");
      expect(result).toBeNull();
    });

    it("should return a token if login credentials match", async () => {
      const result = await authService.login("123", "password123");
      expect(result).toHaveProperty("token");
      expect(typeof result.token).toBe("string");
    });
  });

  describe("verifyToken", () => {
    it("should decode a valid token", async () => {
      const loginResult = await authService.login("123", "password123");
      const decoded = authService.verifyToken(loginResult.token);
      expect(decoded).toHaveProperty("userData");
      expect(decoded.userData[0].id).toBe("123");
    });

    it("should throw an error for an invalid token", () => {
      expect(() => authService.verifyToken("invalid.token.here")).toThrow();
    });
  });

  describe("formatExpiryToIST", () => {
    it("should format a UTC timestamp to IST time string", () => {
      const timestamp = 1688472000; // 2023-07-04 UTC
      const result = authService.formatExpiryToIST(timestamp);
      // IST is UTC + 5:30
      expect(result).toContain("2023");
    });
  });
});
