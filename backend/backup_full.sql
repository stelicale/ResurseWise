--
-- PostgreSQL database cluster dump
--

\restrict VY3MBTAad5Z1zHYVvSU5uLCpmh4j3jYztvRH1xu5uCZhehgyhR05HOGE2fV7FUa

SET default_transaction_read_only = off;

SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;

--
-- Roles
--

CREATE ROLE admin;
ALTER ROLE admin WITH SUPERUSER INHERIT CREATEROLE CREATEDB LOGIN REPLICATION BYPASSRLS PASSWORD 'SCRAM-SHA-256$4096:r3ZTUEpSL/p1Q52fNuiaZQ==$t/i+fwgi7FwZhMy2FaEQxKhj2JvLOlPrVulPdKmdHCk=:ek79Q7SHM1lRnRPkvWOnli++S5+w0SOVTVwwAQFu2yo=';

--
-- User Configurations
--








\unrestrict VY3MBTAad5Z1zHYVvSU5uLCpmh4j3jYztvRH1xu5uCZhehgyhR05HOGE2fV7FUa

--
-- Databases
--

--
-- Database "template1" dump
--

\connect template1

--
-- PostgreSQL database dump
--

\restrict yr0JhcCcJpLja2UvHw8X5IIc7fcrl7NxfZ9Wdei2tREOeJIkD84hoTfPyQMolYb

-- Dumped from database version 18.1 (Debian 18.1-1.pgdg13+2)
-- Dumped by pg_dump version 18.1 (Debian 18.1-1.pgdg13+2)

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
-- PostgreSQL database dump complete
--

\unrestrict yr0JhcCcJpLja2UvHw8X5IIc7fcrl7NxfZ9Wdei2tREOeJIkD84hoTfPyQMolYb

--
-- Database "mydb" dump
--

--
-- PostgreSQL database dump
--

\restrict rdDuxgM5M6gEWvcNvBHxHVsydZAWRLfASK3CQhGRScwjZdPG0Ba0US8zhp1OV26

-- Dumped from database version 18.1 (Debian 18.1-1.pgdg13+2)
-- Dumped by pg_dump version 18.1 (Debian 18.1-1.pgdg13+2)

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
-- Name: mydb; Type: DATABASE; Schema: -; Owner: admin
--

CREATE DATABASE mydb WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'en_US.utf8';


ALTER DATABASE mydb OWNER TO admin;

\unrestrict rdDuxgM5M6gEWvcNvBHxHVsydZAWRLfASK3CQhGRScwjZdPG0Ba0US8zhp1OV26
\connect mydb
\restrict rdDuxgM5M6gEWvcNvBHxHVsydZAWRLfASK3CQhGRScwjZdPG0Ba0US8zhp1OV26

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: categories; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.categories (
    id uuid NOT NULL,
    description text,
    name character varying(50)
);


ALTER TABLE public.categories OWNER TO admin;

--
-- Name: employees; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.employees (
    id uuid NOT NULL,
    department character varying(50),
    email character varying(100),
    full_name character varying(100),
    job_title character varying(255),
    job character varying(50),
    keycloak_id character varying(255)
);


ALTER TABLE public.employees OWNER TO admin;

--
-- Name: logs; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.logs (
    id uuid NOT NULL,
    action_date timestamp(6) without time zone,
    action_type character varying(50),
    comments text,
    employee_id uuid,
    resource_id uuid
);


ALTER TABLE public.logs OWNER TO admin;

--
-- Name: resources; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.resources (
    id uuid NOT NULL,
    location character varying(100),
    model character varying(100),
    name character varying(100),
    purchase_date date,
    serial_number character varying(100),
    status character varying(100),
    category_id uuid,
    employee_id uuid
);


ALTER TABLE public.resources OWNER TO admin;

