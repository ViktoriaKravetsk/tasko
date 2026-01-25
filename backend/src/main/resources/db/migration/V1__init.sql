CREATE TABLE users (
                       id           BIGSERIAL PRIMARY KEY,
                       google_id    VARCHAR(128),
                       email        VARCHAR(255) NOT NULL UNIQUE,
                       name         VARCHAR(120) NOT NULL,
                       avatar_url   TEXT,
                       theme        VARCHAR(10) NOT NULL DEFAULT 'LIGHT',
                       enabled      BOOLEAN NOT NULL DEFAULT TRUE,
                       created_at   TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE projects (
                          id            BIGSERIAL PRIMARY KEY,
                          owner_id      BIGINT NOT NULL REFERENCES users(id),
                          name          VARCHAR(160) NOT NULL,
                          description   TEXT,
                          deadline      DATE,
                          join_code     VARCHAR(16) NOT NULL UNIQUE,
                          join_enabled  BOOLEAN NOT NULL DEFAULT TRUE,
                          active        BOOLEAN NOT NULL DEFAULT TRUE,
                          created_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE project_members (
                                 id          BIGSERIAL PRIMARY KEY,
                                 project_id  BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
                                 user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                                 role        VARCHAR(16) NOT NULL,
                                 joined_at   TIMESTAMP NOT NULL DEFAULT NOW(),
                                 CONSTRAINT uq_project_member UNIQUE (project_id, user_id)
);
