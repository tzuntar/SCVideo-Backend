--
-- PostgreSQL database dump
--

-- Dumped from database version 14.2
-- Dumped by pg_dump version 14.5 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

DROP DATABASE scvideo;
--
-- Name: scvideo; Type: DATABASE; Schema: -; Owner: sk8
--

CREATE DATABASE scvideo WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE = 'en_US.UTF-8';


ALTER DATABASE scvideo OWNER TO sk8;

\connect scvideo

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA public;


ALTER SCHEMA public OWNER TO postgres;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON SCHEMA public IS 'standard public schema';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: comments; Type: TABLE; Schema: public; Owner: sk8
--

CREATE TABLE public.comments (
    id_comment integer NOT NULL,
    identifier character varying(500) NOT NULL,
    content text NOT NULL,
    added_on timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    id_user integer NOT NULL,
    id_post integer NOT NULL,
    is_hidden integer DEFAULT 0 NOT NULL,
    is_deleted integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.comments OWNER TO sk8;

--
-- Name: comments_id_comment_seq; Type: SEQUENCE; Schema: public; Owner: sk8
--

CREATE SEQUENCE public.comments_id_comment_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.comments_id_comment_seq OWNER TO sk8;

--
-- Name: comments_id_comment_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: sk8
--

ALTER SEQUENCE public.comments_id_comment_seq OWNED BY public.comments.id_comment;


--
-- Name: followers; Type: TABLE; Schema: public; Owner: sk8
--

CREATE TABLE public.followers (
    id_follower integer NOT NULL,
    id_user integer NOT NULL,
    id_followed_user integer NOT NULL
);


ALTER TABLE public.followers OWNER TO sk8;

--
-- Name: followers_id_follower_seq; Type: SEQUENCE; Schema: public; Owner: sk8
--

CREATE SEQUENCE public.followers_id_follower_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.followers_id_follower_seq OWNER TO sk8;

--
-- Name: followers_id_follower_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: sk8
--

ALTER SEQUENCE public.followers_id_follower_seq OWNED BY public.followers.id_follower;


--
-- Name: posts; Type: TABLE; Schema: public; Owner: sk8
--

CREATE TABLE public.posts (
    id_post integer NOT NULL,
    identifier character varying(500) NOT NULL,
    type character varying(20) DEFAULT 'video'::character varying NOT NULL,
    title character varying(480),
    description text,
    content_uri character varying(500),
    id_user integer NOT NULL,
    added_on timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    is_deleted integer DEFAULT 0 NOT NULL,
    is_hidden integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.posts OWNER TO sk8;

--
-- Name: posts_id_post_seq; Type: SEQUENCE; Schema: public; Owner: sk8
--

CREATE SEQUENCE public.posts_id_post_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.posts_id_post_seq OWNER TO sk8;

--
-- Name: posts_id_post_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: sk8
--

ALTER SEQUENCE public.posts_id_post_seq OWNED BY public.posts.id_post;


--
-- Name: reactions; Type: TABLE; Schema: public; Owner: sk8
--

CREATE TABLE public.reactions (
    id_reaction integer NOT NULL,
    reaction character varying(20) DEFAULT 'like'::character varying NOT NULL,
    id_post integer NOT NULL,
    id_user integer NOT NULL
);


ALTER TABLE public.reactions OWNER TO sk8;

--
-- Name: reactions_id_reaction_seq; Type: SEQUENCE; Schema: public; Owner: sk8
--

CREATE SEQUENCE public.reactions_id_reaction_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.reactions_id_reaction_seq OWNER TO sk8;

--
-- Name: reactions_id_reaction_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: sk8
--

ALTER SEQUENCE public.reactions_id_reaction_seq OWNED BY public.reactions.id_reaction;


--
-- Name: towns; Type: TABLE; Schema: public; Owner: sk8
--

CREATE TABLE public.towns (
    id_town integer NOT NULL,
    name character varying(255) NOT NULL
);


ALTER TABLE public.towns OWNER TO sk8;

--
-- Name: towns_id_town_seq; Type: SEQUENCE; Schema: public; Owner: sk8
--

CREATE SEQUENCE public.towns_id_town_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.towns_id_town_seq OWNER TO sk8;

--
-- Name: towns_id_town_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: sk8
--

ALTER SEQUENCE public.towns_id_town_seq OWNED BY public.towns.id_town;


--
-- Name: users; Type: TABLE; Schema: public; Owner: sk8
--

CREATE TABLE public.users (
    id_user integer NOT NULL,
    identifier character varying(500) NOT NULL,
    full_name character varying(255) NOT NULL,
    username character varying(255) NOT NULL,
    email character varying(255),
    phone character varying(255),
    password character varying(500) NOT NULL,
    registration_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    is_deleted integer DEFAULT 0 NOT NULL,
    bio text,
    id_town integer,
    photo_uri character varying(500),
    education character varying(400),
    occupation character varying(400)
);


ALTER TABLE public.users OWNER TO sk8;

--
-- Name: users_id_user_seq; Type: SEQUENCE; Schema: public; Owner: sk8
--

CREATE SEQUENCE public.users_id_user_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_id_user_seq OWNER TO sk8;

--
-- Name: users_id_user_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: sk8
--

ALTER SEQUENCE public.users_id_user_seq OWNED BY public.users.id_user;


--
-- Name: comments id_comment; Type: DEFAULT; Schema: public; Owner: sk8
--

ALTER TABLE ONLY public.comments ALTER COLUMN id_comment SET DEFAULT nextval('public.comments_id_comment_seq'::regclass);


--
-- Name: followers id_follower; Type: DEFAULT; Schema: public; Owner: sk8
--

ALTER TABLE ONLY public.followers ALTER COLUMN id_follower SET DEFAULT nextval('public.followers_id_follower_seq'::regclass);


--
-- Name: posts id_post; Type: DEFAULT; Schema: public; Owner: sk8
--

ALTER TABLE ONLY public.posts ALTER COLUMN id_post SET DEFAULT nextval('public.posts_id_post_seq'::regclass);


--
-- Name: reactions id_reaction; Type: DEFAULT; Schema: public; Owner: sk8
--

ALTER TABLE ONLY public.reactions ALTER COLUMN id_reaction SET DEFAULT nextval('public.reactions_id_reaction_seq'::regclass);


--
-- Name: towns id_town; Type: DEFAULT; Schema: public; Owner: sk8
--

ALTER TABLE ONLY public.towns ALTER COLUMN id_town SET DEFAULT nextval('public.towns_id_town_seq'::regclass);


--
-- Name: users id_user; Type: DEFAULT; Schema: public; Owner: sk8
--

ALTER TABLE ONLY public.users ALTER COLUMN id_user SET DEFAULT nextval('public.users_id_user_seq'::regclass);


--
-- Data for Name: comments; Type: TABLE DATA; Schema: public; Owner: sk8
--

COPY public.comments (id_comment, identifier, content, added_on, id_user, id_post, is_hidden, is_deleted) FROM stdin;
\.


--
-- Data for Name: followers; Type: TABLE DATA; Schema: public; Owner: sk8
--

COPY public.followers (id_follower, id_user, id_followed_user) FROM stdin;
1	1	6
3	6	1
\.


--
-- Data for Name: posts; Type: TABLE DATA; Schema: public; Owner: sk8
--

COPY public.posts (id_post, identifier, type, title, description, content_uri, id_user, added_on, is_deleted, is_hidden) FROM stdin;
18	df09f23e02392893	video	Thrasher-type shit	\N	2978733077426486194.mp4	6	2023-03-08 11:38:25.307173	0	0
10	389fd238d0308e839	video	Truck	Aspect Ratio Test	2634575833826916334.mp4	6	2023-03-08 12:34:46	0	0
20	df09f23e02392892	video	California	Horizontal Video Test	3019226494447924267.mp4	6	2022-07-08 11:38:25.307	0	0
16	df09f23e02392891	video	\N	\N	2935155318960672681.mp4	6	2023-03-08 11:38:25.307173	0	0
13	sdf79300d9380980	video	(Another) John Hill's Skate Part	\N	2655516957975949285_2655515227362155487.mp4	6	2023-03-08 11:36:22.000928	0	0
11	384f82309d039e000	video	John Hill's Skate Part	\N	2655516957975949285_2655515222270053154.mp4	6	2023-03-08 11:36:22.000928	0	0
19	af09f23e02392893	video	Predlog za ŠCV	\N	3015701191484801250.mp4	6	2023-03-08 11:38:25.307173	0	0
14	df09f23e02392898	video	\N	\N	2912681467088142134_2912681099692137927.mp4	6	2023-03-08 11:38:25.307173	0	0
7	57pibc1jlwl9zdr9zi	video	British Emprire Discovers Tea	Tea	57pibc1jlwl9zdr9zi_trim.C24E2BF7-CF90-4A53-B2F2-9E05C3A2F964.MOV	6	2022-11-02 09:31:50.867428	0	0
\.


--
-- Data for Name: reactions; Type: TABLE DATA; Schema: public; Owner: sk8
--

COPY public.reactions (id_reaction, reaction, id_post, id_user) FROM stdin;
\.


--
-- Data for Name: towns; Type: TABLE DATA; Schema: public; Owner: sk8
--

COPY public.towns (id_town, name) FROM stdin;
1	Rečica ob Savinji
2	Mozirje
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: sk8
--

COPY public.users (id_user, identifier, full_name, username, email, phone, password, registration_date, is_deleted, bio, id_town, photo_uri, education, occupation) FROM stdin;
6	57pibc1av5l9jv20wt	Mike Smith	mike	\N	\N	12345	2022-10-22 13:51:46.991068	0	\N	\N	\N	\N	\N
1	4t9guwojidsdf8739872	Tobija Žuntar	sk8	tobija.zuntar@gmail.com	\N	arizona	2022-10-22 10:26:20.439822	0	\N	1	sk8_profile.jpg	\N	\N
\.


--
-- Name: comments_id_comment_seq; Type: SEQUENCE SET; Schema: public; Owner: sk8
--

SELECT pg_catalog.setval('public.comments_id_comment_seq', 15, true);


--
-- Name: followers_id_follower_seq; Type: SEQUENCE SET; Schema: public; Owner: sk8
--

SELECT pg_catalog.setval('public.followers_id_follower_seq', 3, true);


--
-- Name: posts_id_post_seq; Type: SEQUENCE SET; Schema: public; Owner: sk8
--

SELECT pg_catalog.setval('public.posts_id_post_seq', 20, true);


--
-- Name: reactions_id_reaction_seq; Type: SEQUENCE SET; Schema: public; Owner: sk8
--

SELECT pg_catalog.setval('public.reactions_id_reaction_seq', 31, true);


--
-- Name: towns_id_town_seq; Type: SEQUENCE SET; Schema: public; Owner: sk8
--

SELECT pg_catalog.setval('public.towns_id_town_seq', 2, true);


--
-- Name: users_id_user_seq; Type: SEQUENCE SET; Schema: public; Owner: sk8
--

SELECT pg_catalog.setval('public.users_id_user_seq', 14, true);


--
-- Name: comments comments_pkey; Type: CONSTRAINT; Schema: public; Owner: sk8
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_pkey PRIMARY KEY (id_comment);


--
-- Name: users email; Type: CONSTRAINT; Schema: public; Owner: sk8
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT email UNIQUE (email);


--
-- Name: followers followers_pkey; Type: CONSTRAINT; Schema: public; Owner: sk8
--

ALTER TABLE ONLY public.followers
    ADD CONSTRAINT followers_pkey PRIMARY KEY (id_follower);


--
-- Name: comments identifier_comments; Type: CONSTRAINT; Schema: public; Owner: sk8
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT identifier_comments UNIQUE (identifier);


--
-- Name: posts identifier_posts; Type: CONSTRAINT; Schema: public; Owner: sk8
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT identifier_posts UNIQUE (identifier);


--
-- Name: users identifier_users; Type: CONSTRAINT; Schema: public; Owner: sk8
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT identifier_users UNIQUE (identifier);


--
-- Name: posts posts_pkey; Type: CONSTRAINT; Schema: public; Owner: sk8
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_pkey PRIMARY KEY (id_post);


--
-- Name: reactions reactions_id_post_id_user_reaction_key; Type: CONSTRAINT; Schema: public; Owner: sk8
--

ALTER TABLE ONLY public.reactions
    ADD CONSTRAINT reactions_id_post_id_user_reaction_key UNIQUE (id_post, id_user, reaction);


--
-- Name: reactions reactions_pkey; Type: CONSTRAINT; Schema: public; Owner: sk8
--

ALTER TABLE ONLY public.reactions
    ADD CONSTRAINT reactions_pkey PRIMARY KEY (id_reaction);


--
-- Name: towns towns_pkey; Type: CONSTRAINT; Schema: public; Owner: sk8
--

ALTER TABLE ONLY public.towns
    ADD CONSTRAINT towns_pkey PRIMARY KEY (id_town);


--
-- Name: users username; Type: CONSTRAINT; Schema: public; Owner: sk8
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT username UNIQUE (username);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: sk8
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id_user);


--
-- Name: comments fk_comments_posts; Type: FK CONSTRAINT; Schema: public; Owner: sk8
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT fk_comments_posts FOREIGN KEY (id_post) REFERENCES public.posts(id_post) ON UPDATE CASCADE;


--
-- Name: comments fk_comments_users; Type: FK CONSTRAINT; Schema: public; Owner: sk8
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT fk_comments_users FOREIGN KEY (id_user) REFERENCES public.users(id_user) ON UPDATE CASCADE;


--
-- Name: followers fk_followed_user; Type: FK CONSTRAINT; Schema: public; Owner: sk8
--

ALTER TABLE ONLY public.followers
    ADD CONSTRAINT fk_followed_user FOREIGN KEY (id_followed_user) REFERENCES public.users(id_user) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: followers fk_following_user; Type: FK CONSTRAINT; Schema: public; Owner: sk8
--

ALTER TABLE ONLY public.followers
    ADD CONSTRAINT fk_following_user FOREIGN KEY (id_user) REFERENCES public.users(id_user) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: posts fk_posts_users; Type: FK CONSTRAINT; Schema: public; Owner: sk8
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT fk_posts_users FOREIGN KEY (id_user) REFERENCES public.users(id_user) ON UPDATE CASCADE;


--
-- Name: reactions fk_reactions_posts; Type: FK CONSTRAINT; Schema: public; Owner: sk8
--

ALTER TABLE ONLY public.reactions
    ADD CONSTRAINT fk_reactions_posts FOREIGN KEY (id_post) REFERENCES public.posts(id_post) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: reactions fk_reactions_users; Type: FK CONSTRAINT; Schema: public; Owner: sk8
--

ALTER TABLE ONLY public.reactions
    ADD CONSTRAINT fk_reactions_users FOREIGN KEY (id_user) REFERENCES public.users(id_user) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: users fk_users_towns; Type: FK CONSTRAINT; Schema: public; Owner: sk8
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT fk_users_towns FOREIGN KEY (id_town) REFERENCES public.towns(id_town) ON UPDATE CASCADE;


--
-- PostgreSQL database dump complete
--

