alter table submissions
    add column ai_status varchar(32) not null default 'PENDING';

alter table submissions
    add column ai_error_message text;

update submissions
set ai_status = 'DONE'
where ai_evaluated_at is not null;
