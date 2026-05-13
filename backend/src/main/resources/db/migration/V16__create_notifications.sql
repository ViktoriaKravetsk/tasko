create table if not exists notifications (
    id bigserial primary key,
    user_id bigint not null references users(id) on delete cascade,
    type varchar(64) not null,
    title varchar(180) not null,
    message text not null,
    href varchar(500),
    related_entity_id bigint,
    read_at timestamp with time zone,
    created_at timestamp with time zone not null default now()
);

create index if not exists idx_notifications_user_created on notifications (user_id, created_at desc);
create index if not exists idx_notifications_user_unread on notifications (user_id, read_at) where read_at is null;
