create table if not exists tasks (
                                     id bigserial primary key,
                                     project_id bigint not null references projects(id) on delete cascade,
    title varchar(200) not null,
    description text,
    deadline date,
    status varchar(32) not null,
    created_at timestamptz not null,
    updated_at timestamptz not null
    );

create index if not exists idx_tasks_project_id on tasks(project_id);
create index if not exists idx_tasks_project_created_at on tasks(project_id, created_at desc);
