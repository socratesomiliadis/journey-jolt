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
import { uuid } from "drizzle-orm/pg-core";

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

    const result = await db
      .insert(bookingHotel)
      .values({
        id: jsonData.data.id,
        bookingId: bookingId,
        hotelRoomId: jsonData.data.id,
        checkInDate: jsonData.data.hotelBookings[0].hotelOffer.checkInDate,
        checkOutDate: jsonData.data.hotelBookings[0].hotelOffer.checkOutDate,
        numberOfRooms: jsonData.data.hotelBookings[0].hotelOffer.roomQuantity,
        pricePerNight: jsonData.data.hotelBookings[0].hotelOffer.price.base,
        priceCurrency: jsonData.data.hotelBookings[0].hotelOffer.price.currency,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    console.log("Successfully saved hotel booking data");
  } catch (error) {
    console.error("Error saving hotel booking:", error);
    throw error;
  }
}
