import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { hotelRooms, bookingHotels } from "./tempMockData/mockHotelData";
import {
  hotelRoom,
  bookingHotel,
} from "./schema";

async function saveHotelBooking(
  db: PostgresJsDatabase,
  bookingId: string,
  hotelNumber: number,
  roomNumber: number
): Promise<void> {
  try {
    //TODO remove if no API is used or update with the correct API route
    const response = await fetch("");

    //TODO create hotelTypes in types fodler for coressponding interfaces or use mock data
    type bookingHotelInsertType = typeof bookingHotel.$inferInsert;
    type hotelRoomInsertType = typeof hotelRoom.$inferInsert;

    //based on mock data found in coressponfing folder
    const newBookingHotelRecord: bookingHotelInsertType = {
      bookingId: bookingHotels[hotelNumber].bookingId,
      hotelRoomId: bookingHotels[hotelNumber].hotelRoomId,
      name: bookingHotels[hotelNumber].name,
      address: bookingHotels[hotelNumber].address,
      city: bookingHotels[hotelNumber].city,
      country: bookingHotels[hotelNumber].country,
      starRating: bookingHotels[hotelNumber].starRating,
      checkInDate: bookingHotels[hotelNumber].checkInDate,
      checkOutDate: bookingHotels[hotelNumber].checkOutDate,
      numberOfRooms: bookingHotels[hotelNumber].numberOfRooms,
      pricePerNight: bookingHotels[hotelNumber].pricePerNight,
      priceCurrency: bookingHotels[hotelNumber].priceCurrency,
    };

    const newHotelRoomRecord: hotelRoomInsertType = {
      roomType: hotelRooms[roomNumber].roomType,
      description: hotelRooms[roomNumber].description,
      maxOccupancy: hotelRooms[roomNumber].maxOccupancy,
    };

    const bookingHotelResult = await db
      .insert(bookingHotel)
      .values(newBookingHotelRecord)
      .returning();
    console.log("Successfully saved booking hotel data", bookingHotelResult);

    const hotelRoomResult = await db
      .insert(hotelRoom)
      .values(newHotelRoomRecord)
      .returning();
    console.log("Successfully saved hotel room data", hotelRoomResult);
  } catch (error) {
    console.error("Error saving hotel booking:", error);
    throw error;
  }
}
