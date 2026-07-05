const citizenService = require("../../src/services/citizen.service");
const Citizen = require("../../src/models/Citizen");
const AppError = require("../../src/exceptions/AppError");

jest.mock("../../src/models/Citizen");

describe("CitizenService Unit Tests", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("createCitizen", () => {
    it("should call insertMany for an array of citizens", async () => {
      const mockData = [{ id: "1" }, { id: "2" }];
      Citizen.insertMany.mockResolvedValue(mockData);

      const result = await citizenService.createCitizen(mockData);

      expect(Citizen.insertMany).toHaveBeenCalledWith(mockData);
      expect(result).toEqual(mockData);
    });

    it("should call create for a single citizen object", async () => {
      const mockData = { id: "3" };
      Citizen.create.mockResolvedValue(mockData);

      const result = await citizenService.createCitizen(mockData);

      expect(Citizen.create).toHaveBeenCalledWith(mockData);
      expect(result).toEqual(mockData);
    });

    it("should throw AppError if create fails", async () => {
      Citizen.create.mockRejectedValue(new Error("Db error"));
      await expect(citizenService.createCitizen({})).rejects.toThrow(AppError);
    });
  });

  describe("getAllCitizens", () => {
    it("should return citizens sorted numerically if IDs are numeric strings", async () => {
      const mockData = [{ id: "10" }, { id: "2" }];
      Citizen.find.mockResolvedValue(mockData);

      const result = await citizenService.getAllCitizens();

      expect(result[0].id).toBe("2");
      expect(result[1].id).toBe("10");
    });

    it("should return citizens sorted lexicographically if IDs are non-numeric strings", async () => {
      const mockData = [{ id: "xyz" }, { id: "abc" }];
      Citizen.find.mockResolvedValue(mockData);

      const result = await citizenService.getAllCitizens();

      expect(result[0].id).toBe("abc");
      expect(result[1].id).toBe("xyz");
    });

    it("should throw AppError if find fails", async () => {
      Citizen.find.mockRejectedValue(new Error("Db error"));
      await expect(citizenService.getAllCitizens()).rejects.toThrow(AppError);
    });
  });

  describe("getCitizenById", () => {
    it("should find citizens by custom id field", async () => {
      const mockCitizen = [{ id: "123", name: "John" }];
      Citizen.find.mockResolvedValue(mockCitizen);

      const result = await citizenService.getCitizenById("123");

      expect(Citizen.find).toHaveBeenCalledWith({ id: "123" });
      expect(result).toEqual(mockCitizen);
    });

    it("should throw AppError if find fails", async () => {
      Citizen.find.mockRejectedValue(new Error("Db error"));
      await expect(citizenService.getCitizenById("123")).rejects.toThrow(
        AppError,
      );
    });
  });

  describe("updateCitizenById", () => {
    it("should update citizen by id and return new updated record", async () => {
      const mockUpdated = { id: "123", name: "New Name" };
      Citizen.findOneAndUpdate.mockResolvedValue(mockUpdated);

      const result = await citizenService.updateCitizenById("123", {
        name: "New Name",
      });

      expect(Citizen.findOneAndUpdate).toHaveBeenCalledWith(
        { id: "123" },
        { name: "New Name" },
        { new: true },
      );
      expect(result).toEqual(mockUpdated);
    });

    it("should throw AppError if update fails", async () => {
      Citizen.findOneAndUpdate.mockRejectedValue(new Error("Db error"));
      await expect(citizenService.updateCitizenById("123", {})).rejects.toThrow(
        AppError,
      );
    });
  });

  describe("deleteCitizenById", () => {
    it("should find and delete citizen by id", async () => {
      const mockDeleted = { id: "123" };
      Citizen.findOneAndDelete.mockResolvedValue(mockDeleted);

      const result = await citizenService.deleteCitizenById("123");

      expect(Citizen.findOneAndDelete).toHaveBeenCalledWith({ id: "123" });
      expect(result).toEqual(mockDeleted);
    });

    it("should throw AppError if delete fails", async () => {
      Citizen.findOneAndDelete.mockRejectedValue(new Error("Db error"));
      await expect(citizenService.deleteCitizenById("123")).rejects.toThrow(
        AppError,
      );
    });
  });
});
