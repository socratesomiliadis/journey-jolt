interface Airport {
    type?: string;
    time_zone: string;
    name: string;
    longitude: number;
    latitude: number;
    id: string;
    icao_code: string;
    iata_country_code: string;
    iata_code: string;
    iata_city_code?: string;
    city_name?: string;
    city: {
        name: string;
        id: string;
        iata_country_code: string;
        iata_code: string;
        airports?: Airport[];
    };
    airports?: Airport[];
}

interface Airline {
    name: string;
    logo_symbol_url: string;
    logo_lockup_url: string;
    id: string;
    iata_code: string;
    conditions_of_carriage_url: string;
}

interface Baggage {
    type: string;
    quantity: number;
}

interface Seat {
    name: string;
    disclosures: string[];
    designator: string;
}

export interface Passenger {
    seat?: Seat;
    passenger_id: string;
    cabin_class_marketing_name?: string;
    cabin_class?: string;
    baggages?: Baggage[];
    type?: string;
    title?: string;
    phone_number?: string;
    loyalty_programme_accounts?: {
        airline_iata_code: string;
        account_number: string;
    }[];
    infant_passenger_id?: string;
    id?: string;
    given_name?: string;
    gender?: string;
    family_name?: string;
    email?: string;
    born_on?: string;
}

export interface Aircraft {
    name: string;
    id: string;
    iata_code: string;
}

interface Stop {
    id: string;
    duration: string;
    departing_at: string;
    arriving_at: string;
    airport: Airport;
}

export interface Segment {
    stops?: Stop[];
    passengers: Passenger[];
    origin_terminal: string;
    origin: Airport;
    operating_carrier_flight_number: string;
    operating_carrier: Airline;
    marketing_carrier_flight_number: string;
    marketing_carrier: Airline;
    id: string;
    duration: string;
    distance: string;
    destination_terminal: string;
    destination: Airport;
    departing_at: string;
    arriving_at: string;
    aircraft: Aircraft;
}

interface Slice {
    segments: Segment[];
    origin_type: string;
    origin: Airport;
    id: string;
    fare_brand_name: string;
    duration: string;
    destination_type: string;
    destination: Airport;
    conditions?: {
        change_before_departure: {
        penalty_currency: string;
        penalty_amount: string;
        allowed: boolean;
        };
    };
}

interface Service {
    type: string;
    total_currency: string;
    total_amount: string;
    segment_ids: string[];
    quantity: number;
    passenger_ids: string[];
    metadata: {
        designator: string;
        disclosures: string[];
        name: string;
    };
    id: string;
}

interface PaymentStatus {
    price_guarantee_expires_at: string;
    payment_required_by: string;
    paid_at: string;
    awaiting_payment: boolean;
}

interface Change {
    slices: {
        remove: Slice[];
        add: Slice[];
    };
    refund_to: string;
    penalty_total_currency: string;
    penalty_total_amount: string;
    order_id: string;
    new_total_currency: string;
    new_total_amount: string;
    live_mode: boolean;
    id: string;
    expires_at: string;
    created_at: string;
    confirmed_at: string;
    change_total_currency: string;
    change_total_amount: string;
    }

interface AirlineInitiatedChange {
    updated_at: string;
    removed: Slice[];
    order_id: string;
    id: string;
    created_at: string;
    available_actions: string[];
    added: Slice[];
    action_taken_at: string;
    action_taken: string;
}

interface Cancellation {
    refund_to: string;
    refund_currency: string;
    refund_amount: string;
    order_id: string;
    live_mode: boolean;
    id: string;
    expires_at: string;
    created_at: string;
    confirmed_at: string;
    airline_credits: {
        passenger_id: string;
        issued_on: string;
        id: string;
        credit_name: string;
        credit_currency: string;
        credit_code: string;
        credit_amount: string;
    }[];
}

export interface FlightBookingResponse {
    data: {
        void_window_ends_at: string;
        users: string[];
        type: string;
        total_currency: string;
        total_amount: string;
        tax_currency: string;
        tax_amount: string;
        synced_at: string;
        slices: Slice[];
        services: Service[];
        payment_status: PaymentStatus;
        passengers: Passenger[];
        owner: Airline;
        offer_id: string;
        metadata: {
        customer_prefs: string;
        payment_intent_id: string;
        };
        live_mode: boolean;
        id: string;
        documents: {
        unique_identifier: string;
        type: string;
        passenger_ids: string[];
        }[];
        created_at: string;
        content: string;
        conditions: {
        refund_before_departure: {
            penalty_currency: string;
            penalty_amount: string;
            allowed: boolean;
        };
        change_before_departure: {
            penalty_currency: string;
            penalty_amount: string;
            allowed: boolean;
        };
        };
        changes: Change[];
        cancelled_at: string;
        cancellation: Cancellation;
        booking_reference: string;
        base_currency: string;
        base_amount: string;
        available_actions: string[];
        airline_initiated_changes: AirlineInitiatedChange[];
    };
}