ALTER TABLE projects
    ADD COLUMN IF NOT EXISTS emoji VARCHAR(16);

UPDATE projects
SET emoji = U&'\+01F4C1'
WHERE emoji IS NULL OR btrim(emoji) = '';

ALTER TABLE projects
    ALTER COLUMN emoji SET DEFAULT U&'\+01F4C1';

ALTER TABLE projects
    ALTER COLUMN emoji SET NOT NULL;
