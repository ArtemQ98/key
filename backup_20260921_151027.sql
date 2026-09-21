--
-- PostgreSQL database dump
--

\restrict HjqslpcPKeBqraUOuHYfj9bojBnyHVyVAdfbmC9yWPIt8KZZDkClWyIibHtmoLG

-- Dumped from database version 17.11
-- Dumped by pg_dump version 17.11

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: calculate_rental_final_total(bigint); Type: FUNCTION; Schema: public; Owner: key
--

CREATE FUNCTION public.calculate_rental_final_total(rental_id bigint) RETURNS numeric
    LANGUAGE sql STABLE
    AS $$
    SELECT GREATEST(
        COALESCE(r.amount, 0)
        + COALESCE((SELECT SUM(total) FROM rental_extras WHERE rental_id = r.id), 0)
        + COALESCE((
            SELECT SUM(
                CASE
                    WHEN adjustment_type IN ('late_fee','damage_fee','other') THEN amount
                    ELSE -amount  -- discount
                END
            )
            FROM rental_adjustments
            WHERE rental_id = r.id
        ), 0),
        0
    )
    FROM rentals r
    WHERE r.id = rental_id;
$$;


ALTER FUNCTION public.calculate_rental_final_total(rental_id bigint) OWNER TO key;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: auth_codes; Type: TABLE; Schema: public; Owner: key
--

CREATE TABLE public.auth_codes (
    id bigint NOT NULL,
    phone text,
    code_hash text NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    used_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    email text
);


ALTER TABLE public.auth_codes OWNER TO key;

--
-- Name: auth_codes_id_seq; Type: SEQUENCE; Schema: public; Owner: key
--

CREATE SEQUENCE public.auth_codes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.auth_codes_id_seq OWNER TO key;

--
-- Name: auth_codes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: key
--

ALTER SEQUENCE public.auth_codes_id_seq OWNED BY public.auth_codes.id;


--
-- Name: car_expenses; Type: TABLE; Schema: public; Owner: key
--

CREATE TABLE public.car_expenses (
    id bigint NOT NULL,
    owner_id bigint NOT NULL,
    car_id bigint NOT NULL,
    expense_type text DEFAULT 'Другое'::text NOT NULL,
    amount numeric(12,2) DEFAULT 0 NOT NULL,
    note text DEFAULT ''::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT car_expenses_amount_check CHECK ((amount >= (0)::numeric))
);


ALTER TABLE public.car_expenses OWNER TO key;

--
-- Name: car_expenses_id_seq; Type: SEQUENCE; Schema: public; Owner: key
--

CREATE SEQUENCE public.car_expenses_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.car_expenses_id_seq OWNER TO key;

--
-- Name: car_expenses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: key
--

ALTER SEQUENCE public.car_expenses_id_seq OWNED BY public.car_expenses.id;


--
-- Name: car_photos; Type: TABLE; Schema: public; Owner: key
--

