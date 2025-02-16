import { eq } from "drizzle-orm";
import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import {
  booking,
  hotel,
  hotelRoom,
  bookingHotel,
  passenger,
  passengerRoom,
  user,
} from "./schema";

//returned froom amadeus API when a call is made to Create Hotel Order
interface HotelResponse {
  data: {
    id: string;
    hotelBookings: [
      {
        hotelOffer: {
          checkInDate: string;
          checkOutDate: string;
          price: {
            base: string;
            currency: string;
          };
          roomQuantity: number;
        };
      }
    ];
  };
}

async function saveHotelBooking(
  db: PostgresJsDatabase,
  bookingId: string
): Promise<void> {
  try {
    const response = await fetch(
      `http://test.api.amadeus.com/v2/booking/hotel-orders/${bookingId}`
    );
    const jsonData = (await response.json()) as HotelResponse;

    type bookingHotelInsertType = typeof bookingHotel.$inferInsert;

    const newBookingHotelRecord: bookingHotelInsertType = {
      id: jsonData.data.id,
      bookingId: bookingId,
      hotelRoomId: jsonData.data.id,
      checkInDate: new Date(
        jsonData.data.hotelBookings[0].hotelOffer.checkInDate
      ),
      checkOutDate: new Date(
        jsonData.data.hotelBookings[0].hotelOffer.checkOutDate
      ),
      numberOfRooms: jsonData.data.hotelBookings[0].hotelOffer.roomQuantity,
      pricePerNight: jsonData.data.hotelBookings[0].hotelOffer.price.base,
      priceCurrency: jsonData.data.hotelBookings[0].hotelOffer.price.currency,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const result = await db
      .insert(bookingHotel)
      .values(newBookingHotelRecord)
      .returning();
    console.log("Successfully saved hotel booking data", result);
  } catch (error) {
    console.error("Error saving hotel booking:", error);
    throw error;
  }
}