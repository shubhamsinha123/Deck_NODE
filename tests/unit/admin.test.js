const adminService = require("../../src/services/admin.service");
const Admin = require("../../src/models/Admin");
const AppError = require("../../src/exceptions/AppError");

jest.mock("../../src/models/Admin");

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
      const mockAdmin = [{ MID: "admin123", name: "Jane" }];
      Admin.find.mockResolvedValue(mockAdmin);

      const result = await adminService.getAdminByMID("admin123");

      expect(Admin.find).toHaveBeenCalledWith({ MID: "admin123" });
      expect(result).toEqual(mockAdmin);
    });

    it("should throw an AppError if find fails", async () => {
      Admin.find.mockRejectedValue(new Error("Db error"));

      await expect(adminService.getAdminByMID("admin123")).rejects.toThrow(
        AppError,
      );
    });
  });

  describe("createAdmin", () => {
    it("should call create when creating a single admin", async () => {
      const mockAdmin = { MID: "admin1", name: "Test" };
      Admin.create.mockResolvedValue(mockAdmin);

      const result = await adminService.createAdmin(mockAdmin);

      expect(Admin.create).toHaveBeenCalledWith(mockAdmin);
      expect(result).toEqual(mockAdmin);
    });

    it("should call insertMany when creating multiple admins", async () => {
      const mockAdmins = [
        { MID: "admin1", name: "Test1" },
        { MID: "admin2", name: "Test2" },
      ];
      Admin.insertMany.mockResolvedValue(mockAdmins);

      const result = await adminService.createAdmin(mockAdmins);

      expect(Admin.insertMany).toHaveBeenCalledWith(mockAdmins);
      expect(result).toEqual(mockAdmins);
    });
  });

  describe("loginAdmin", () => {
    it("should return null if login credentials do not match", async () => {
      Admin.findOne.mockResolvedValue(null);

      const result = await adminService.loginAdmin("MID1", "MPIN1");

      expect(Admin.findOne).toHaveBeenCalledWith({
        MID: "MID1",
        MPIN: "MPIN1",
      });
      expect(result).toBeNull();
    });

    it("should return token and expiresIn on successful credentials match", async () => {
      const mockAdmin = { MID: "MID1", MPIN: "MPIN1" };
      Admin.findOne.mockResolvedValue(mockAdmin);

      const result = await adminService.loginAdmin("MID1", "MPIN1");

      expect(result).toHaveProperty("token");
      expect(result).toHaveProperty("expiresIn");
    });
  });
});