CREATE TABLE public.car_photos (
    id bigint NOT NULL,
    car_id bigint NOT NULL,
    url text NOT NULL,
    filename text DEFAULT ''::text NOT NULL,
    is_primary boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.car_photos OWNER TO key;

--
-- Name: car_photos_id_seq; Type: SEQUENCE; Schema: public; Owner: key
--

CREATE SEQUENCE public.car_photos_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.car_photos_id_seq OWNER TO key;

--
-- Name: car_photos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: key
--

ALTER SEQUENCE public.car_photos_id_seq OWNED BY public.car_photos.id;


--
-- Name: cars; Type: TABLE; Schema: public; Owner: key
--

CREATE TABLE public.cars (
    id bigint NOT NULL,
    owner_id bigint NOT NULL,
    brand text NOT NULL,
    model text NOT NULL,
    plate text NOT NULL,
    year integer NOT NULL,
    status text DEFAULT 'available'::text NOT NULL,
    revenue numeric(12,2) DEFAULT 0 NOT NULL,
    location text DEFAULT 'Санкт-Петербург'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    daily_price numeric(12,2) DEFAULT 0 NOT NULL,
    mileage integer DEFAULT 0 NOT NULL,
    color text DEFAULT ''::text NOT NULL,
    vin text DEFAULT ''::text NOT NULL,
    public_enabled boolean DEFAULT true NOT NULL,
    category text DEFAULT 'Седан'::text NOT NULL,
    seats integer DEFAULT 5 NOT NULL,
    transmission text DEFAULT 'Автомат'::text NOT NULL,
    fuel text DEFAULT 'Бензин'::text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    image_url text DEFAULT ''::text NOT NULL,
    deposit numeric(12,2) DEFAULT 20000 NOT NULL,
    engine_volume text DEFAULT ''::text NOT NULL,
    horsepower integer DEFAULT 0 NOT NULL,
    drive_type text DEFAULT ''::text NOT NULL,
    fuel_consumption text DEFAULT ''::text NOT NULL,
    tank_volume text DEFAULT ''::text NOT NULL,
    maintenance_interval integer DEFAULT 0 NOT NULL,
    rental_terms jsonb DEFAULT '[]'::jsonb NOT NULL,
    CONSTRAINT cars_status_check CHECK ((status = ANY (ARRAY['available'::text, 'rented'::text, 'maintenance'::text])))
);


ALTER TABLE public.cars OWNER TO key;

--
-- Name: cars_id_seq; Type: SEQUENCE; Schema: public; Owner: key
--

CREATE SEQUENCE public.cars_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cars_id_seq OWNER TO key;

--
-- Name: cars_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: key
--

ALTER SEQUENCE public.cars_id_seq OWNED BY public.cars.id;


--
-- Name: deposit_transactions; Type: TABLE; Schema: public; Owner: key
--

CREATE TABLE public.deposit_transactions (
    id bigint NOT NULL,
    rental_id bigint NOT NULL,
    transaction_type text NOT NULL,
    amount numeric(12,2) DEFAULT 0 NOT NULL,
    note text DEFAULT ''::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT deposit_transactions_transaction_type_check CHECK ((transaction_type = ANY (ARRAY['hold'::text, 'release'::text, 'charge'::text])))
);


ALTER TABLE public.deposit_transactions OWNER TO key;

--
-- Name: deposit_transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: key
--

CREATE SEQUENCE public.deposit_transactions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.deposit_transactions_id_seq OWNER TO key;

--
-- Name: deposit_transactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: key
--

ALTER SEQUENCE public.deposit_transactions_id_seq OWNED BY public.deposit_transactions.id;


--
-- Name: fleet_profiles; Type: TABLE; Schema: public; Owner: key
--

CREATE TABLE public.fleet_profiles (
    id bigint NOT NULL,
    owner_id bigint NOT NULL,
    slug text NOT NULL,
    title text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    city text DEFAULT 'Санкт-Петербург'::text NOT NULL,
    published boolean DEFAULT true NOT NULL,
    rating numeric(3,2) DEFAULT 5.00 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    logo_url text DEFAULT ''::text NOT NULL,
    phone text DEFAULT ''::text NOT NULL,
    email text DEFAULT ''::text NOT NULL,
    address text DEFAULT ''::text NOT NULL,
    avatar_url text DEFAULT ''::text NOT NULL
);


ALTER TABLE public.fleet_profiles OWNER TO key;

--
-- Name: fleet_profiles_id_seq; Type: SEQUENCE; Schema: public; Owner: key
--

CREATE SEQUENCE public.fleet_profiles_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.fleet_profiles_id_seq OWNER TO key;

--
-- Name: fleet_profiles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: key
--

ALTER SEQUENCE public.fleet_profiles_id_seq OWNED BY public.fleet_profiles.id;


--
-- Name: leads; Type: TABLE; Schema: public; Owner: key
--

CREATE TABLE public.leads (
    id bigint NOT NULL,
    name text NOT NULL,
    phone text NOT NULL,
    email text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.leads OWNER TO key;

--
-- Name: leads_id_seq; Type: SEQUENCE; Schema: public; Owner: key
--

CREATE SEQUENCE public.leads_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.leads_id_seq OWNER TO key;

--
-- Name: leads_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: key
--

ALTER SEQUENCE public.leads_id_seq OWNED BY public.leads.id;


--
-- Name: payments; Type: TABLE; Schema: public; Owner: key
--

CREATE TABLE public.payments (
    id bigint NOT NULL,
    owner_id bigint NOT NULL,
    provider text NOT NULL,
    external_id text,
    amount numeric(12,2) NOT NULL,
    currency text DEFAULT 'RUB'::text NOT NULL,
    plan text NOT NULL,
    period_months integer DEFAULT 1 NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    idempotency_key text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    paid_at timestamp with time zone,
    raw_payload jsonb
);


ALTER TABLE public.payments OWNER TO key;

--
-- Name: payments_id_seq; Type: SEQUENCE; Schema: public; Owner: key
--

CREATE SEQUENCE public.payments_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.payments_id_seq OWNER TO key;

--
-- Name: payments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: key
--

ALTER SEQUENCE public.payments_id_seq OWNED BY public.payments.id;


--
-- Name: rental_adjustments; Type: TABLE; Schema: public; Owner: key
--

CREATE TABLE public.rental_adjustments (
    id bigint NOT NULL,
    rental_id bigint NOT NULL,
    adjustment_type text NOT NULL,
    amount numeric(12,2) DEFAULT 0 NOT NULL,
    note text DEFAULT ''::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT rental_adjustments_adjustment_type_check CHECK ((adjustment_type = ANY (ARRAY['late_fee'::text, 'damage_fee'::text, 'discount'::text, 'other'::text])))
);


ALTER TABLE public.rental_adjustments OWNER TO key;

--
-- Name: rental_adjustments_id_seq; Type: SEQUENCE; Schema: public; Owner: key
--

CREATE SEQUENCE public.rental_adjustments_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.rental_adjustments_id_seq OWNER TO key;

--
-- Name: rental_adjustments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: key
--

ALTER SEQUENCE public.rental_adjustments_id_seq OWNED BY public.rental_adjustments.id;


--
-- Name: rental_events; Type: TABLE; Schema: public; Owner: key
--

CREATE TABLE public.rental_events (
    id bigint NOT NULL,
    rental_id bigint NOT NULL,
    actor_id bigint,
    actor_role text DEFAULT 'system'::text NOT NULL,
    event_type text NOT NULL,
    from_status text,
    to_status text,
    payload jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.rental_events OWNER TO key;

--
-- Name: rental_events_id_seq; Type: SEQUENCE; Schema: public; Owner: key
--

CREATE SEQUENCE public.rental_events_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.rental_events_id_seq OWNER TO key;

--
-- Name: rental_events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: key
--

ALTER SEQUENCE public.rental_events_id_seq OWNED BY public.rental_events.id;


--
-- Name: rental_expenses; Type: TABLE; Schema: public; Owner: key
--

CREATE TABLE public.rental_expenses (
    id bigint NOT NULL,
    rental_id bigint NOT NULL,
    expense_type text DEFAULT 'other'::text NOT NULL,
    amount numeric(12,2) DEFAULT 0 NOT NULL,
    note text DEFAULT ''::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.rental_expenses OWNER TO key;

--
-- Name: rental_expenses_id_seq; Type: SEQUENCE; Schema: public; Owner: key
--

CREATE SEQUENCE public.rental_expenses_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.rental_expenses_id_seq OWNER TO key;

--
-- Name: rental_expenses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: key
--

ALTER SEQUENCE public.rental_expenses_id_seq OWNED BY public.rental_expenses.id;


--
-- Name: rental_extras; Type: TABLE; Schema: public; Owner: key
--

CREATE TABLE public.rental_extras (
    id bigint NOT NULL,
    rental_id bigint NOT NULL,
    name text NOT NULL,
    qty integer DEFAULT 1 NOT NULL,
    unit_price numeric(12,2) DEFAULT 0 NOT NULL,
    total numeric(12,2) DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.rental_extras OWNER TO key;

--
-- Name: rental_extras_id_seq; Type: SEQUENCE; Schema: public; Owner: key
--

CREATE SEQUENCE public.rental_extras_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.rental_extras_id_seq OWNER TO key;

--
-- Name: rental_extras_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: key
--

ALTER SEQUENCE public.rental_extras_id_seq OWNED BY public.rental_extras.id;


--
-- Name: rental_inspections; Type: TABLE; Schema: public; Owner: key
--

CREATE TABLE public.rental_inspections (
    id bigint NOT NULL,
    rental_id bigint NOT NULL,
    kind text NOT NULL,
    mileage integer,
    fuel_level integer,
    notes text DEFAULT ''::text NOT NULL,
    photos jsonb DEFAULT '[]'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.rental_inspections OWNER TO key;

--
-- Name: rental_inspections_id_seq; Type: SEQUENCE; Schema: public; Owner: key
--

CREATE SEQUENCE public.rental_inspections_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.rental_inspections_id_seq OWNER TO key;

--
-- Name: rental_inspections_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: key
--

ALTER SEQUENCE public.rental_inspections_id_seq OWNED BY public.rental_inspections.id;


--
-- Name: rental_payments; Type: TABLE; Schema: public; Owner: key
--

CREATE TABLE public.rental_payments (
    id bigint NOT NULL,
    rental_id bigint NOT NULL,
    payment_type text DEFAULT 'rental'::text NOT NULL,
    status text DEFAULT 'paid'::text NOT NULL,
    amount numeric(12,2) DEFAULT 0 NOT NULL,
    provider text DEFAULT 'mock'::text NOT NULL,
    transaction_ref text DEFAULT ''::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.rental_payments OWNER TO key;

--
-- Name: rental_payments_id_seq; Type: SEQUENCE; Schema: public; Owner: key
--

CREATE SEQUENCE public.rental_payments_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.rental_payments_id_seq OWNER TO key;

--
-- Name: rental_payments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: key
--

ALTER SEQUENCE public.rental_payments_id_seq OWNED BY public.rental_payments.id;


--
-- Name: rental_status_history; Type: TABLE; Schema: public; Owner: key
--

CREATE TABLE public.rental_status_history (
    id bigint NOT NULL,
    rental_id bigint NOT NULL,
    status text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.rental_status_history OWNER TO key;

--
-- Name: rental_status_history_id_seq; Type: SEQUENCE; Schema: public; Owner: key
--

CREATE SEQUENCE public.rental_status_history_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.rental_status_history_id_seq OWNER TO key;

--
-- Name: rental_status_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: key
--

ALTER SEQUENCE public.rental_status_history_id_seq OWNED BY public.rental_status_history.id;


--
-- Name: rentals; Type: TABLE; Schema: public; Owner: key
--

CREATE TABLE public.rentals (
    id bigint NOT NULL,
    owner_id bigint NOT NULL,
    car_name text NOT NULL,
    client_name text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    amount numeric(12,2) DEFAULT 0 NOT NULL,
    starts_at timestamp with time zone,
    ends_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    client_phone text DEFAULT ''::text NOT NULL,
    car_id bigint,
    client_user_id bigint,
    source text DEFAULT 'owner'::text NOT NULL,
    booking_code text,
    subtotal numeric(12,2) DEFAULT 0 NOT NULL,
    deposit numeric(12,2) DEFAULT 0 NOT NULL,
    payment_status text DEFAULT 'unpaid'::text NOT NULL,
    hold_expires_at timestamp with time zone,
    pickup_location text DEFAULT ''::text NOT NULL,
    dropoff_location text DEFAULT ''::text NOT NULL,
    cancellation_reason text DEFAULT ''::text NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    pickup_at timestamp with time zone,
    returned_at timestamp with time zone,
    odometer_start integer,
    odometer_end integer,
    fuel_start integer,
    fuel_end integer,
    late_fee numeric(12,2) DEFAULT 0 NOT NULL,
    damage_fee numeric(12,2) DEFAULT 0 NOT NULL,
    final_total numeric(12,2) DEFAULT 0 NOT NULL,
    extension_count integer DEFAULT 0 NOT NULL,
    pickup_meeting_at timestamp with time zone,
    pickup_meeting_location text DEFAULT ''::text NOT NULL,
    return_meeting_at timestamp with time zone,
    return_meeting_location text DEFAULT ''::text NOT NULL,
    CONSTRAINT rentals_status_check CHECK ((status = ANY (ARRAY['hold'::text, 'pending'::text, 'review'::text, 'confirmed'::text, 'preparing'::text, 'active'::text, 'returned'::text, 'completed'::text, 'cancelled'::text, 'expired'::text, 'rejected'::text])))
);


ALTER TABLE public.rentals OWNER TO key;

--
-- Name: rentals_id_seq; Type: SEQUENCE; Schema: public; Owner: key
--

CREATE SEQUENCE public.rentals_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.rentals_id_seq OWNER TO key;

--
-- Name: rentals_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: key
--

ALTER SEQUENCE public.rentals_id_seq OWNED BY public.rentals.id;


--
-- Name: user_notifications; Type: TABLE; Schema: public; Owner: key
--

CREATE TABLE public.user_notifications (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    is_read boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.user_notifications OWNER TO key;

--
-- Name: user_notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: key
--

CREATE SEQUENCE public.user_notifications_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_notifications_id_seq OWNER TO key;

--
-- Name: user_notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: key
--

ALTER SEQUENCE public.user_notifications_id_seq OWNED BY public.user_notifications.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: key
--

CREATE TABLE public.users (
    id bigint NOT NULL,
    name text NOT NULL,
    email text,
    password_hash text,
    role text DEFAULT 'owner'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    phone text,
    phone_verified boolean DEFAULT false NOT NULL,
    city text DEFAULT 'Санкт-Петербург'::text NOT NULL,
    company_name text DEFAULT ''::text NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    avatar_url text DEFAULT ''::text NOT NULL,
    plan text DEFAULT 'free'::text NOT NULL,
    plan_expires_at timestamp with time zone,
    cars_limit integer DEFAULT 3 NOT NULL,
    CONSTRAINT users_plan_check CHECK ((plan = ANY (ARRAY['free'::text, 'pro'::text, 'business'::text, 'enterprise'::text])))
);


ALTER TABLE public.users OWNER TO key;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: key
--

CREATE SEQUENCE public.users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO key;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: key
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: verifications; Type: TABLE; Schema: public; Owner: key
--

CREATE TABLE public.verifications (
    id bigint NOT NULL,
    owner_id bigint NOT NULL,
    user_id bigint NOT NULL,
    stage text NOT NULL,
    score integer DEFAULT 0 NOT NULL,
    status text DEFAULT 'review'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    progress integer DEFAULT 20 NOT NULL,
    risk_level text DEFAULT 'medium'::text NOT NULL,
    client_phone text DEFAULT ''::text NOT NULL
);


ALTER TABLE public.verifications OWNER TO key;

--
-- Name: verifications_id_seq; Type: SEQUENCE; Schema: public; Owner: key
--

CREATE SEQUENCE public.verifications_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.verifications_id_seq OWNER TO key;

--
-- Name: verifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: key
--

ALTER SEQUENCE public.verifications_id_seq OWNED BY public.verifications.id;


--
-- Name: auth_codes id; Type: DEFAULT; Schema: public; Owner: key
--

ALTER TABLE ONLY public.auth_codes ALTER COLUMN id SET DEFAULT nextval('public.auth_codes_id_seq'::regclass);


--
-- Name: car_expenses id; Type: DEFAULT; Schema: public; Owner: key
--

ALTER TABLE ONLY public.car_expenses ALTER COLUMN id SET DEFAULT nextval('public.car_expenses_id_seq'::regclass);


--
-- Name: car_photos id; Type: DEFAULT; Schema: public; Owner: key
--

ALTER TABLE ONLY public.car_photos ALTER COLUMN id SET DEFAULT nextval('public.car_photos_id_seq'::regclass);


--
-- Name: cars id; Type: DEFAULT; Schema: public; Owner: key
--

ALTER TABLE ONLY public.cars ALTER COLUMN id SET DEFAULT nextval('public.cars_id_seq'::regclass);


--
-- Name: deposit_transactions id; Type: DEFAULT; Schema: public; Owner: key
--

ALTER TABLE ONLY public.deposit_transactions ALTER COLUMN id SET DEFAULT nextval('public.deposit_transactions_id_seq'::regclass);


--
-- Name: fleet_profiles id; Type: DEFAULT; Schema: public; Owner: key
--

ALTER TABLE ONLY public.fleet_profiles ALTER COLUMN id SET DEFAULT nextval('public.fleet_profiles_id_seq'::regclass);


--
-- Name: leads id; Type: DEFAULT; Schema: public; Owner: key
--

ALTER TABLE ONLY public.leads ALTER COLUMN id SET DEFAULT nextval('public.leads_id_seq'::regclass);


--
-- Name: payments id; Type: DEFAULT; Schema: public; Owner: key
--

ALTER TABLE ONLY public.payments ALTER COLUMN id SET DEFAULT nextval('public.payments_id_seq'::regclass);


--
-- Name: rental_adjustments id; Type: DEFAULT; Schema: public; Owner: key
--

ALTER TABLE ONLY public.rental_adjustments ALTER COLUMN id SET DEFAULT nextval('public.rental_adjustments_id_seq'::regclass);


--
-- Name: rental_events id; Type: DEFAULT; Schema: public; Owner: key
--

ALTER TABLE ONLY public.rental_events ALTER COLUMN id SET DEFAULT nextval('public.rental_events_id_seq'::regclass);


--
-- Name: rental_expenses id; Type: DEFAULT; Schema: public; Owner: key
--

ALTER TABLE ONLY public.rental_expenses ALTER COLUMN id SET DEFAULT nextval('public.rental_expenses_id_seq'::regclass);


--
-- Name: rental_extras id; Type: DEFAULT; Schema: public; Owner: key
--

ALTER TABLE ONLY public.rental_extras ALTER COLUMN id SET DEFAULT nextval('public.rental_extras_id_seq'::regclass);


--
-- Name: rental_inspections id; Type: DEFAULT; Schema: public; Owner: key
--

ALTER TABLE ONLY public.rental_inspections ALTER COLUMN id SET DEFAULT nextval('public.rental_inspections_id_seq'::regclass);


--
-- Name: rental_payments id; Type: DEFAULT; Schema: public; Owner: key
--

ALTER TABLE ONLY public.rental_payments ALTER COLUMN id SET DEFAULT nextval('public.rental_payments_id_seq'::regclass);


--
-- Name: rental_status_history id; Type: DEFAULT; Schema: public; Owner: key
--

ALTER TABLE ONLY public.rental_status_history ALTER COLUMN id SET DEFAULT nextval('public.rental_status_history_id_seq'::regclass);


--
-- Name: rentals id; Type: DEFAULT; Schema: public; Owner: key
--

ALTER TABLE ONLY public.rentals ALTER COLUMN id SET DEFAULT nextval('public.rentals_id_seq'::regclass);


--
-- Name: user_notifications id; Type: DEFAULT; Schema: public; Owner: key
--

ALTER TABLE ONLY public.user_notifications ALTER COLUMN id SET DEFAULT nextval('public.user_notifications_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: key
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: verifications id; Type: DEFAULT; Schema: public; Owner: key
--

ALTER TABLE ONLY public.verifications ALTER COLUMN id SET DEFAULT nextval('public.verifications_id_seq'::regclass);


--
-- Data for Name: auth_codes; Type: TABLE DATA; Schema: public; Owner: key
--

COPY public.auth_codes (id, phone, code_hash, expires_at, used_at, created_at, email) FROM stdin;
1	+79028403940	3a78ffbcdfb809c636049b18f768c5f73bcb9f0663880fdbe1248a78b748d18c	2026-09-21 11:36:12.118115+00	2026-09-21 11:35:54.689281+00	2026-09-21 11:31:12.118115+00	\N
2	+79028403940	d460f5b173b26e1ec42e7d62a2b80fe040a605e05f816ae236d908cce9a922c1	2026-09-21 11:40:54.693058+00	\N	2026-09-21 11:35:54.693058+00	\N
4	\N	e8ba96a5de477358ba6274208a7c0ee28a011167ffa8530ad1fb98b21981a6cf	2026-09-21 11:59:16.146928+00	2026-09-21 11:54:41.729375+00	2026-09-21 11:54:16.146928+00	artemq98@yandex.ru
5	\N	29ba281cd73e2f798dd21a0c60bb636efb6c22e99be4fbd2cc7ae0acfcdd2e48	2026-09-21 11:59:41.732101+00	2026-09-21 11:57:53.615642+00	2026-09-21 11:54:41.732101+00	artemq98@yandex.ru
6	\N	1e9cefa24b64da2b39bbec2113d1d112da67f5b99d175e0072f6962dd5aa8e46	2026-09-21 12:02:53.618994+00	2026-09-21 11:58:36.297116+00	2026-09-21 11:57:53.618994+00	artemq98@yandex.ru
7	\N	f8f4c4d33be157a4eb66a9078c97d9d59f8640c04e5f24919a8c815bc432daa5	2026-09-21 12:03:36.298593+00	2026-09-21 12:06:29.694158+00	2026-09-21 11:58:36.298593+00	artemq98@yandex.ru
8	\N	024640d6f721b56fc5f22bd4633748b49cdfb64b7c197d4adfb56270db673438	2026-09-21 12:11:29.698974+00	2026-09-21 12:06:59.758703+00	2026-09-21 12:06:29.698974+00	artemq98@yandex.ru
\.


--
-- Data for Name: car_expenses; Type: TABLE DATA; Schema: public; Owner: key
--

COPY public.car_expenses (id, owner_id, car_id, expense_type, amount, note, created_at) FROM stdin;
1	1	1	Мойка	2000.00		2026-09-19 10:45:02.147713+00
2	1	1	ремонт	15000.00		2026-09-19 13:43:40.491941+00
3	1	1	Пизда фаре братан	10000.00		2026-09-20 18:30:52.697761+00
\.


--
-- Data for Name: car_photos; Type: TABLE DATA; Schema: public; Owner: key
--

COPY public.car_photos (id, car_id, url, filename, is_primary, created_at) FROM stdin;
1	1	/uploads/cars/45968f433f2059baa2285467.jpg	2022_Kia_K5_GT-Line_in_Pacific_Blue,_Front_Left,_09-05-2022.jpg	t	2026-09-19 13:46:36.804431+00
\.


--
-- Data for Name: cars; Type: TABLE DATA; Schema: public; Owner: key
--

COPY public.cars (id, owner_id, brand, model, plate, year, status, revenue, location, created_at, daily_price, mileage, color, vin, public_enabled, category, seats, transmission, fuel, description, image_url, deposit, engine_volume, horsepower, drive_type, fuel_consumption, tank_volume, maintenance_interval, rental_terms) FROM stdin;
1	1	Kia	K5	А001ЕЕ777	2024	available	100000.00	Москва	2026-09-19 08:29:08.071367+00	3500.00	0			t	Седан	5	Автомат	Бензин		/uploads/cars/45968f433f2059baa2285467.jpg	0.00		0				0	[{"items": ["Минимум 2 суток"], "title": "Аренда"}]
4	1	Kia	K5	А123АА71	2026	available	0.00	Санкт-Петербург	2026-09-21 09:45:16.054641+00	3500.00	0			t	Седан	5	Автомат	Бензин			0.00	2.5л	140	Передний	8л/100км	60л	10000	[{"items": ["Аренда от 2 дней"], "title": "Аренда"}]
\.


--
-- Data for Name: deposit_transactions; Type: TABLE DATA; Schema: public; Owner: key
--

COPY public.deposit_transactions (id, rental_id, transaction_type, amount, note, created_at) FROM stdin;
1	10	charge	5000.00	Поцарапал бампер	2026-09-20 17:47:25.444514+00
\.


--
-- Data for Name: fleet_profiles; Type: TABLE DATA; Schema: public; Owner: key
--

COPY public.fleet_profiles (id, owner_id, slug, title, description, city, published, rating, created_at, updated_at, logo_url, phone, email, address, avatar_url) FROM stdin;
1	1	artteam	Иван Автобарыга		Тула	t	5.00	2026-09-19 08:29:07.970854+00	2026-09-21 10:45:08.063079+00					/uploads/fleets/fleet-b5060479d46c734a67413134.jpg
5	6	artteam1	Артём	Самый лучший автопарк в Туле	Тула	t	5.00	2026-09-21 10:46:13.334635+00	2026-09-21 10:47:17.139206+00					/uploads/fleets/fleet-939ec126d9df83bb3b07dfc2.jpg
10	7	fleet-7	Артём Курочкин		Санкт-Петербург	t	5.00	2026-09-21 12:06:15.881444+00	2026-09-21 12:06:15.881444+00					
\.


--
-- Data for Name: leads; Type: TABLE DATA; Schema: public; Owner: key
--

COPY public.leads (id, name, phone, email, created_at) FROM stdin;
\.


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: key
--

COPY public.payments (id, owner_id, provider, external_id, amount, currency, plan, period_months, status, idempotency_key, created_at, paid_at, raw_payload) FROM stdin;
\.


--
-- Data for Name: rental_adjustments; Type: TABLE DATA; Schema: public; Owner: key
--

COPY public.rental_adjustments (id, rental_id, adjustment_type, amount, note, created_at) FROM stdin;
\.


--
-- Data for Name: rental_events; Type: TABLE DATA; Schema: public; Owner: key
--

COPY public.rental_events (id, rental_id, actor_id, actor_role, event_type, from_status, to_status, payload, created_at) FROM stdin;
1	1	2	customer	booking_created	\N	pending	{"source": "marketplace"}	2026-09-19 08:29:08.217173+00
2	1	1	owner	status_change	pending	confirmed	{"reason": ""}	2026-09-19 08:29:08.266456+00
3	1	1	owner	status_change	confirmed	preparing	{"reason": ""}	2026-09-19 08:29:08.29199+00
4	1	1	owner	status_change	preparing	active	{"reason": ""}	2026-09-19 08:29:08.302413+00
5	1	1	owner	status_change	active	returned	{"reason": ""}	2026-09-19 08:29:08.323773+00
6	1	1	owner	status_change	returned	completed	{"reason": ""}	2026-09-19 08:29:08.345115+00
7	2	1	owner	manual_created	\N	pending	{"source": "owner"}	2026-09-19 10:44:14.704288+00
8	2	1	owner	status_change	pending	review	{"reason": ""}	2026-09-19 10:44:21.329215+00
9	2	1	owner	status_change	review	confirmed	{"reason": ""}	2026-09-19 10:44:23.995526+00
10	2	1	owner	status_change	confirmed	preparing	{"reason": ""}	2026-09-19 10:44:27.612147+00
11	2	1	owner	status_change	preparing	active	{"reason": ""}	2026-09-19 10:44:31.179104+00
12	2	1	owner	status_change	active	returned	{"reason": ""}	2026-09-19 10:44:33.860644+00
13	2	1	owner	status_change	returned	completed	{"reason": ""}	2026-09-19 10:44:35.078901+00
14	3	1	owner	manual_created	\N	pending	{"source": "owner"}	2026-09-19 11:08:01.506039+00
15	3	1	owner	status_change	pending	review	{"reason": ""}	2026-09-19 11:08:04.847771+00
16	3	1	owner	status_change	review	confirmed	{"reason": ""}	2026-09-19 11:08:05.380618+00
17	3	1	owner	status_change	confirmed	preparing	{"reason": ""}	2026-09-19 11:08:06.247185+00
18	3	1	owner	status_change	preparing	active	{"reason": ""}	2026-09-19 11:08:16.031374+00
19	3	1	owner	status_change	active	returned	{"reason": ""}	2026-09-19 11:12:22.815004+00
20	3	1	owner	status_change	returned	completed	{"reason": ""}	2026-09-19 11:12:23.925834+00
21	4	1	owner	manual_created	\N	pending	{"source": "owner"}	2026-09-19 11:17:48.698001+00
22	4	1	owner	status_change	pending	review	{"reason": ""}	2026-09-19 11:18:04.041579+00
23	4	1	owner	status_change	review	confirmed	{"reason": ""}	2026-09-19 11:18:04.507751+00
24	4	1	owner	status_change	confirmed	preparing	{"reason": ""}	2026-09-19 11:18:05.190069+00
25	4	1	owner	status_change	preparing	active	{"reason": ""}	2026-09-19 11:18:11.84543+00
26	4	1	owner	status_change	active	returned	{"reason": ""}	2026-09-19 11:18:12.990436+00
27	4	1	owner	payment_status	\N	\N	{"status": "paid"}	2026-09-19 11:21:24.452805+00
28	4	1	owner	status_change	returned	completed	{"reason": ""}	2026-09-19 11:21:25.541474+00
30	5	1	owner	status_change	pending	review	{"reason": ""}	2026-09-19 13:39:48.876016+00
31	5	1	owner	status_change	review	confirmed	{"reason": ""}	2026-09-19 13:40:06.341127+00
32	5	1	owner	status_change	confirmed	preparing	{"reason": ""}	2026-09-19 13:40:13.308867+00
33	5	1	owner	status_change	preparing	active	{"reason": ""}	2026-09-19 13:40:30.591357+00
34	5	1	owner	payment_status	\N	\N	{"status": "paid"}	2026-09-19 13:42:15.666835+00
35	5	1	owner	payment_status	\N	\N	{"status": "unpaid"}	2026-09-19 13:42:17.627725+00
36	5	1	owner	payment_status	\N	\N	{"status": "paid"}	2026-09-19 13:42:18.159677+00
37	5	1	owner	payment_status	\N	\N	{"status": "unpaid"}	2026-09-19 13:42:19.409708+00
38	5	1	owner	status_change	active	returned	{"reason": ""}	2026-09-19 13:42:22.189023+00
39	5	1	owner	payment_status	\N	\N	{"status": "paid"}	2026-09-19 13:42:26.707894+00
40	5	1	owner	status_change	returned	completed	{"reason": ""}	2026-09-19 13:42:27.722846+00
41	5	1	owner	payment_status	\N	\N	{"status": "unpaid"}	2026-09-19 13:42:35.042576+00
42	5	1	owner	payment_status	\N	\N	{"status": "paid"}	2026-09-19 13:42:35.492216+00
44	6	1	owner	status_change	pending	confirmed	{"reason": ""}	2026-09-20 17:21:19.744048+00
45	6	1	owner	status_change	confirmed	preparing	{"reason": ""}	2026-09-20 17:21:22.176779+00
46	6	1	owner	status_change	preparing	active	{"reason": ""}	2026-09-20 17:21:27.542589+00
47	6	1	owner	status_change	active	returned	{"reason": ""}	2026-09-20 17:21:29.425358+00
48	6	1	owner	payment_status	\N	\N	{"status": "paid"}	2026-09-20 17:21:34.431534+00
49	6	1	owner	status_change	returned	completed	{"reason": ""}	2026-09-20 17:21:35.709278+00
50	7	1	owner	manual_created	\N	pending	{"source": "owner"}	2026-09-20 17:34:05.040227+00
51	7	1	owner	status_change	pending	review	{"reason": ""}	2026-09-20 17:34:11.646025+00
52	7	1	owner	status_change	review	confirmed	{"reason": ""}	2026-09-20 17:34:15.379595+00
53	7	1	owner	status_change	confirmed	preparing	{"reason": ""}	2026-09-20 17:34:18.396212+00
54	7	1	owner	status_change	preparing	cancelled	{"reason": ""}	2026-09-20 17:36:55.896029+00
55	8	1	owner	manual_created	\N	pending	{"source": "owner"}	2026-09-20 17:37:17.915417+00
56	8	1	owner	status_change	pending	review	{"reason": ""}	2026-09-20 17:37:32.829443+00
57	8	1	owner	status_change	review	confirmed	{"reason": ""}	2026-09-20 17:37:43.227639+00
58	8	1	owner	status_change	confirmed	preparing	{"reason": ""}	2026-09-20 17:37:53.344505+00
59	8	1	owner	status_change	preparing	active	{"reason": ""}	2026-09-20 17:38:02.461577+00
60	8	1	owner	status_change	active	returned	{"reason": ""}	2026-09-20 17:38:11.010479+00
61	8	1	owner	payment_status	\N	\N	{"status": "paid"}	2026-09-20 17:42:13.152654+00
62	8	1	owner	status_change	returned	completed	{"reason": ""}	2026-09-20 17:42:14.327965+00
63	9	1	owner	manual_created	\N	pending	{"source": "owner"}	2026-09-20 17:42:34.01553+00
64	9	1	owner	status_change	pending	review	{"reason": ""}	2026-09-20 17:42:38.743907+00
65	9	1	owner	status_change	review	confirmed	{"reason": ""}	2026-09-20 17:42:40.544434+00
66	9	1	owner	status_change	confirmed	preparing	{"reason": ""}	2026-09-20 17:42:42.493977+00
67	9	1	owner	status_change	preparing	active	{"reason": ""}	2026-09-20 17:42:44.143933+00
68	9	1	owner	status_change	active	returned	{"reason": ""}	2026-09-20 17:42:49.510542+00
69	9	1	owner	payment_status	\N	\N	{"status": "paid"}	2026-09-20 17:43:44.611426+00
72	10	1	owner	status_change	pending	review	{"reason": ""}	2026-09-20 17:46:18.426485+00
73	10	1	owner	status_change	review	confirmed	{"reason": ""}	2026-09-20 17:46:21.779508+00
75	10	1	owner	status_change	preparing	active	{"reason": ""}	2026-09-20 17:46:24.942499+00
70	9	1	owner	status_change	returned	completed	{"reason": ""}	2026-09-20 17:43:50.509817+00
71	10	1	owner	manual_created	\N	pending	{"source": "owner"}	2026-09-20 17:46:09.4661+00
74	10	1	owner	status_change	confirmed	preparing	{"reason": ""}	2026-09-20 17:46:23.991902+00
76	10	1	owner	status_change	active	returned	{"reason": ""}	2026-09-20 17:46:25.557514+00
77	10	1	owner	payment_status	\N	\N	{"status": "paid"}	2026-09-20 17:46:27.147528+00
78	10	1	owner	status_change	returned	completed	{"reason": ""}	2026-09-20 17:47:27.724893+00
80	11	1	owner	status_change	pending	review	{"reason": ""}	2026-09-20 17:54:27.207806+00
81	11	1	owner	status_change	review	confirmed	{"reason": ""}	2026-09-20 17:54:28.506933+00
82	11	1	owner	status_change	confirmed	preparing	{"reason": ""}	2026-09-20 17:54:29.523179+00
83	11	1	owner	status_change	preparing	active	{"reason": ""}	2026-09-20 17:54:43.641463+00
84	11	1	owner	payment_status	\N	\N	{"status": "paid"}	2026-09-20 17:54:51.950247+00
85	11	1	owner	payment_status	\N	\N	{"status": "unpaid"}	2026-09-20 17:54:55.409224+00
86	11	1	owner	extension	\N	\N	{"new_end": "2026-10-01T20:55:00Z"}	2026-09-20 17:55:08.029651+00
87	11	1	owner	extension	\N	\N	{"new_end": "2026-10-03T20:55:00Z"}	2026-09-20 17:55:35.310908+00
88	11	1	owner	payment_status	\N	\N	{"status": "paid"}	2026-09-20 17:56:43.476111+00
89	11	1	owner	status_change	active	returned	{"reason": ""}	2026-09-20 17:56:44.222185+00
90	11	1	owner	status_change	returned	completed	{"reason": ""}	2026-09-20 17:56:44.705632+00
92	12	1	owner	status_change	pending	rejected	{"reason": ""}	2026-09-20 17:57:19.023641+00
96	14	1	owner	status_change	pending	review	{"reason": ""}	2026-09-20 18:25:30.418827+00
97	14	1	owner	status_change	review	confirmed	{"reason": ""}	2026-09-20 18:25:31.766317+00
98	14	1	owner	meeting_scheduled	\N	\N	{"at": "2026-10-04T10:10:00Z", "kind": "pickup", "location": "ул Пушкина 47"}	2026-09-20 18:28:06.587157+00
99	14	1	owner	payment_status	\N	\N	{"status": "paid"}	2026-09-20 18:28:24.288775+00
100	14	1	owner	payment_status	\N	\N	{"status": "unpaid"}	2026-09-20 18:28:25.432397+00
101	14	1	owner	payment_status	\N	\N	{"status": "paid"}	2026-09-20 18:28:26.033332+00
102	14	1	owner	payment_status	\N	\N	{"status": "unpaid"}	2026-09-20 18:28:26.850397+00
103	14	1	owner	status_change	confirmed	preparing	{"reason": ""}	2026-09-20 18:28:28.664148+00
104	14	1	owner	status_change	preparing	active	{"reason": ""}	2026-09-20 18:28:30.049624+00
105	14	1	owner	status_change	active	returned	{"reason": ""}	2026-09-20 18:28:42.696164+00
106	14	1	owner	payment_status	\N	\N	{"status": "paid"}	2026-09-20 18:28:48.174616+00
107	14	1	owner	status_change	returned	completed	{"reason": ""}	2026-09-20 18:28:49.530641+00
29	5	\N	customer	booking_created	\N	pending	{"source": "marketplace"}	2026-09-19 13:39:09.493735+00
43	6	\N	customer	booking_created	\N	pending	{"source": "marketplace"}	2026-09-20 17:21:04.610318+00
79	11	\N	customer	booking_created	\N	pending	{"source": "marketplace"}	2026-09-20 17:53:51.160119+00
91	12	\N	customer	booking_created	\N	pending	{"source": "marketplace"}	2026-09-20 17:57:03.256443+00
93	13	\N	customer	booking_created	\N	pending	{"source": "marketplace"}	2026-09-20 17:57:42.342489+00
94	14	\N	customer	booking_created	\N	pending	{"source": "marketplace"}	2026-09-20 18:23:59.487346+00
95	13	\N	customer	status_change	pending	cancelled	{"reason": "Отменено клиентом"}	2026-09-20 18:24:11.201444+00
\.


--
-- Data for Name: rental_expenses; Type: TABLE DATA; Schema: public; Owner: key
--

COPY public.rental_expenses (id, rental_id, expense_type, amount, note, created_at) FROM stdin;
\.


--
-- Data for Name: rental_extras; Type: TABLE DATA; Schema: public; Owner: key
--

COPY public.rental_extras (id, rental_id, name, qty, unit_price, total, created_at) FROM stdin;
1	5		1	0.00	0.00	2026-09-19 13:42:38.941221+00
2	14	Животные	1	500.00	500.00	2026-09-20 18:26:48.198187+00
\.


--
-- Data for Name: rental_inspections; Type: TABLE DATA; Schema: public; Owner: key
--

COPY public.rental_inspections (id, rental_id, kind, mileage, fuel_level, notes, photos, created_at) FROM stdin;
1	14	pickup	300000	\N		null	2026-09-20 18:26:19.483025+00
\.


--
-- Data for Name: rental_payments; Type: TABLE DATA; Schema: public; Owner: key
--

COPY public.rental_payments (id, rental_id, payment_type, status, amount, provider, transaction_ref, created_at) FROM stdin;
1	4	rental	paid	7000.00	manual		2026-09-19 11:21:24.448251+00
2	5	rental	paid	10500.00	manual		2026-09-19 13:42:15.665346+00
3	5	rental	paid	10500.00	manual		2026-09-19 13:42:18.15868+00
4	5	rental	paid	10500.00	manual		2026-09-19 13:42:26.707375+00
5	5	rental	paid	10500.00	manual		2026-09-19 13:42:35.491383+00
6	6	rental	paid	10500.00	manual		2026-09-20 17:21:34.429496+00
7	8	rental	paid	7000.00	manual		2026-09-20 17:42:13.14973+00
8	9	rental	paid	7000.00	manual		2026-09-20 17:43:44.610527+00
9	10	rental	paid	5000.00	manual		2026-09-20 17:46:27.145756+00
10	11	rental	paid	7000.00	manual		2026-09-20 17:54:51.94698+00
11	11	rental	paid	7000.00	manual		2026-09-20 17:56:43.474776+00
12	14	rental	paid	14500.00	manual		2026-09-20 18:28:24.28526+00
13	14	rental	paid	14500.00	manual		2026-09-20 18:28:26.03234+00
14	14	rental	paid	14500.00	manual		2026-09-20 18:28:48.172422+00
\.


--
-- Data for Name: rental_status_history; Type: TABLE DATA; Schema: public; Owner: key
--

COPY public.rental_status_history (id, rental_id, status, created_at) FROM stdin;
\.


--
-- Data for Name: rentals; Type: TABLE DATA; Schema: public; Owner: key
--

COPY public.rentals (id, owner_id, car_name, client_name, status, amount, starts_at, ends_at, created_at, client_phone, car_id, client_user_id, source, booking_code, subtotal, deposit, payment_status, hold_expires_at, pickup_location, dropoff_location, cancellation_reason, updated_at, pickup_at, returned_at, odometer_start, odometer_end, fuel_start, fuel_end, late_fee, damage_fee, final_total, extension_count, pickup_meeting_at, pickup_meeting_location, return_meeting_at, return_meeting_location) FROM stdin;
7	1	Kia K5	Тест	cancelled	7000.00	2026-10-01 17:33:00+00	2026-10-03 17:33:00+00	2026-09-20 17:34:05.040227+00	+79999999999	1	\N	owner	KEY-000007	0.00	0.00	unpaid	\N				2026-09-20 17:36:55.896029+00	\N	\N	\N	\N	\N	\N	0.00	0.00	7000.00	0	\N		\N	
1	1	Kia K5	Пётр Клиент	completed	17500.00	2027-01-10 12:00:00+00	2027-01-15 12:00:00+00	2026-09-19 08:29:08.217173+00	+79990000002	1	2	marketplace	KEY-000001	17500.00	0.00	unpaid	\N				2026-09-19 08:29:08.345115+00	2026-09-19 08:29:08.302413+00	2026-09-19 08:29:08.323773+00	\N	\N	\N	\N	0.00	0.00	17500.00	0	\N		\N	
10	1	Kia K5	Тест	completed	5000.00	2026-09-19 22:50:00+00	2026-10-02 18:46:00+00	2026-09-20 17:46:09.4661+00	+79999999999	1	\N	owner	KEY-000010	0.00	0.00	paid	\N				2026-09-20 17:47:27.724893+00	2026-09-20 17:46:24.942499+00	2026-09-20 17:46:25.557514+00	\N	\N	\N	\N	0.00	0.00	5000.00	0	\N		\N	
2	1	Kia K5	Тест	completed	7000.00	2026-09-19 10:44:00+00	2026-09-21 10:44:00+00	2026-09-19 10:44:14.704288+00	+79999999999	1	\N	owner	KEY-000002	0.00	0.00	unpaid	\N				2026-09-19 10:44:35.078901+00	2026-09-19 10:44:31.179104+00	2026-09-19 10:44:33.860644+00	\N	\N	\N	\N	0.00	0.00	7000.00	0	\N		\N	
8	1	Kia K5	Тест	completed	7000.00	2026-09-25 17:37:00+00	2026-09-27 17:37:00+00	2026-09-20 17:37:17.915417+00	+79999999999	1	\N	owner	KEY-000008	0.00	0.00	paid	\N				2026-09-20 17:42:14.327965+00	2026-09-20 17:38:02.461577+00	2026-09-20 17:38:11.010479+00	\N	\N	\N	\N	0.00	0.00	7000.00	0	\N		\N	
3	1	Kia K5	Тест	completed	7000.00	2026-10-01 11:07:00+00	2026-10-05 11:07:00+00	2026-09-19 11:08:01.506039+00	+79999999999	1	\N	owner	KEY-000003	0.00	0.00	unpaid	\N				2026-09-19 11:12:23.925834+00	2026-09-19 11:08:16.031374+00	2026-09-19 11:12:22.815004+00	\N	\N	\N	\N	0.00	0.00	7000.00	0	\N		\N	
13	1	Kia K5	Артём	cancelled	157500.00	2026-09-20 12:00:00+00	2026-11-04 12:00:00+00	2026-09-20 17:57:42.342489+00	+79028403940	1	\N	marketplace	KEY-000013	157500.00	0.00	unpaid	\N	Москва	Москва	Отменено клиентом	2026-09-20 18:24:11.201444+00	\N	\N	\N	\N	\N	\N	0.00	0.00	157500.00	0	\N		\N	
5	1	Kia K5	Артём	completed	10500.00	2026-09-20 12:00:00+00	2026-09-23 12:00:00+00	2026-09-19 13:39:09.493735+00	+79028403940	1	\N	marketplace	KEY-000005	10500.00	0.00	paid	\N	Москва	Москва		2026-09-19 13:42:38.945884+00	2026-09-19 13:40:30.591357+00	2026-09-19 13:42:22.189023+00	\N	\N	\N	\N	0.00	0.00	10500.00	0	\N		\N	
4	1	Kia K5	Тест2	completed	7000.00	2026-10-01 11:17:00+00	2026-10-04 11:17:00+00	2026-09-19 11:17:48.698001+00	+79999999999	1	\N	owner	KEY-000004	0.00	0.00	paid	\N				2026-09-19 11:21:25.541474+00	2026-09-19 11:18:11.84543+00	2026-09-19 11:18:12.990436+00	\N	\N	\N	\N	0.00	0.00	7000.00	0	\N		\N	
14	1	Kia K5	Артём	completed	14000.00	2026-11-04 12:00:00+00	2026-11-08 12:00:00+00	2026-09-20 18:23:59.487346+00	+79028403940	1	\N	marketplace	KEY-000014	14000.00	0.00	paid	\N	Москва	Москва		2026-09-20 18:28:49.530641+00	2026-09-20 18:28:30.049624+00	2026-09-20 18:28:42.696164+00	300000	\N	\N	\N	0.00	0.00	14500.00	0	2026-10-04 10:10:00+00	ул Пушкина 47	\N	
6	1	Kia K5	Артём	completed	10500.00	2026-09-21 12:00:00+00	2026-09-24 12:00:00+00	2026-09-20 17:21:04.610318+00	+79028403940	1	\N	marketplace	KEY-000006	10500.00	0.00	paid	\N	Москва	Москва		2026-09-20 17:21:35.709278+00	2026-09-20 17:21:27.542589+00	2026-09-20 17:21:29.425358+00	\N	\N	\N	\N	0.00	0.00	10500.00	0	\N		\N	
9	1	Kia K5	Тест	completed	7000.00	2026-09-21 17:42:00+00	2026-09-23 17:42:00+00	2026-09-20 17:42:34.01553+00	+79999999999	1	\N	owner	KEY-000009	0.00	0.00	paid	\N				2026-09-20 17:43:50.509817+00	2026-09-20 17:42:44.143933+00	2026-09-20 17:42:49.510542+00	\N	\N	\N	\N	0.00	0.00	7000.00	0	\N		\N	
11	1	Kia K5	Артём	completed	7000.00	2026-09-20 12:00:00+00	2026-10-03 20:55:00+00	2026-09-20 17:53:51.160119+00	+79028403940	1	\N	marketplace	KEY-000011	7000.00	0.00	paid	\N	Москва	Москва		2026-09-20 17:56:44.705632+00	2026-09-20 17:54:43.641463+00	2026-09-20 17:56:44.222185+00	\N	\N	\N	\N	0.00	0.00	7000.00	2	\N		\N	
12	1	Kia K5	Артём	rejected	63000.00	2026-09-20 12:00:00+00	2026-10-08 12:00:00+00	2026-09-20 17:57:03.256443+00	+79028403940	1	\N	marketplace	KEY-000012	63000.00	0.00	unpaid	\N	Москва	Москва		2026-09-20 17:57:19.023641+00	\N	\N	\N	\N	\N	\N	0.00	0.00	63000.00	0	\N		\N	
\.


--
-- Data for Name: user_notifications; Type: TABLE DATA; Schema: public; Owner: key
--

COPY public.user_notifications (id, user_id, title, message, is_read, created_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: key
--

COPY public.users (id, name, email, password_hash, role, created_at, phone, phone_verified, city, company_name, updated_at, avatar_url, plan, plan_expires_at, cars_limit) FROM stdin;
2	Пётр Клиент	\N	$2a$10$erjneC3zcQxNT.p4KIKkB.JK4ET7q6tXV3C6e0pr8QAx0C1lE3UYK	customer	2026-09-19 08:29:08.184747+00	+79990000002	f			2026-09-19 08:29:08.184747+00		free	\N	3
1	Иван Владелец	\N	$2a$10$4qI0bHSEOrPAPKCDi9k/nOOq1XUzwytI7.jsAalxeD732o/b/YCRG	owner	2026-09-19 08:29:07.969279+00	+79990000001	f	Тула	Иван Автобарыга	2026-09-21 10:45:08.067227+00		free	\N	3
6	Артём	\N	$2a$10$sc1RU637wjmBInwZ5Zsl4usNtr41EgzRP9Iq0QlawrvGCQBnHV9rS	owner	2026-09-21 10:46:13.332128+00	+79028403941	f	Тула	Артём	2026-09-21 10:47:17.140766+00		free	\N	3
7	Артём Курочкин	artemq98@yandex.ru	$2a$10$Wc8acPX5igzgu4M3iZ5se.tp4MYLsdCyaChoVJCWLn9Ty/SmoD8Lq	owner	2026-09-21 12:06:15.878082+00	+79028403940	f	Санкт-Петербург		2026-09-21 12:06:15.878082+00		free	\N	3
\.


--
-- Data for Name: verifications; Type: TABLE DATA; Schema: public; Owner: key
--

COPY public.verifications (id, owner_id, user_id, stage, score, status, created_at, progress, risk_level, client_phone) FROM stdin;
\.


--
-- Name: auth_codes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: key
--

SELECT pg_catalog.setval('public.auth_codes_id_seq', 8, true);


--
-- Name: car_expenses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: key
--

SELECT pg_catalog.setval('public.car_expenses_id_seq', 3, true);


--
-- Name: car_photos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: key
--

SELECT pg_catalog.setval('public.car_photos_id_seq', 1, true);


--
-- Name: cars_id_seq; Type: SEQUENCE SET; Schema: public; Owner: key
--

SELECT pg_catalog.setval('public.cars_id_seq', 4, true);


--
-- Name: deposit_transactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: key
--

SELECT pg_catalog.setval('public.deposit_transactions_id_seq', 1, true);


--
-- Name: fleet_profiles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: key
--

SELECT pg_catalog.setval('public.fleet_profiles_id_seq', 10, true);


--
-- Name: leads_id_seq; Type: SEQUENCE SET; Schema: public; Owner: key
--

SELECT pg_catalog.setval('public.leads_id_seq', 1, false);


--
-- Name: payments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: key
--

SELECT pg_catalog.setval('public.payments_id_seq', 1, false);


--
-- Name: rental_adjustments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: key
--

SELECT pg_catalog.setval('public.rental_adjustments_id_seq', 1, false);


--
-- Name: rental_events_id_seq; Type: SEQUENCE SET; Schema: public; Owner: key
--

SELECT pg_catalog.setval('public.rental_events_id_seq', 107, true);


--
-- Name: rental_expenses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: key
--

SELECT pg_catalog.setval('public.rental_expenses_id_seq', 1, false);


--
-- Name: rental_extras_id_seq; Type: SEQUENCE SET; Schema: public; Owner: key
--

SELECT pg_catalog.setval('public.rental_extras_id_seq', 2, true);


--
-- Name: rental_inspections_id_seq; Type: SEQUENCE SET; Schema: public; Owner: key
--

SELECT pg_catalog.setval('public.rental_inspections_id_seq', 1, true);


--
-- Name: rental_payments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: key
--

SELECT pg_catalog.setval('public.rental_payments_id_seq', 14, true);


--
-- Name: rental_status_history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: key
--

SELECT pg_catalog.setval('public.rental_status_history_id_seq', 1, false);


--
-- Name: rentals_id_seq; Type: SEQUENCE SET; Schema: public; Owner: key
--

SELECT pg_catalog.setval('public.rentals_id_seq', 14, true);


--
-- Name: user_notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: key
--

SELECT pg_catalog.setval('public.user_notifications_id_seq', 1, false);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: key
--

SELECT pg_catalog.setval('public.users_id_seq', 7, true);


--
-- Name: verifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: key
--

SELECT pg_catalog.setval('public.verifications_id_seq', 1, false);


--
-- Name: auth_codes auth_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: key
--

ALTER TABLE ONLY public.auth_codes
    ADD CONSTRAINT auth_codes_pkey PRIMARY KEY (id);


--
-- Name: car_expenses car_expenses_pkey; Type: CONSTRAINT; Schema: public; Owner: key
--

ALTER TABLE ONLY public.car_expenses
    ADD CONSTRAINT car_expenses_pkey PRIMARY KEY (id);


--
-- Name: car_photos car_photos_pkey; Type: CONSTRAINT; Schema: public; Owner: key
--

ALTER TABLE ONLY public.car_photos
    ADD CONSTRAINT car_photos_pkey PRIMARY KEY (id);


--
-- Name: cars cars_pkey; Type: CONSTRAINT; Schema: public; Owner: key
--

ALTER TABLE ONLY public.cars
    ADD CONSTRAINT cars_pkey PRIMARY KEY (id);


--
-- Name: deposit_transactions deposit_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: key
--

ALTER TABLE ONLY public.deposit_transactions
    ADD CONSTRAINT deposit_transactions_pkey PRIMARY KEY (id);


--
-- Name: fleet_profiles fleet_profiles_owner_id_key; Type: CONSTRAINT; Schema: public; Owner: key
--

ALTER TABLE ONLY public.fleet_profiles
    ADD CONSTRAINT fleet_profiles_owner_id_key UNIQUE (owner_id);


--
-- Name: fleet_profiles fleet_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: key
--

ALTER TABLE ONLY public.fleet_profiles
    ADD CONSTRAINT fleet_profiles_pkey PRIMARY KEY (id);


--
-- Name: fleet_profiles fleet_profiles_slug_key; Type: CONSTRAINT; Schema: public; Owner: key
--

ALTER TABLE ONLY public.fleet_profiles
    ADD CONSTRAINT fleet_profiles_slug_key UNIQUE (slug);


--
-- Name: leads leads_pkey; Type: CONSTRAINT; Schema: public; Owner: key
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_pkey PRIMARY KEY (id);


--
-- Name: payments payments_idempotency_key_key; Type: CONSTRAINT; Schema: public; Owner: key
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_idempotency_key_key UNIQUE (idempotency_key);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: key
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: rental_adjustments rental_adjustments_pkey; Type: CONSTRAINT; Schema: public; Owner: key
--

ALTER TABLE ONLY public.rental_adjustments
    ADD CONSTRAINT rental_adjustments_pkey PRIMARY KEY (id);


--
-- Name: rental_events rental_events_pkey; Type: CONSTRAINT; Schema: public; Owner: key
--

ALTER TABLE ONLY public.rental_events
    ADD CONSTRAINT rental_events_pkey PRIMARY KEY (id);


--
-- Name: rental_expenses rental_expenses_pkey; Type: CONSTRAINT; Schema: public; Owner: key
--

ALTER TABLE ONLY public.rental_expenses
    ADD CONSTRAINT rental_expenses_pkey PRIMARY KEY (id);


--
-- Name: rental_extras rental_extras_pkey; Type: CONSTRAINT; Schema: public; Owner: key
--

ALTER TABLE ONLY public.rental_extras
    ADD CONSTRAINT rental_extras_pkey PRIMARY KEY (id);


--
-- Name: rental_inspections rental_inspections_pkey; Type: CONSTRAINT; Schema: public; Owner: key
--

ALTER TABLE ONLY public.rental_inspections
    ADD CONSTRAINT rental_inspections_pkey PRIMARY KEY (id);


--
-- Name: rental_payments rental_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: key
--

ALTER TABLE ONLY public.rental_payments
    ADD CONSTRAINT rental_payments_pkey PRIMARY KEY (id);


--
-- Name: rental_status_history rental_status_history_pkey; Type: CONSTRAINT; Schema: public; Owner: key
--

ALTER TABLE ONLY public.rental_status_history
    ADD CONSTRAINT rental_status_history_pkey PRIMARY KEY (id);


--
-- Name: rentals rentals_pkey; Type: CONSTRAINT; Schema: public; Owner: key
--

ALTER TABLE ONLY public.rentals
    ADD CONSTRAINT rentals_pkey PRIMARY KEY (id);


--
-- Name: user_notifications user_notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: key
--

ALTER TABLE ONLY public.user_notifications
    ADD CONSTRAINT user_notifications_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: key
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: key
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: verifications verifications_pkey; Type: CONSTRAINT; Schema: public; Owner: key
--

ALTER TABLE ONLY public.verifications
    ADD CONSTRAINT verifications_pkey PRIMARY KEY (id);


--
-- Name: auth_codes_email_active_idx; Type: INDEX; Schema: public; Owner: key
--

CREATE INDEX auth_codes_email_active_idx ON public.auth_codes USING btree (email) WHERE (used_at IS NULL);


--
-- Name: auth_codes_phone_active_idx; Type: INDEX; Schema: public; Owner: key
--

CREATE INDEX auth_codes_phone_active_idx ON public.auth_codes USING btree (phone) WHERE (used_at IS NULL);


--
-- Name: car_expenses_car_idx; Type: INDEX; Schema: public; Owner: key
--

CREATE INDEX car_expenses_car_idx ON public.car_expenses USING btree (car_id, created_at DESC, id DESC);


--
-- Name: car_photos_car_idx; Type: INDEX; Schema: public; Owner: key
--

CREATE INDEX car_photos_car_idx ON public.car_photos USING btree (car_id, id);


--
-- Name: car_photos_primary_idx; Type: INDEX; Schema: public; Owner: key
--

CREATE UNIQUE INDEX car_photos_primary_idx ON public.car_photos USING btree (car_id) WHERE is_primary;


--
-- Name: cars_owner_idx; Type: INDEX; Schema: public; Owner: key
--

CREATE INDEX cars_owner_idx ON public.cars USING btree (owner_id);


--
-- Name: deposit_transactions_rental_idx; Type: INDEX; Schema: public; Owner: key
--

CREATE INDEX deposit_transactions_rental_idx ON public.deposit_transactions USING btree (rental_id, id DESC);


--
-- Name: payments_external_idx; Type: INDEX; Schema: public; Owner: key
--

CREATE INDEX payments_external_idx ON public.payments USING btree (provider, external_id);


--
-- Name: payments_owner_idx; Type: INDEX; Schema: public; Owner: key
--

CREATE INDEX payments_owner_idx ON public.payments USING btree (owner_id);


--
-- Name: rental_adjustments_rental_idx; Type: INDEX; Schema: public; Owner: key
--

CREATE INDEX rental_adjustments_rental_idx ON public.rental_adjustments USING btree (rental_id, id DESC);


--
-- Name: rental_events_rental_idx; Type: INDEX; Schema: public; Owner: key
--

CREATE INDEX rental_events_rental_idx ON public.rental_events USING btree (rental_id, id DESC);


--
-- Name: rental_expenses_rental_idx; Type: INDEX; Schema: public; Owner: key
--

CREATE INDEX rental_expenses_rental_idx ON public.rental_expenses USING btree (rental_id);


--
-- Name: rental_extras_rental_idx; Type: INDEX; Schema: public; Owner: key
--

CREATE INDEX rental_extras_rental_idx ON public.rental_extras USING btree (rental_id);


--
-- Name: rental_inspections_rental_idx; Type: INDEX; Schema: public; Owner: key
--

CREATE INDEX rental_inspections_rental_idx ON public.rental_inspections USING btree (rental_id);


--
-- Name: rental_payments_rental_idx; Type: INDEX; Schema: public; Owner: key
--

CREATE INDEX rental_payments_rental_idx ON public.rental_payments USING btree (rental_id);


--
-- Name: rentals_booking_code_unique; Type: INDEX; Schema: public; Owner: key
--

CREATE UNIQUE INDEX rentals_booking_code_unique ON public.rentals USING btree (booking_code) WHERE (booking_code IS NOT NULL);


--
-- Name: rentals_car_dates_idx; Type: INDEX; Schema: public; Owner: key
--

CREATE INDEX rentals_car_dates_idx ON public.rentals USING btree (car_id, starts_at, ends_at);


--
-- Name: rentals_car_id_idx; Type: INDEX; Schema: public; Owner: key
--

CREATE INDEX rentals_car_id_idx ON public.rentals USING btree (car_id);


--
-- Name: rentals_customer_idx; Type: INDEX; Schema: public; Owner: key
--

CREATE INDEX rentals_customer_idx ON public.rentals USING btree (client_user_id);


--
-- Name: users_phone_unique; Type: INDEX; Schema: public; Owner: key
--

CREATE UNIQUE INDEX users_phone_unique ON public.users USING btree (phone) WHERE (phone IS NOT NULL);


--
-- Name: car_expenses car_expenses_car_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: key
--

ALTER TABLE ONLY public.car_expenses
    ADD CONSTRAINT car_expenses_car_id_fkey FOREIGN KEY (car_id) REFERENCES public.cars(id) ON DELETE CASCADE;


--
-- Name: car_expenses car_expenses_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: key
--

ALTER TABLE ONLY public.car_expenses
    ADD CONSTRAINT car_expenses_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: car_photos car_photos_car_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: key
--

ALTER TABLE ONLY public.car_photos
    ADD CONSTRAINT car_photos_car_id_fkey FOREIGN KEY (car_id) REFERENCES public.cars(id) ON DELETE CASCADE;


--
-- Name: cars cars_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: key
--

ALTER TABLE ONLY public.cars
    ADD CONSTRAINT cars_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: deposit_transactions deposit_transactions_rental_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: key
--

ALTER TABLE ONLY public.deposit_transactions
    ADD CONSTRAINT deposit_transactions_rental_id_fkey FOREIGN KEY (rental_id) REFERENCES public.rentals(id) ON DELETE CASCADE;


--
-- Name: fleet_profiles fleet_profiles_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: key
--

ALTER TABLE ONLY public.fleet_profiles
    ADD CONSTRAINT fleet_profiles_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: payments payments_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: key
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: rental_adjustments rental_adjustments_rental_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: key
--

ALTER TABLE ONLY public.rental_adjustments
    ADD CONSTRAINT rental_adjustments_rental_id_fkey FOREIGN KEY (rental_id) REFERENCES public.rentals(id) ON DELETE CASCADE;


--
-- Name: rental_events rental_events_actor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: key
--

ALTER TABLE ONLY public.rental_events
    ADD CONSTRAINT rental_events_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: rental_events rental_events_rental_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: key
--

ALTER TABLE ONLY public.rental_events
    ADD CONSTRAINT rental_events_rental_id_fkey FOREIGN KEY (rental_id) REFERENCES public.rentals(id) ON DELETE CASCADE;


--
-- Name: rental_expenses rental_expenses_rental_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: key
--

ALTER TABLE ONLY public.rental_expenses
    ADD CONSTRAINT rental_expenses_rental_id_fkey FOREIGN KEY (rental_id) REFERENCES public.rentals(id) ON DELETE CASCADE;


--
-- Name: rental_extras rental_extras_rental_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: key
--

ALTER TABLE ONLY public.rental_extras
    ADD CONSTRAINT rental_extras_rental_id_fkey FOREIGN KEY (rental_id) REFERENCES public.rentals(id) ON DELETE CASCADE;


--
-- Name: rental_inspections rental_inspections_rental_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: key
--

ALTER TABLE ONLY public.rental_inspections
    ADD CONSTRAINT rental_inspections_rental_id_fkey FOREIGN KEY (rental_id) REFERENCES public.rentals(id) ON DELETE CASCADE;


--
-- Name: rental_payments rental_payments_rental_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: key
--

ALTER TABLE ONLY public.rental_payments
    ADD CONSTRAINT rental_payments_rental_id_fkey FOREIGN KEY (rental_id) REFERENCES public.rentals(id) ON DELETE CASCADE;


--
-- Name: rentals rentals_car_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: key
--

ALTER TABLE ONLY public.rentals
    ADD CONSTRAINT rentals_car_id_fkey FOREIGN KEY (car_id) REFERENCES public.cars(id) ON DELETE SET NULL;


--
-- Name: rentals rentals_client_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: key
--

ALTER TABLE ONLY public.rentals
    ADD CONSTRAINT rentals_client_user_id_fkey FOREIGN KEY (client_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: rentals rentals_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: key
--

ALTER TABLE ONLY public.rentals
    ADD CONSTRAINT rentals_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: verifications verifications_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: key
--

ALTER TABLE ONLY public.verifications
    ADD CONSTRAINT verifications_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: verifications verifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: key
--

ALTER TABLE ONLY public.verifications
    ADD CONSTRAINT verifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict HjqslpcPKeBqraUOuHYfj9bojBnyHVyVAdfbmC9yWPIt8KZZDkClWyIibHtmoLG

