alter table tasks
    add constraint ck_tasks_max_score_positive
        check (max_score > 0);
