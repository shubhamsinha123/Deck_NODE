const airportService = require("../../src/services/airport.service");
const Airport = require("../../src/models/Airport");
const AppError = require("../../src/exceptions/AppError");

jest.mock("../../src/models/Airport");

describe("AirportService Unit Tests", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getAllAirports", () => {
    it("should return all airports", async () => {
      const mockAirports = [{ code: "JFK", name: "John F. Kennedy" }];
      Airport.find.mockResolvedValue(mockAirports);

      const result = await airportService.getAllAirports();

      expect(Airport.find).toHaveBeenCalledWith({});
      expect(result).toEqual(mockAirports);
    });

    it("should throw an AppError if find fails", async () => {
      Airport.find.mockRejectedValue(new Error("Db error"));

      await expect(airportService.getAllAirports()).rejects.toThrow(AppError);
    });
  });

  describe("getAirportByCode", () => {
    it("should return a specific airport by code", async () => {
      const mockAirport = [{ code: "JFK", name: "John F. Kennedy" }];
      Airport.find.mockResolvedValue(mockAirport);

      const result = await airportService.getAirportByCode("JFK");

      expect(Airport.find).toHaveBeenCalledWith({ code: "JFK" });
      expect(result).toEqual(mockAirport);
    });

    it("should throw an AppError if find fails", async () => {
      Airport.find.mockRejectedValue(new Error("Db error"));

      await expect(airportService.getAirportByCode("JFK")).rejects.toThrow(
        AppError,
      );
    });
  });

  describe("updateAirportByCode", () => {
    it("should update and return the updated airport", async () => {
      const mockUpdated = { code: "JFK", name: "JFK New Name" };
      Airport.findOneAndUpdate.mockResolvedValue(mockUpdated);

      const result = await airportService.updateAirportByCode("JFK", {
        name: "JFK New Name",
      });

      expect(Airport.findOneAndUpdate).toHaveBeenCalledWith(
        { code: "JFK" },
        { name: "JFK New Name" },
        { new: true },
      );
      expect(result).toEqual(mockUpdated);
    });

    it("should throw an AppError if update fails", async () => {
      Airport.findOneAndUpdate.mockRejectedValue(new Error("Db error"));

      await expect(
        airportService.updateAirportByCode("JFK", { name: "New" }),
      ).rejects.toThrow(AppError);
    });
  });
});
