-- Function to update grocery item names when profile name changes
CREATE OR REPLACE FUNCTION update_grocery_item_names()
RETURNS TRIGGER AS $$
BEGIN
    -- Update added_by_name
    UPDATE grocery_items
    SET added_by_name = NEW.full_name
    WHERE added_by = NEW.id;

    -- Update bought_by_name
    UPDATE grocery_items
    SET bought_by_name = NEW.full_name
    WHERE bought_by = NEW.id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to run the function after profile update
DROP TRIGGER IF EXISTS on_profile_name_change ON profiles;

CREATE TRIGGER on_profile_name_change
AFTER UPDATE OF full_name ON profiles
FOR EACH ROW
WHEN (OLD.full_name IS DISTINCT FROM NEW.full_name)
EXECUTE FUNCTION update_grocery_item_names();
