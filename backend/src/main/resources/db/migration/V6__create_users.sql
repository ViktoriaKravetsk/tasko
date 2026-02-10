create table if not exists users (
                                     id bigserial primary key,
                                     google_id varchar(64) not null unique,
    email varchar(255) not null unique,
    name varchar(255) not null,
    avatar_url text,
    enabled boolean not null default true,
    created_at timestamptz not null default now()
);

