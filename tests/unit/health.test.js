const healthService = require("../../src/services/health.service");
const mongoose = require("mongoose");

jest.mock("mongoose", () => {
  const actualMongoose = jest.requireActual("mongoose");
  return {
    ...actualMongoose,
    connection: {
      readyState: 1,
      host: "localhost",
      name: "test_db",
    },
  };
});

describe("HealthService Unit Tests", () => {
  afterEach(() => {
    mongoose.connection.readyState = 1;
  });

  describe("getDatabaseState", () => {
    it("should return connection state code", () => {
      mongoose.connection.readyState = 2;
      const state = healthService.getDatabaseState();
      expect(state).toBe(2);
    });
  });

  describe("getDatabaseInfo", () => {
    it("should format database information correctly", () => {
      mongoose.connection.readyState = 1;
      const result = healthService.getDatabaseInfo();

      expect(result).toEqual({
        status: "Connected",
        readyState: 1,
        host: "localhost",
        name: "test_db",
      });
    });

    it("should support other states like Disconnected", () => {
      mongoose.connection.readyState = 0;
      const result = healthService.getDatabaseInfo();
      expect(result.status).toBe("Disconnected");
    });
  });

  describe("getMemoryInfo", () => {
    it("should return memory statistics strings", () => {
      const result = healthService.getMemoryInfo();
      expect(result).toHaveProperty("used");
      expect(result).toHaveProperty("total");
      expect(result.used).toContain("MB");
    });
  });

  describe("getProcessInfo", () => {
    it("should return node process configurations", () => {
      const result = healthService.getProcessInfo();
      expect(result).toHaveProperty("pid");
      expect(result).toHaveProperty("nodeVersion");
      expect(result.pid).toBe(process.pid);
    });
  });
});
