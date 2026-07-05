const bookingService = require("../../src/services/booking.service");
const Booking = require("../../src/models/Booking");

jest.mock("../../src/models/Booking");

describe("BookingService Unit Tests", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("createBooking", () => {
    it("should save and return new booking", async () => {
      const mockBookingData = { userEmail: "test@email.com" };
      const mockSave = jest.fn().mockResolvedValue(mockBookingData);

      // Mock the constructor behavior
      Booking.mockImplementation(() => ({
        save: mockSave,
      }));

      const result = await bookingService.createBooking(mockBookingData);

      expect(Booking).toHaveBeenCalledWith(mockBookingData);
      expect(mockSave).toHaveBeenCalled();
      expect(result).toEqual(mockBookingData);
    });
  });

  describe("getAllBookings", () => {
    it("should return all bookings", async () => {
      const mockBookings = [{ userEmail: "test@email.com" }];
      Booking.find.mockResolvedValue(mockBookings);

      const result = await bookingService.getAllBookings();

      expect(Booking.find).toHaveBeenCalled();
      expect(result).toEqual(mockBookings);
    });
  });

  describe("getBookingById", () => {
    it("should query for a specific booking by ID", async () => {
      const mockBooking = { userEmail: "test@email.com" };
      Booking.findById.mockResolvedValue(mockBooking);

      const result = await bookingService.getBookingById("12345");

      expect(Booking.findById).toHaveBeenCalledWith("12345");
      expect(result).toEqual(mockBooking);
    });
  });

  describe("getBookingsByUser", () => {
    it("should find bookings by user email/password and select out password", async () => {
      const mockBookings = [{ userEmail: "test@email.com" }];
      const mockSelect = jest.fn().mockResolvedValue(mockBookings);
      Booking.find.mockReturnValue({ select: mockSelect });

      const result = await bookingService.getBookingsByUser(
        "test@email.com",
        "pass",
      );

      expect(Booking.find).toHaveBeenCalledWith({
        userEmail: "test@email.com",
        password: "pass",
      });
      expect(mockSelect).toHaveBeenCalledWith("-password");
      expect(result).toEqual(mockBookings);
    });
  });

  describe("getBookingsByFlight", () => {
    it("should query by nested flightNumber", async () => {
      const mockBookings = [{ userEmail: "test@email.com" }];
      Booking.find.mockResolvedValue(mockBookings);

      const result = await bookingService.getBookingsByFlight("FL123");

      expect(Booking.find).toHaveBeenCalledWith({
        "flightDetails.flightNumber": "FL123",
      });
      expect(result).toEqual(mockBookings);
    });
  });

  describe("getBookingsByStatus", () => {
    it("should query by bookingStatus", async () => {
      const mockBookings = [{ userEmail: "test@email.com" }];
      Booking.find.mockResolvedValue(mockBookings);

      const result = await bookingService.getBookingsByStatus("CONFIRMED");

      expect(Booking.find).toHaveBeenCalledWith({ bookingStatus: "CONFIRMED" });
      expect(result).toEqual(mockBookings);
    });
  });

  describe("updateBookingByEmail", () => {
    it("should update booking by userEmail", async () => {
      const mockUpdated = { userEmail: "test@email.com", status: "UPDATED" };
      Booking.findOneAndUpdate.mockResolvedValue(mockUpdated);

      const result = await bookingService.updateBookingByEmail(
        "test@email.com",
        { status: "UPDATED" },
      );

      expect(Booking.findOneAndUpdate).toHaveBeenCalledWith(
        { userEmail: "test@email.com" },
        { status: "UPDATED" },
        { new: true, runValidators: true },
      );
      expect(result).toEqual(mockUpdated);
    });
  });

  describe("patchBookingByEmail", () => {
    it("should return null if booking not found", async () => {
      Booking.findOne.mockResolvedValue(null);
      const result = await bookingService.patchBookingByEmail(
        "test@email.com",
        [],
      );
      expect(result).toBeNull();
    });

    it("should throw an error for unsupported operation key or invalid op", async () => {
      const mockBooking = { toObject: () => ({ status: "CONFIRMED" }) };
      Booking.findOne.mockResolvedValue(mockBooking);

      const operations = [
        { keyName: "invalidKey", op: "/replace", updatedData: { val: 1 } },
      ];
      await expect(
        bookingService.patchBookingByEmail("test@email.com", operations),
      ).rejects.toThrow("Field 'invalidKey' not found in booking record");
    });

    it("should patch the booking when correct validation passes", async () => {
      const mockBooking = { toObject: () => ({ status: "CONFIRMED" }) };
      Booking.findOne.mockResolvedValue(mockBooking);

      const mockUpdated = { userEmail: "test@email.com", status: "SHIPPED" };
      Booking.findOneAndUpdate.mockResolvedValue(mockUpdated);

      const operations = [
        {
          keyName: "status",
          op: "/replace",
          updatedData: { status: "SHIPPED" },
        },
      ];
      const result = await bookingService.patchBookingByEmail(
        "test@email.com",
        operations,
      );

      expect(Booking.findOneAndUpdate).toHaveBeenCalledWith(
        { userEmail: "test@email.com" },
        { status: "SHIPPED" },
        { new: true, runValidators: true },
      );
      expect(result).toEqual(mockUpdated);
    });
  });

  describe("deleteBookingsByEmail", () => {
    it("should delete multiple travel records by email", async () => {
      const mockResult = { deletedCount: 2 };
      Booking.deleteMany.mockResolvedValue(mockResult);

      const result =
        await bookingService.deleteBookingsByEmail("test@email.com");

      expect(Booking.deleteMany).toHaveBeenCalledWith({
        userEmail: "test@email.com",
      });
      expect(result).toEqual(mockResult);
    });
  });

  describe("deleteAllBookings", () => {
    it("should delete all bookings from collection", async () => {
      const mockResult = { deletedCount: 10 };
      Booking.deleteMany.mockResolvedValue(mockResult);

      const result = await bookingService.deleteAllBookings();

      expect(Booking.deleteMany).toHaveBeenCalledWith({});
      expect(result).toEqual(mockResult);
    });
  });
});
