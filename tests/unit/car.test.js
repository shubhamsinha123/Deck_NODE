const carService = require("../../src/services/car.service");
const Car = require("../../src/models/Car");
const AppError = require("../../src/exceptions/AppError");

jest.mock("../../src/models/Car", () => ({
  insertMany: jest.fn(),
  create: jest.fn(),
  find: jest.fn(),
  findOneAndDelete: jest.fn(),
}));

describe("CarService Unit Tests", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("createCars", () => {
    it("should call insertMany when creating multiple cars", async () => {
      const mockCars = [{ model: "Model S" }, { model: "Model 3" }];
      Car.insertMany.mockResolvedValue(mockCars);

      const result = await carService.createCars(mockCars);

      expect(Car.insertMany).toHaveBeenCalledWith(mockCars);
      expect(result).toEqual(mockCars);
    });

    it("should call create when creating a single car", async () => {
      const mockCar = { model: "Model X" };
      Car.create.mockResolvedValue(mockCar);

      const result = await carService.createCars(mockCar);

      expect(Car.create).toHaveBeenCalledWith(mockCar);
      expect(result).toEqual(mockCar);
    });

    it("should throw AppError if create fails", async () => {
      Car.create.mockRejectedValue(new Error("Db error"));
      await expect(carService.createCars({})).rejects.toThrow(AppError);
    });
  });

  describe("getCars", () => {
    it("should query cars based on filter criteria", async () => {
      const mockFiltered = [{ model: "Civic", engineType: "VTEC" }];
      Car.find.mockResolvedValue(mockFiltered);

      const result = await carService.getCars({ engineType: "VTEC" });

      expect(Car.find).toHaveBeenCalledWith({ engineType: "VTEC" });
      expect(result).toEqual(mockFiltered);
    });

    it("should throw AppError if find fails", async () => {
      Car.find.mockRejectedValue(new Error("Db error"));
      await expect(carService.getCars({})).rejects.toThrow(AppError);
    });
  });

  describe("deleteCarByModel", () => {
    it("should find and delete a car record by model name", async () => {
      const mockDeleted = { model: "Civic" };
      Car.findOneAndDelete.mockResolvedValue(mockDeleted);

      const result = await carService.deleteCarByModel("Civic");

      expect(Car.findOneAndDelete).toHaveBeenCalledWith({ model: "Civic" });
      expect(result).toEqual(mockDeleted);
    });

    it("should throw AppError if findOneAndDelete fails", async () => {
      Car.findOneAndDelete.mockRejectedValue(new Error("Db error"));
      await expect(carService.deleteCarByModel("Civic")).rejects.toThrow(
        AppError,
      );
    });
  });
});
