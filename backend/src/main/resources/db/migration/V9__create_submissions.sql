create table submissions (
                             id bigserial primary key,

                             task_id bigint not null,
                             student_id bigint not null,

                             text_answer text,
                             file_link text,

                             submitted_at timestamptz not null,
                             late boolean not null default false,

    -- крок 2 (оцінювання) і крок 3 (AI) додати пізніше
                             teacher_score integer,
                             teacher_comment text,
                             graded_at timestamptz,

                             ai_score integer,
                             ai_comment text,
                             ai_evaluated_at timestamptz,

                             constraint fk_submissions_task foreign key (task_id) references tasks(id) on delete cascade,
                             constraint fk_submissions_student foreign key (student_id) references users(id) on delete cascade,
                             constraint uq_submissions_task_student unique (task_id, student_id)
);

create index idx_submissions_task_id on submissions(task_id);
create index idx_submissions_student_id on submissions(student_id);
