create table if not exists users
(
    id_user           serial
        primary key,
    identifier        varchar(500)                        not null
        constraint identifier_users
        unique,
    full_name         varchar(255)                        not null,
    username          varchar(255)                        not null
        constraint username
        unique,
    email             varchar(255)
        constraint email
        unique,
    phone             varchar(255),
    password          varchar(500)                        not null,
    registration_date timestamp default CURRENT_TIMESTAMP not null,
    is_deleted        integer   default 0                 not null,
    bio               text,
    photo_uri         varchar(500)
);

create table if not exists followers
(
    id_follower      serial
        primary key,
    id_user          integer not null
        constraint fk_following_user
        references users
        on update cascade on delete restrict,
    id_followed_user integer not null
        constraint fk_followed_user
        references users
        on update cascade on delete restrict
);

create table if not exists posts
(
    id_post     serial
        primary key,
    identifier  varchar(500)                          not null
        constraint identifier_posts
        unique,
    type        varchar(20) default 'video':: character varying not null,
    title       varchar(480),
    description text,
    content_uri varchar(500),
    id_user     integer                               not null
        constraint fk_posts_users
        references users
        on update cascade,
    added_on    timestamp   default CURRENT_TIMESTAMP not null,
    is_deleted  integer     default 0                 not null,
    is_hidden   integer     default 0                 not null
);

create table if not exists comments
(
    id_comment serial
        primary key,
    identifier varchar(500)                        not null
        constraint identifier_comments
        unique,
    content    text                                not null,
    added_on   timestamp default CURRENT_TIMESTAMP not null,
    id_user    integer                             not null
        constraint fk_comments_users
        references users
        on update cascade,
    id_post    integer                             not null
        constraint fk_comments_posts
        references posts
        on update cascade,
    is_hidden  integer   default 0                 not null,
    is_deleted integer   default 0                 not null
);

create table if not exists reactions
(
    id_reaction serial
        primary key,
    reaction    varchar(20) default 'like':: character varying not null,
    id_post     integer not null
        constraint fk_reactions_posts
        references posts
        on update cascade on delete restrict,
    id_user     integer not null
        constraint fk_reactions_users
        references users
        on update cascade on delete restrict,
    unique (id_post, id_user, reaction)
);

