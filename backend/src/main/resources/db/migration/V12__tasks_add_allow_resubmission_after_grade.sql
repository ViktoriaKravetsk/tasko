alter table tasks
    add column allow_resubmission_after_grade boolean not null default true;
