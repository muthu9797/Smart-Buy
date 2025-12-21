# 📝 Adding Quantity Feature

## ✅ Step 1: Update Database

Run this SQL in your Supabase SQL Editor to add the `quantity` column:

```sql
-- Add quantity column to grocery_items table
ALTER TABLE grocery_items 
ADD COLUMN quantity TEXT DEFAULT '1';
```

## ✅ Step 2: Restart App

After running the SQL, restart your app:

```powershell
# Stop server (Ctrl + C)
npm start
```

## 🎉 Feature Ready!

Now when you add an item, you'll see a new field for **Quantity**.
- Default is "1"
- You can enter "2 kg", "500g", "3 packets", etc.
- It shows up next to the item name in the list!
