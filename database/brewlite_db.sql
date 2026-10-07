--
-- PostgreSQL database dump
--

\restrict Rd7x1FNmUw1r6XFQGIvQAcB1Q3HcGoxIVGzotlHm0DDyqGAEdeFNWfFtGQK1fm1

-- Dumped from database version 17.11
-- Dumped by pg_dump version 17.11

-- Started on 2026-10-07 18:36:20

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
-- TOC entry 2 (class 3079 OID 16469)
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- TOC entry 5070 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- TOC entry 895 (class 1247 OID 16390)
-- Name: OrderStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."OrderStatus" AS ENUM (
    'PENDING',
    'PAID',
    'PREPARING',
    'READY',
    'COMPLETED',
    'PAYMENT_FAILED',
    'CANCELLED'
);


ALTER TYPE public."OrderStatus" OWNER TO postgres;

--
-- TOC entry 916 (class 1247 OID 16522)
-- Name: item_size; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.item_size AS ENUM (
    'S',
    'M',
    'L'
);


ALTER TYPE public.item_size OWNER TO postgres;

--
-- TOC entry 913 (class 1247 OID 16507)
-- Name: order_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.order_status AS ENUM (
    'PENDING',
    'PAID',
    'PAYMENT_FAILED',
    'PREPARING',
    'READY',
    'COMPLETED',
    'CANCELLED'
);


ALTER TYPE public.order_status OWNER TO postgres;

--
-- TOC entry 919 (class 1247 OID 16530)
-- Name: payment_method; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.payment_method AS ENUM (
    'WALLET',
    'CARD'
);


ALTER TYPE public.payment_method OWNER TO postgres;

--
-- TOC entry 922 (class 1247 OID 16536)
-- Name: payment_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.payment_status AS ENUM (
    'SUCCESS',
    'FAILED'
);


ALTER TYPE public.payment_status OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 220 (class 1259 OID 16423)
-- Name: Order; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Order" (
    id text NOT NULL,
    "userId" text NOT NULL,
    status public."OrderStatus" DEFAULT 'PENDING'::public."OrderStatus" NOT NULL,
    total double precision NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Order" OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 16432)
-- Name: OrderItem; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."OrderItem" (
    id text NOT NULL,
    "orderId" text NOT NULL,
    "productId" text NOT NULL,
    size text NOT NULL,
    qty integer NOT NULL,
    "lineTotal" double precision NOT NULL
);


ALTER TABLE public."OrderItem" OWNER TO postgres;

--
-- TOC entry 229 (class 1259 OID 16612)
-- Name: OrderItemToppings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."OrderItemToppings" (
    order_item_id uuid NOT NULL,
    topping_id uuid NOT NULL,
    price_at_purchase numeric(12,2) NOT NULL
);


ALTER TABLE public."OrderItemToppings" OWNER TO postgres;

--
-- TOC entry 228 (class 1259 OID 16596)
-- Name: OrderItems; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."OrderItems" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid NOT NULL,
    product_id uuid NOT NULL,
    size public.item_size NOT NULL,
    qty integer NOT NULL,
    unit_price numeric(12,2) NOT NULL,
    line_total numeric(12,2) NOT NULL
);


ALTER TABLE public."OrderItems" OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 16577)
-- Name: Orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Orders" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    promo_id uuid,
    status public.order_status DEFAULT 'PENDING'::public.order_status NOT NULL,
    subtotal numeric(12,2) NOT NULL,
    discount_amount numeric(12,2) DEFAULT 0 NOT NULL,
    final_amount numeric(12,2) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Orders" OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 16439)
-- Name: Payment; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Payment" (
    id text NOT NULL,
    "orderId" text NOT NULL,
    "idempotencyKey" text NOT NULL,
    amount double precision NOT NULL,
    method text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Payment" OWNER TO postgres;

--
-- TOC entry 230 (class 1259 OID 16627)
-- Name: Payments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Payments" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid NOT NULL,
    idempotency_key character varying(255) NOT NULL,
    amount numeric(12,2) NOT NULL,
    method public.payment_method NOT NULL,
    status public.payment_status NOT NULL
);


ALTER TABLE public."Payments" OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 16414)
-- Name: Product; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Product" (
    id text NOT NULL,
    name text NOT NULL,
    price double precision NOT NULL,
    "imageUrl" text NOT NULL,
    stock integer DEFAULT 0 NOT NULL,
    version integer DEFAULT 0 NOT NULL
);


ALTER TABLE public."Product" OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 16552)
-- Name: Products; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Products" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    price numeric(12,2) NOT NULL,
    image_url character varying(500),
    stock integer DEFAULT 0 NOT NULL,
    version integer DEFAULT 0 NOT NULL
);


