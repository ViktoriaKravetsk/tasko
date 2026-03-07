create table if not exists notification_log (
    id bigserial primary key,
    type varchar(64) not null,
    receiver_email varchar(255) not null,
    status varchar(32) not null,
    error_message text,
    related_entity_id bigint,
    retry_count int not null default 0,
    sent_at timestamp with time zone,
    created_at timestamp with time zone not null default now()
);

create index if not exists idx_notification_log_receiver_email on notification_log (receiver_email);
create index if not exists idx_notification_log_type on notification_log (type);
create index if not exists idx_notification_log_status on notification_log (status);