--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.categories (id, description, name) FROM stdin;
3461baa8-a699-4602-b31a-7152c206f572	High performance computers	Laptops
4c0b72f0-f470-4f96-b500-d3331e6a1785	string	string
3fa3c0c1-4ab7-4b4d-8328-c886f1096443	Test	Test
b9393a79-924c-46bd-98ca-a941636afb56	Testul 2	Test2
\.


--
-- Data for Name: employees; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.employees (id, department, email, full_name, job_title, job, keycloak_id) FROM stdin;
11111111-1111-1111-1111-111111111111	IT	admin@dvloper.io	System Admin	Administrator	\N	\N
\.


--
-- Data for Name: logs; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.logs (id, action_date, action_type, comments, employee_id, resource_id) FROM stdin;
72548143-7b3e-4340-a449-12c41a318374	2026-01-21 14:18:30.770597	ASSIGN	Initial assignment via Seeder	11111111-1111-1111-1111-111111111111	2f1b0ef9-73a8-4588-a836-bbb6d36715f5
\.


--
-- Data for Name: resources; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.resources (id, location, model, name, purchase_date, serial_number, status, category_id, employee_id) FROM stdin;
2f1b0ef9-73a8-4588-a836-bbb6d36715f5	\N	\N	MacBook Pro M3	\N	SN-999-888	AVAILABLE	3461baa8-a699-4602-b31a-7152c206f572	11111111-1111-1111-1111-111111111111
\.


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: employees employees_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_pkey PRIMARY KEY (id);


--
-- Name: logs logs_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.logs
    ADD CONSTRAINT logs_pkey PRIMARY KEY (id);


--
-- Name: resources resources_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.resources
    ADD CONSTRAINT resources_pkey PRIMARY KEY (id);


--
-- Name: employees ukj9xgmd0ya5jmus09o0b8pqrpb; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT ukj9xgmd0ya5jmus09o0b8pqrpb UNIQUE (email);


--
-- Name: employees ukvcqtv1u5jdclt5y9resdtyqm; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT ukvcqtv1u5jdclt5y9resdtyqm UNIQUE (keycloak_id);


--
-- Name: logs fk2f8qi1h1s51kwjovbc4dnpu8k; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.logs
    ADD CONSTRAINT fk2f8qi1h1s51kwjovbc4dnpu8k FOREIGN KEY (resource_id) REFERENCES public.resources(id);


--
-- Name: resources fkgk5whw6ei7oxgf5nxr1glnp2v; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.resources
    ADD CONSTRAINT fkgk5whw6ei7oxgf5nxr1glnp2v FOREIGN KEY (employee_id) REFERENCES public.employees(id);


--
-- Name: logs fkhxbyc01b4tju756jqqj7r176r; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.logs
    ADD CONSTRAINT fkhxbyc01b4tju756jqqj7r176r FOREIGN KEY (employee_id) REFERENCES public.employees(id);


--
-- Name: resources fkkqsnjjtshc9v5lqp03fw9lw48; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.resources
    ADD CONSTRAINT fkkqsnjjtshc9v5lqp03fw9lw48 FOREIGN KEY (category_id) REFERENCES public.categories(id);


--
-- PostgreSQL database dump complete
--

\unrestrict rdDuxgM5M6gEWvcNvBHxHVsydZAWRLfASK3CQhGRScwjZdPG0Ba0US8zhp1OV26

--
-- Database "postgres" dump
--

\connect postgres

--
-- PostgreSQL database dump
--

\restrict WcxgJn0tJXDp7vbjliavnNqfZhcfgWCpKOzgN9VKnhdqy12W2idv0y177e6AQQG

-- Dumped from database version 18.1 (Debian 18.1-1.pgdg13+2)
-- Dumped by pg_dump version 18.1 (Debian 18.1-1.pgdg13+2)

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
-- PostgreSQL database dump complete
--

\unrestrict WcxgJn0tJXDp7vbjliavnNqfZhcfgWCpKOzgN9VKnhdqy12W2idv0y177e6AQQG

--
-- PostgreSQL database cluster dump complete
--

