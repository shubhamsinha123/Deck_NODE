const userService = require("../../src/services/user.service");
const User = require("../../src/models/User");
const AppError = require("../../src/exceptions/AppError");

jest.mock("../../src/models/User");

describe("UserService Unit Tests", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("loginUser", () => {
    it("should return null if credentials do not match", async () => {
      User.findOne.mockResolvedValue(null);

      const result = await userService.loginUser("123", "pass");

      expect(User.findOne).toHaveBeenCalledWith({
        id: "123",
        password: "pass",
      });
      expect(result).toBeNull();
    });

    it("should return token on valid login credentials", async () => {
      const mockUser = { id: "123" };
      User.findOne.mockResolvedValue(mockUser);

      const result = await userService.loginUser("123", "pass");

      expect(result).toHaveProperty("token");
      expect(result).toHaveProperty("expiresIn");
    });
  });

  describe("loginUserWithDetails", () => {
    it("should return null if user details not matched", async () => {
      User.findOne.mockResolvedValue(null);

      const result = await userService.loginUserWithDetails("123", "pass");

      expect(result).toBeNull();
    });

    it("should return token and userDetail with password excluded", async () => {
      const mockUser = {
        id: "123",
        _doc: { id: "123", name: "John", password: "pass" },
      };
      User.findOne.mockResolvedValue(mockUser);

      const result = await userService.loginUserWithDetails("123", "pass");

      expect(result).toHaveProperty("token");
      expect(result).toHaveProperty("userDetail");
      expect(result.userDetail.password).toBeUndefined();
      expect(result.userDetail.name).toBe("John");
    });
  });

  describe("createUsers", () => {
    it("should call insertMany for arrays of users", async () => {
      const mockData = [{ id: "1" }, { id: "2" }];
      User.insertMany.mockResolvedValue(mockData);

      const result = await userService.createUsers(mockData);

      expect(User.insertMany).toHaveBeenCalledWith(mockData);
      expect(result).toEqual(mockData);
    });

    it("should call create for a single user object", async () => {
      const mockData = { id: "3" };
      User.create.mockResolvedValue(mockData);

      const result = await userService.createUsers(mockData);

      expect(User.create).toHaveBeenCalledWith(mockData);
      expect(result).toEqual(mockData);
    });

    it("should throw AppError if create fails", async () => {
      User.create.mockRejectedValue(new Error("Db error"));
      await expect(userService.createUsers({})).rejects.toThrow(AppError);
    });
  });

  describe("getUserById", () => {
    it("should query for specific user by id", async () => {
      const mockUser = [{ id: "123" }];
      User.find.mockResolvedValue(mockUser);

      const result = await userService.getUserById("123");

      expect(User.find).toHaveBeenCalledWith({ id: "123" });
      expect(result).toEqual(mockUser);
    });

    it("should throw AppError if find fails", async () => {
      User.find.mockRejectedValue(new Error("Db error"));
      await expect(userService.getUserById("123")).rejects.toThrow(AppError);
    });
  });

  describe("updateUserById", () => {
    it("should update user record and return updated fields", async () => {
      const mockUpdated = { id: "123", name: "New Name" };
      User.findOneAndUpdate.mockResolvedValue(mockUpdated);

      const result = await userService.updateUserById("123", {
        name: "New Name",
      });

      expect(User.findOneAndUpdate).toHaveBeenCalledWith(
        { id: "123" },
        { name: "New Name" },
        { new: true },
      );
      expect(result).toEqual(mockUpdated);
    });

    it("should throw AppError if update fails", async () => {
      User.findOneAndUpdate.mockRejectedValue(new Error("Db error"));
      await expect(userService.updateUserById("123", {})).rejects.toThrow(
        AppError,
      );
    });
  });

  describe("deleteUserById", () => {
    it("should delete user by id", async () => {
      const mockDeleted = { id: "123" };
      User.findOneAndDelete.mockResolvedValue(mockDeleted);

      const result = await userService.deleteUserById("123");

      expect(User.findOneAndDelete).toHaveBeenCalledWith({ id: "123" });
      expect(result).toEqual(mockDeleted);
    });

    it("should throw AppError if delete fails", async () => {
      User.findOneAndDelete.mockRejectedValue(new Error("Db error"));
      await expect(userService.deleteUserById("123")).rejects.toThrow(AppError);
    });
  });
});
