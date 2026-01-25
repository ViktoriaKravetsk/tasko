INSERT INTO users (id, google_id, email, name, avatar_url, theme, enabled)
VALUES (2, NULL, 'student@tasko.local', 'Student User', NULL, 'LIGHT', TRUE)
    ON CONFLICT (email) DO NOTHING;
