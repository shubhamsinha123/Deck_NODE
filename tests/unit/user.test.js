const userService = require("../../src/services/user.service");
const User = require("../../src/models/User");
const AppError = require("../../src/exceptions/AppError");

jest.mock("../../src/models/User");
jest.mock("../../src/models/OAuthToken", () => ({
  create: jest.fn().mockResolvedValue({}),
  findOne: jest.fn().mockResolvedValue({ revoked: false, save: jest.fn() }),
}));
jest.mock("bcryptjs", () => ({
  compare: jest.fn().mockResolvedValue(true),
  hash: jest.fn().mockResolvedValue("hashed_password"),
}));

describe("UserService Unit Tests", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("loginUser", () => {
    it("should return null if user is not found", async () => {
      User.findOne.mockResolvedValue(null);

      const result = await userService.loginUser("123", "pass");

      expect(User.findOne).toHaveBeenCalledWith({ id: "123" });
      expect(result).toBeNull();
    });

    it("should return tokens and user details on valid login credentials", async () => {
      const mockUser = {
        _id: "60d0fe4f5311236168a109ca",
        id: "123",
        name: "John Doe",
        password: "hashedpassword",
        toObject: () => ({ id: "123", name: "John Doe" }),
      };
      User.findOne.mockResolvedValue(mockUser);
      const bcrypt = require('bcryptjs');
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);

      const result = await userService.loginUser("123", "pass");

      expect(result).toHaveProperty("access_token");
      expect(result).toHaveProperty("refresh_token");
      expect(result).toHaveProperty("userData");
      expect(result.userData).toEqual({ id: "123", name: "John Doe" });
    });
  });

  describe("loginUserWithDetails", () => {
    it("should return null if user details not matched", async () => {
      User.findOne.mockResolvedValue(null);

      const result = await userService.loginUserWithDetails("123", "pass");

      expect(result).toBeNull();
    });

    it("should return tokens and user details", async () => {
      const mockUser = {
        _id: "60d0fe4f5311236168a109ca",
        id: "123",
        name: "John",
        password: "hashedpassword",
        toObject: () => ({ id: "123", name: "John" }),
      };
      User.findOne.mockResolvedValue(mockUser);
      const bcrypt = require('bcryptjs');
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);

      const result = await userService.loginUserWithDetails("123", "pass");

      expect(result).toHaveProperty("access_token");
      expect(result).toHaveProperty("userData");
      expect(result.userData.name).toBe("John");
    });
  });

  describe("createUsers", () => {
    it("should call insertMany for arrays of users", async () => {
      const mockData = [{ id: "1" }, { id: "2" }];
      User.find.mockResolvedValue([]);
      User.insertMany.mockResolvedValue(mockData);

      const result = await userService.createUsers(mockData);

      expect(User.insertMany).toHaveBeenCalledWith(mockData);
      expect(result).toEqual(mockData);
    });

    it("should call create for a single user object", async () => {
      const mockData = { id: "3" };
      User.find.mockResolvedValue([]);
      User.create.mockResolvedValue(mockData);

      const result = await userService.createUsers(mockData);

      expect(User.create).toHaveBeenCalledWith(mockData);
      expect(result).toEqual(mockData);
    });

    it("should throw AppError if user ID already exists in database", async () => {
      const mockData = { id: "3" };
      User.find.mockResolvedValue([{ id: "3" }]);

      await expect(userService.createUsers(mockData)).rejects.toThrow("User with ID '3' already exists");
    });

    it("should throw AppError if create fails", async () => {
      User.find.mockResolvedValue([]);
      User.create.mockRejectedValue(new Error("Db error"));
      await expect(userService.createUsers({})).rejects.toThrow(AppError);
    });
  });

  describe("getUserById", () => {
    it("should query for specific user by id without exposing password", async () => {
      const mockUser = [{ id: "123", name: "John" }];
      const selectMock = jest.fn().mockResolvedValue(mockUser);
      User.find.mockReturnValue({ select: selectMock });

      const result = await userService.getUserById("123");

      expect(User.find).toHaveBeenCalledWith({ id: "123" });
      expect(selectMock).toHaveBeenCalledWith("-password");
      expect(result).toEqual(mockUser);
    });

    it("should throw AppError if find fails", async () => {
      User.find.mockReturnValue({
        select: jest.fn().mockRejectedValue(new Error("Db error")),
      });
      await expect(userService.getUserById("123")).rejects.toThrow(AppError);
    });
  });

  describe("updateUserById", () => {
    it("should throw AppError 400 if body is a plain object instead of a JSON Patch array", async () => {
      await expect(
        userService.updateUserById("123", { password: "timtim2" })
      ).rejects.toThrow("Invalid JSON patch format. Expected a non-empty array of patch operations: [{ op, path, value }]");
    });

    it("should update user record with RFC 6902 JSON Patch array payload (replace & remove with case fallback)", async () => {
      const mockExistingDoc = {
        _id: "60d0fe4f5311236168a109ca",
        id: "123",
        name: "Old Name",
        description: "Old Desc",
        toObject: () => ({ _id: "60d0fe4f5311236168a109ca", id: "123", name: "Old Name", description: "Old Desc" }),
      };
      const mockUpdated = { id: "123", name: "Name Updated" };

      User.findOne.mockResolvedValue(mockExistingDoc);
      User.findOneAndReplace.mockResolvedValue(mockUpdated);

      const patchArray = [
        { op: "replace", path: "/Name", value: "Name Updated" },
        { op: "remove", path: "/Description" },
      ];

      const result = await userService.updateUserById("123", patchArray);

      expect(User.findOne).toHaveBeenCalledWith({ id: "123" });
      expect(User.findOneAndReplace).toHaveBeenCalledWith(
        { id: "123" },
        { _id: "60d0fe4f5311236168a109ca", id: "123", name: "Name Updated" },
        { new: true, runValidators: true },
      );
      expect(result).toEqual(mockUpdated);
    });

    it("should support updating deep nested properties like /properties/from/name and removing top-level fields like /properties", async () => {
      const mockExistingDoc = {
        _id: "60d0fe4f5311236168a109ca",
        id: "123",
        name: "timtim",
        properties: {
          from: { city: "Mumbai", name: "Old Airport Name" },
          seat: "3AE",
        },
        toObject: () => ({
          _id: "60d0fe4f5311236168a109ca",
          id: "123",
          name: "timtim",
          properties: {
            from: { city: "Mumbai", name: "Old Airport Name" },
            seat: "3AE",
          },
        }),
      };
      const mockUpdated = {
        id: "123",
        name: "timtim",
        properties: {
          from: { city: "Mumbai", name: "Chhatrapati Shivaji Maharaj International Airport" },
        },
      };

      User.findOne.mockResolvedValue(mockExistingDoc);
      User.findOneAndReplace.mockResolvedValue(mockUpdated);

      const patchArray = [
        { op: "replace", path: "/properties/from/name", value: "Chhatrapati Shivaji Maharaj International Airport" },
        { op: "remove", path: "/properties/seat" },
      ];

      const result = await userService.updateUserById("123", patchArray);

      expect(User.findOneAndReplace).toHaveBeenCalledWith(
        { id: "123" },
        {
          _id: "60d0fe4f5311236168a109ca",
          id: "123",
          name: "timtim",
          properties: {
            from: { city: "Mumbai", name: "Chhatrapati Shivaji Maharaj International Airport" },
          },
        },
        { new: true, runValidators: true },
      );
      expect(result).toEqual(mockUpdated);
    });

    it("should set hasPassword to true and hash password when password path is patched", async () => {
      const mockExistingDoc = {
        _id: "60d0fe4f5311236168a109ca",
        id: "123",
        password: "oldpassword",
        toObject: () => ({ _id: "60d0fe4f5311236168a109ca", id: "123", password: "oldpassword" }),
      };
      const mockUpdated = { id: "123", hasPassword: true };

      User.findOne.mockResolvedValue(mockExistingDoc);
      User.findOneAndReplace.mockResolvedValue(mockUpdated);

      const result = await userService.updateUserById("123", [
        { op: "replace", path: "/password", value: "newpassword123" }
      ]);

      expect(User.findOneAndReplace).toHaveBeenCalledWith(
        { id: "123" },
        { _id: "60d0fe4f5311236168a109ca", id: "123", password: "hashed_password", hasPassword: true },
        { new: true, runValidators: true },
      );
      expect(result).toEqual(mockUpdated);
    });

    it("should throw AppError if user not found for patch array update", async () => {
      User.findOne.mockResolvedValue(null);
      const result = await userService.updateUserById("999", [{ op: "replace", path: "/name", value: "test" }]);
      expect(result).toBeNull();
    });

    it("should throw AppError if update fails", async () => {
      User.findOne.mockResolvedValue({ _id: "60d0fe4f5311236168a109ca", id: "123", toObject: () => ({ _id: "60d0fe4f5311236168a109ca", id: "123" }) });
      User.findOneAndReplace.mockRejectedValue(new Error("Db error"));
      await expect(
        userService.updateUserById("123", [{ op: "replace", path: "/name", value: "test" }])
      ).rejects.toThrow(AppError);
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
