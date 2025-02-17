import {
  pgTable,
  text,
  integer,
  timestamp,
  boolean,
  decimal,
  varchar,
} from "drizzle-orm/pg-core";
import { nanoid } from "nanoid";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});

export const paymentInfo = pgTable("payment_info", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => nanoid()),
  // Foreign key to the users table.
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  // Token used as a secure alias/reference for the card data
  token: varchar("token", { length: 255 }),
  // The encrypted credit card number
  encryptedCardNumber: text("encrypted_card_number"),
  // Initialization vector for AES encryption
  iv: text("iv"),
  // Card type (e.g., Visa, MasterCard, etc.)
  cardType: varchar("card_type", { length: 50 }),
  // The last 4 digits of the card number (used for display/reference)
  last4: varchar("last4", { length: 4 }),
  // Timestamp when the record was created
  createdAt: timestamp("created_at", {
    mode: "string",
    precision: 3,
  }).defaultNow(),
  // Timestamp when the record was last updated
  updatedAt: timestamp("updated_at", {
    mode: "string",
    precision: 3,
  }).defaultNow(),
});

export const passenger = pgTable("passenger", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => nanoid()),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  dateOfBirth: text("date_of_birth").notNull(),
  nationality: text("nationality").notNull(),
  passportNumber: text("passport_number").notNull(),
  passportExpiry: text("passport_expiry").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const booking = pgTable("booking", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => nanoid()),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  bookingReference: text("booking_reference").notNull().unique(),
  bookingType: text("booking_type").notNull(), // 'flight', 'hotel', 'both'
  status: text("status").notNull(),
  totalAmount: decimal("total_amount").notNull(),
  currency: text("currency").notNull(),
  paymentStatus: text("payment_status").notNull(),
  bookingDate: text("booking_date").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const bookingPassenger = pgTable("booking_passenger", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => nanoid()),
  bookingId: text("booking_id")
    .notNull()
    .references(() => booking.id, { onDelete: "cascade" }),
  passengerId: text("passenger_id")
    .notNull()
    .references(() => passenger.id, { onDelete: "cascade" }),
  isPrimary: boolean("is_primary").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const flight = pgTable("flight", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => nanoid()),
  flightNumber: text("flight_number").notNull(),
  airline: text("airline").notNull(),
  departureAirport: text("departure_airport").notNull(),
  arrivalAirport: text("arrival_airport").notNull(),
  departureTime: text("departure_time").notNull(),
  arrivalTime: text("arrival_time").notNull(),
  aircraftType: text("aircraft_type"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const bookingFlight = pgTable("booking_flight", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => nanoid()),
  bookingId: text("booking_id")
    .notNull()
    .references(() => booking.id, { onDelete: "cascade" }),
  flightId: text("flight_id")
    .notNull()
    .references(() => flight.id, { onDelete: "cascade" }),
  cabinClass: text("cabin_class").notNull(),
  priceAmount: decimal("price_amount").notNull(),
  priceCurrency: text("price_currency").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const passengerFlight = pgTable("passenger_flight", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => nanoid()),
  bookingFlightId: text("booking_flight_id")
    .notNull()
    .references(() => bookingFlight.id, { onDelete: "cascade" }),
  passengerId: text("passenger_id")
    .notNull()
    .references(() => passenger.id, { onDelete: "cascade" }),
  seatNumber: text("seat_number"),
  baggageAllowance: text("baggage_allowance"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const hotelRoom = pgTable("hotel_room", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => nanoid()),
  roomType: text("room_type").notNull(),
  description: text("description"),
  maxOccupancy: integer("max_occupancy").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const bookingHotel = pgTable("booking_hotel", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => nanoid()),
  bookingId: text("booking_id")
    .notNull()
    .references(() => booking.id, { onDelete: "cascade" }),
  hotelRoomId: text("hotel_room_id")
    .notNull()
    .references(() => hotelRoom.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  country: text("country").notNull(),
  starRating: integer("star_rating"),
  checkInDate: text("check_in_date").notNull(),
  checkOutDate: text("check_out_date").notNull(),
  numberOfRooms: integer("number_of_rooms").notNull(),
  pricePerNight: decimal("price_per_night").notNull(),
  priceCurrency: text("price_currency").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const passengerRoom = pgTable("passenger_room", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => nanoid()),
  bookingHotelId: text("booking_hotel_id")
    .notNull()
    .references(() => bookingHotel.id, { onDelete: "cascade" }),
  passengerId: text("passenger_id")
    .notNull()
    .references(() => passenger.id, { onDelete: "cascade" }),
  isPrimaryGuest: boolean("is_primary_guest").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
