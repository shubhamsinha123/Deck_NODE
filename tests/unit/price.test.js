const priceService = require("../../src/services/price.service");
const Price = require("../../src/models/Price");
const AppError = require("../../src/exceptions/AppError");

jest.mock("../../src/models/Price");

describe("PriceService Unit Tests", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("createPrices", () => {
    it("should call insertMany for arrays of prices", async () => {
      const mockPrices = [{ codeFrom: "JFK", price: "100" }];
      Price.insertMany.mockResolvedValue(mockPrices);

      const result = await priceService.createPrices(mockPrices);

      expect(Price.insertMany).toHaveBeenCalledWith(mockPrices);
      expect(result).toEqual(mockPrices);
    });

    it("should call create for a single price object", async () => {
      const mockPrice = { codeFrom: "LAX", price: "200" };
      Price.create.mockResolvedValue(mockPrice);

      const result = await priceService.createPrices(mockPrice);

      expect(Price.create).toHaveBeenCalledWith(mockPrice);
      expect(result).toEqual(mockPrice);
    });

    it("should throw AppError if create fails", async () => {
      Price.create.mockRejectedValue(new Error("Db error"));
      await expect(priceService.createPrices({})).rejects.toThrow(AppError);
    });
  });

  describe("updatePriceByCodeFrom", () => {
    it("should update price using codeFrom as the key query", async () => {
      const mockUpdated = { codeFrom: "JFK", price: "120" };
      Price.findOneAndUpdate.mockResolvedValue(mockUpdated);

      const result = await priceService.updatePriceByCodeFrom("JFK", {
        price: "120",
      });

      expect(Price.findOneAndUpdate).toHaveBeenCalledWith(
        { codeFrom: "JFK" },
        { price: "120" },
        { new: true },
      );
      expect(result).toEqual(mockUpdated);
    });

    it("should throw AppError if update fails", async () => {
      Price.findOneAndUpdate.mockRejectedValue(new Error("Db error"));
      await expect(
        priceService.updatePriceByCodeFrom("JFK", {}),
      ).rejects.toThrow(AppError);
    });
  });

  describe("getAllPrices", () => {
    it("should return all price records", async () => {
      const mockPrices = [{ codeFrom: "JFK" }];
      Price.find.mockResolvedValue(mockPrices);

      const result = await priceService.getAllPrices();

      expect(Price.find).toHaveBeenCalledWith({});
      expect(result).toEqual(mockPrices);
    });

    it("should throw AppError if find fails", async () => {
      Price.find.mockRejectedValue(new Error("Db error"));
      await expect(priceService.getAllPrices()).rejects.toThrow(AppError);
    });
  });
});
