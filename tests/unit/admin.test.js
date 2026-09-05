const adminService = require("../../src/services/admin.service");
const Admin = require("../../src/models/Admin");
const AppError = require("../../src/exceptions/AppError");

jest.mock("../../src/models/Admin");
jest.mock("../../src/models/OAuthToken", () => ({
  create: jest.fn().mockResolvedValue({}),
  findOne: jest.fn().mockResolvedValue({ revoked: false, save: jest.fn() }),
}));
jest.mock("bcryptjs", () => ({
  compare: jest.fn().mockResolvedValue(true),
  hash: jest.fn().mockResolvedValue("hashed_password"),
}));

describe("AdminService Unit Tests", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getAllAdmins", () => {
    it("should return a sorted list of admins", async () => {
      const mockAdmins = [
        { MID: "10", name: "John" },
        { MID: "2", name: "Doe" },
      ];
      Admin.find.mockResolvedValue(mockAdmins);

      const result = await adminService.getAllAdmins();

      expect(Admin.find).toHaveBeenCalledWith({});
      // Sorted numerically: 2 comes before 10
      expect(result[0].MID).toBe("2");
      expect(result[1].MID).toBe("10");
    });

    it("should throw an AppError if find fails", async () => {
      Admin.find.mockRejectedValue(new Error("Db error"));

      await expect(adminService.getAllAdmins()).rejects.toThrow(AppError);
    });
  });

  describe("getAdminByMID", () => {
    it("should query the database for a specific admin", async () => {
      const mockAdmin = { MID: "admin123", name: "Jane" };
      Admin.findOne.mockResolvedValue(mockAdmin);

      const result = await adminService.getAdminByMID("admin123");

      expect(Admin.findOne).toHaveBeenCalledWith({ MID: "admin123" });
      expect(result).toEqual(mockAdmin);
    });

    it("should throw an AppError if find fails", async () => {
      Admin.findOne.mockRejectedValue(new Error("Db error"));

      await expect(adminService.getAdminByMID("admin123")).rejects.toThrow(
        AppError,
      );
    });
  });

  describe("createAdmin", () => {
    it("should call create when creating a single admin", async () => {
      const mockAdmin = { MID: "admin1", MPIN: "1234", name: "Test" };
      Admin.create.mockResolvedValue(mockAdmin);

      const result = await adminService.createAdmin(mockAdmin);

      expect(Admin.create).toHaveBeenCalled();
      expect(result).toEqual(mockAdmin);
    });

    it("should call insertMany when creating multiple admins", async () => {
      const mockAdmins = [
        { MID: "admin1", MPIN: "1234", name: "Test1" },
        { MID: "admin2", MPIN: "1234", name: "Test2" },
      ];
      Admin.insertMany.mockResolvedValue(mockAdmins);

      const result = await adminService.createAdmin(mockAdmins);

      expect(Admin.insertMany).toHaveBeenCalled();
      expect(result).toEqual(mockAdmins);
    });
  });

  describe("loginAdmin", () => {
    it("should return null if admin is not found", async () => {
      Admin.findOne.mockResolvedValue(null);

      const result = await adminService.loginAdmin("MID1", "MPIN1");

      expect(Admin.findOne).toHaveBeenCalledWith({ MID: "MID1" });
      expect(result).toBeNull();
    });

    it("should return access_token, refresh_token, and admin name on successful credentials match", async () => {
      const mockAdmin = {
        _id: "60d0fe4f5311236168a109ca",
        MID: "MID1",
        name: "Admin User",
        MPIN: "hashedmpin",
        role: "admin",
      };
      Admin.findOne.mockResolvedValue(mockAdmin);
      const bcrypt = require('bcryptjs');
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);

      const result = await adminService.loginAdmin("MID1", "MPIN1");

      expect(result).toHaveProperty("access_token");
      expect(result).toHaveProperty("refresh_token");
      expect(result).toHaveProperty("name", "Admin User");
    });
  });
});
