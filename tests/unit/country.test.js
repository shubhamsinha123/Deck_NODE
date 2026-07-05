const countryService = require("../../src/services/country.service");
const Country = require("../../src/models/Country");
const AppError = require("../../src/exceptions/AppError");

jest.mock("../../src/models/Country");

describe("CountryService Unit Tests", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("createCountries", () => {
    it("should call insertMany for arrays of country objects", async () => {
      const mockData = [{ code: "US" }, { code: "CA" }];
      Country.insertMany.mockResolvedValue(mockData);

      const result = await countryService.createCountries(mockData);

      expect(Country.insertMany).toHaveBeenCalledWith(mockData);
      expect(result).toEqual(mockData);
    });

    it("should call create for a single country object", async () => {
      const mockData = { code: "MX" };
      Country.create.mockResolvedValue(mockData);

      const result = await countryService.createCountries(mockData);

      expect(Country.create).toHaveBeenCalledWith(mockData);
      expect(result).toEqual(mockData);
    });

    it("should throw AppError if create fails", async () => {
      Country.create.mockRejectedValue(new Error("Db error"));
      await expect(countryService.createCountries({})).rejects.toThrow(
        AppError,
      );
    });
  });

  describe("getAllCountries", () => {
    it("should return all countries in the collection", async () => {
      const mockData = [{ code: "IN" }];
      Country.find.mockResolvedValue(mockData);

      const result = await countryService.getAllCountries();

      expect(Country.find).toHaveBeenCalledWith({});
      expect(result).toEqual(mockData);
    });

    it("should throw AppError if find fails", async () => {
      Country.find.mockRejectedValue(new Error("Db error"));
      await expect(countryService.getAllCountries()).rejects.toThrow(AppError);
    });
  });

  describe("getCountryByCode", () => {
    it("should return a specific country by code query", async () => {
      const mockData = [{ code: "FR", label: "France" }];
      Country.find.mockResolvedValue(mockData);

      const result = await countryService.getCountryByCode("FR");

      expect(Country.find).toHaveBeenCalledWith({ code: "FR" });
      expect(result).toEqual(mockData);
    });

    it("should throw AppError if find fails", async () => {
      Country.find.mockRejectedValue(new Error("Db error"));
      await expect(countryService.getCountryByCode("FR")).rejects.toThrow(
        AppError,
      );
    });
  });

  describe("updateCountryByCode", () => {
    it("should update and return the new country record", async () => {
      const mockUpdated = { code: "DE", label: "Germany New" };
      Country.findOneAndUpdate.mockResolvedValue(mockUpdated);

      const result = await countryService.updateCountryByCode("DE", {
        label: "Germany New",
      });

      expect(Country.findOneAndUpdate).toHaveBeenCalledWith(
        { code: "DE" },
        { label: "Germany New" },
        { new: true },
      );
      expect(result).toEqual(mockUpdated);
    });

    it("should throw AppError if findOneAndUpdate fails", async () => {
      Country.findOneAndUpdate.mockRejectedValue(new Error("Db error"));
      await expect(
        countryService.updateCountryByCode("DE", {}),
      ).rejects.toThrow(AppError);
    });
  });

  describe("deleteCountryByCode", () => {
    it("should delete a country record by code query", async () => {
      const mockDeleted = { code: "IT" };
      Country.findOneAndDelete.mockResolvedValue(mockDeleted);

      const result = await countryService.deleteCountryByCode("IT");

      expect(Country.findOneAndDelete).toHaveBeenCalledWith({ code: "IT" });
      expect(result).toEqual(mockDeleted);
    });

    it("should throw AppError if findOneAndDelete fails", async () => {
      Country.findOneAndDelete.mockRejectedValue(new Error("Db error"));
      await expect(countryService.deleteCountryByCode("IT")).rejects.toThrow(
        AppError,
      );
    });
  });
});