ALTER TABLE public."Products" OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 16568)
-- Name: Promotions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Promotions" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code character varying(50) NOT NULL,
    discount_amount numeric(12,2) NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    start_at timestamp without time zone,
    end_at timestamp without time zone
);


ALTER TABLE public."Promotions" OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 16562)
-- Name: Toppings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Toppings" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    price numeric(12,2) NOT NULL
);


ALTER TABLE public."Toppings" OWNER TO postgres;

--
-- TOC entry 218 (class 1259 OID 16405)
-- Name: User; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."User" (
    id text NOT NULL,
    email text NOT NULL,
    "passwordHash" text NOT NULL,
    "loyaltyPoints" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."User" OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 16541)
-- Name: Users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Users" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    loyalty_points integer DEFAULT 0 NOT NULL
);


ALTER TABLE public."Users" OWNER TO postgres;

--
-- TOC entry 5054 (class 0 OID 16423)
-- Dependencies: 220
-- Data for Name: Order; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Order" (id, "userId", status, total, "createdAt") FROM stdin;
\.


--
-- TOC entry 5055 (class 0 OID 16432)
-- Dependencies: 221
-- Data for Name: OrderItem; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."OrderItem" (id, "orderId", "productId", size, qty, "lineTotal") FROM stdin;
\.


--
-- TOC entry 5063 (class 0 OID 16612)
-- Dependencies: 229
-- Data for Name: OrderItemToppings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."OrderItemToppings" (order_item_id, topping_id, price_at_purchase) FROM stdin;
\.


--
-- TOC entry 5062 (class 0 OID 16596)
-- Dependencies: 228
-- Data for Name: OrderItems; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."OrderItems" (id, order_id, product_id, size, qty, unit_price, line_total) FROM stdin;
\.


--
-- TOC entry 5061 (class 0 OID 16577)
-- Dependencies: 227
-- Data for Name: Orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Orders" (id, user_id, promo_id, status, subtotal, discount_amount, final_amount, created_at) FROM stdin;
\.


--
-- TOC entry 5056 (class 0 OID 16439)
-- Dependencies: 222
-- Data for Name: Payment; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Payment" (id, "orderId", "idempotencyKey", amount, method, "createdAt") FROM stdin;
\.


--
-- TOC entry 5064 (class 0 OID 16627)
-- Dependencies: 230
-- Data for Name: Payments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Payments" (id, order_id, idempotency_key, amount, method, status) FROM stdin;
\.


--
-- TOC entry 5053 (class 0 OID 16414)
-- Dependencies: 219
-- Data for Name: Product; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Product" (id, name, price, "imageUrl", stock, version) FROM stdin;
\.


--
-- TOC entry 5058 (class 0 OID 16552)
-- Dependencies: 224
-- Data for Name: Products; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Products" (id, name, price, image_url, stock, version) FROM stdin;
\.


--
-- TOC entry 5060 (class 0 OID 16568)
-- Dependencies: 226
-- Data for Name: Promotions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Promotions" (id, code, discount_amount, is_active, start_at, end_at) FROM stdin;
\.


--
-- TOC entry 5059 (class 0 OID 16562)
-- Dependencies: 225
-- Data for Name: Toppings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Toppings" (id, name, price) FROM stdin;
\.


--
-- TOC entry 5052 (class 0 OID 16405)
-- Dependencies: 218
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."User" (id, email, "passwordHash", "loyaltyPoints", "createdAt") FROM stdin;
\.


--
-- TOC entry 5057 (class 0 OID 16541)
-- Dependencies: 223
-- Data for Name: Users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Users" (id, email, password_hash, loyalty_points) FROM stdin;
\.


--
-- TOC entry 4891 (class 2606 OID 16616)
-- Name: OrderItemToppings OrderItemToppings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."OrderItemToppings"
    ADD CONSTRAINT "OrderItemToppings_pkey" PRIMARY KEY (order_item_id, topping_id);


--
-- TOC entry 4870 (class 2606 OID 16438)
-- Name: OrderItem OrderItem_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."OrderItem"
    ADD CONSTRAINT "OrderItem_pkey" PRIMARY KEY (id);


--
-- TOC entry 4889 (class 2606 OID 16601)
-- Name: OrderItems OrderItems_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."OrderItems"
    ADD CONSTRAINT "OrderItems_pkey" PRIMARY KEY (id);


--
-- TOC entry 4868 (class 2606 OID 16431)
-- Name: Order Order_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_pkey" PRIMARY KEY (id);


--
-- TOC entry 4887 (class 2606 OID 16585)
-- Name: Orders Orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Orders"
    ADD CONSTRAINT "Orders_pkey" PRIMARY KEY (id);


--
-- TOC entry 4873 (class 2606 OID 16446)
-- Name: Payment Payment_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Payment"
    ADD CONSTRAINT "Payment_pkey" PRIMARY KEY (id);


