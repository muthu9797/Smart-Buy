DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'profiles'
        AND column_name = 'full_name'
    ) THEN
        ALTER TABLE profiles ADD COLUMN full_name TEXT;
    END IF;
END $$;
