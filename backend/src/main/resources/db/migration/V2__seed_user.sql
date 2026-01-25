INSERT INTO users (id, google_id, email, name, avatar_url, theme, enabled)
VALUES (1, NULL, 'test@tasko.local', 'Test User', NULL, 'LIGHT', TRUE)
    ON CONFLICT (email) DO NOTHING;