--
-- TOC entry 4893 (class 2606 OID 16634)
-- Name: Payments Payments_idempotency_key_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Payments"
    ADD CONSTRAINT "Payments_idempotency_key_key" UNIQUE (idempotency_key);


--
-- TOC entry 4895 (class 2606 OID 16632)
-- Name: Payments Payments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Payments"
    ADD CONSTRAINT "Payments_pkey" PRIMARY KEY (id);


--
-- TOC entry 4866 (class 2606 OID 16422)
-- Name: Product Product_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Product"
    ADD CONSTRAINT "Product_pkey" PRIMARY KEY (id);


--
-- TOC entry 4879 (class 2606 OID 16561)
-- Name: Products Products_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Products"
    ADD CONSTRAINT "Products_pkey" PRIMARY KEY (id);


--
-- TOC entry 4883 (class 2606 OID 16576)
-- Name: Promotions Promotions_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Promotions"
    ADD CONSTRAINT "Promotions_code_key" UNIQUE (code);


--
-- TOC entry 4885 (class 2606 OID 16574)
-- Name: Promotions Promotions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Promotions"
    ADD CONSTRAINT "Promotions_pkey" PRIMARY KEY (id);


--
-- TOC entry 4881 (class 2606 OID 16567)
-- Name: Toppings Toppings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Toppings"
    ADD CONSTRAINT "Toppings_pkey" PRIMARY KEY (id);


--
-- TOC entry 4864 (class 2606 OID 16413)
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- TOC entry 4875 (class 2606 OID 16551)
-- Name: Users Users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key" UNIQUE (email);


--
-- TOC entry 4877 (class 2606 OID 16549)
-- Name: Users Users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_pkey" PRIMARY KEY (id);


--
-- TOC entry 4871 (class 1259 OID 16448)
-- Name: Payment_idempotencyKey_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Payment_idempotencyKey_key" ON public."Payment" USING btree ("idempotencyKey");


--
-- TOC entry 4862 (class 1259 OID 16447)
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- TOC entry 4897 (class 2606 OID 16454)
-- Name: OrderItem OrderItem_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."OrderItem"
    ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public."Order"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4898 (class 2606 OID 16459)
-- Name: OrderItem OrderItem_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."OrderItem"
    ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4896 (class 2606 OID 16449)
-- Name: Order Order_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4899 (class 2606 OID 16464)
-- Name: Payment Payment_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Payment"
    ADD CONSTRAINT "Payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public."Order"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4904 (class 2606 OID 16617)
-- Name: OrderItemToppings fk_oit_item; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."OrderItemToppings"
    ADD CONSTRAINT fk_oit_item FOREIGN KEY (order_item_id) REFERENCES public."OrderItems"(id) ON DELETE CASCADE;


--
-- TOC entry 4905 (class 2606 OID 16622)
-- Name: OrderItemToppings fk_oit_topping; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."OrderItemToppings"
    ADD CONSTRAINT fk_oit_topping FOREIGN KEY (topping_id) REFERENCES public."Toppings"(id) ON DELETE RESTRICT;


--
-- TOC entry 4902 (class 2606 OID 16602)
-- Name: OrderItems fk_orderitems_order; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."OrderItems"
    ADD CONSTRAINT fk_orderitems_order FOREIGN KEY (order_id) REFERENCES public."Orders"(id) ON DELETE CASCADE;


--
-- TOC entry 4903 (class 2606 OID 16607)
-- Name: OrderItems fk_orderitems_product; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."OrderItems"
    ADD CONSTRAINT fk_orderitems_product FOREIGN KEY (product_id) REFERENCES public."Products"(id) ON DELETE RESTRICT;


--
-- TOC entry 4900 (class 2606 OID 16591)
-- Name: Orders fk_orders_promo; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Orders"
    ADD CONSTRAINT fk_orders_promo FOREIGN KEY (promo_id) REFERENCES public."Promotions"(id) ON DELETE SET NULL;


--
-- TOC entry 4901 (class 2606 OID 16586)
-- Name: Orders fk_orders_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Orders"
    ADD CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES public."Users"(id) ON DELETE CASCADE;


--
-- TOC entry 4906 (class 2606 OID 16635)
-- Name: Payments fk_payments_order; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Payments"
    ADD CONSTRAINT fk_payments_order FOREIGN KEY (order_id) REFERENCES public."Orders"(id) ON DELETE CASCADE;


-- Completed on 2026-10-07 18:36:20

--
-- PostgreSQL database dump complete
--

\unrestrict Rd7x1FNmUw1r6XFQGIvQAcB1Q3HcGoxIVGzotlHm0DDyqGAEdeFNWfFtGQK1fm1

