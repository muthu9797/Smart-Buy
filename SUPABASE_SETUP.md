# 🚀 Supabase Setup Guide

## ✅ Step 1: Run the SQL to Create Tables

1. Go to your Supabase project dashboard
2. Click **SQL Editor** in the left sidebar
3. Click **"New query"**
4. Copy the entire SQL code from `SUPABASE_SCHEMA.sql` (see below)
5. Paste it into the editor
6. Click **"Run"** or press `Ctrl + Enter`
7. You should see "Success. No rows returned"

## 🔑 Step 2: Get Your Anon Key

1. In your Supabase dashboard, click **Settings** (⚙️) in the left sidebar
2. Click **API**
3. You'll see two important values:

   **Project URL:**
   ```
   https://bkamgnuuxesljmtcfyuo.supabase.co
   ```
   ✅ Already configured in your app!

   **anon public key:**
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOi...
   ```
   ⚠️ Copy this long string starting with `eyJ`

4. Open `supabase.config.js` in your project
5. Replace `YOUR_ANON_KEY_HERE` with the key you just copied

## 📝 Step 3: Enable Email Confirmations (Optional)

For easier testing, disable email confirmations:

1. Go to **Authentication** > **Providers** > **Email**
2. Scroll down to **"Confirm email"**
3. **Disable** it (so you don't need to verify emails during testing)
4. Click **Save**

## 🧪 Step 4: Test the App

1. Stop your current server (`Ctrl + C` in PowerShell)
2. Start it again: `npm start`
3. Scan the QR code with Expo Go
4. Create an account and try adding grocery items!

---

## 🗃️ Database Schema (SQL to Run)

Copy this entire SQL code and run it in the Supabase SQL Editor:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table (stores user role and family info)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('wife', 'husband')),
  family_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create grocery_items table
CREATE TABLE grocery_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id TEXT NOT NULL,
  name TEXT NOT NULL,
  added_by UUID REFERENCES auth.users(id) NOT NULL,
  added_by_role TEXT NOT NULL CHECK (added_by_role IN ('wife', 'husband')),
  is_bought BOOLEAN DEFAULT FALSE,
  bought_by UUID REFERENCES auth.users(id),
  bought_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_grocery_items_family_id ON grocery_items(family_id);
CREATE INDEX idx_grocery_items_created_at ON grocery_items(created_at DESC);
CREATE INDEX idx_profiles_family_id ON profiles(family_id);

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE grocery_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- RLS Policies for grocery_items
CREATE POLICY "Users can view items from their family"
  ON grocery_items FOR SELECT
  USING (
    family_id IN (
      SELECT family_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert items for their family"
  ON grocery_items FOR INSERT
  WITH CHECK (
    family_id IN (
      SELECT family_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update items from their family"
  ON grocery_items FOR UPDATE
  USING (
    family_id IN (
      SELECT family_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete items from their family"
  ON grocery_items FOR DELETE
  USING (
    family_id IN (
      SELECT family_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_grocery_items_updated_at
  BEFORE UPDATE ON grocery_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

---

## ✅ Checklist

- [ ] Run SQL in Supabase SQL Editor
- [ ] Get anon key from Settings > API
- [ ] Update `supabase.config.js` with your anon key
- [ ] Disable email confirmation (optional, for easier testing)
- [ ] Restart app with `npm start`
- [ ] Test creating accounts and adding grocery items

---

## 🎯 What Changed from Firebase?

| Firebase | Supabase |
|----------|----------|
| `firebase.config.js` | `supabase.config.js` |
| Firestore collections | PostgreSQL tables |
| `onSnapshot` | Real-time subscriptions |
| Firebase Auth | Supabase Auth |
| No billing required! | **✅ 100% Free** |

Everything else works exactly the same from the user's perspective!

---

Need help? Check if:
1. ✅ SQL ran successfully (no errors in SQL Editor)
2. ✅ Anon key is correct in `supabase.config.js`
3. ✅ Email confirmation is disabled in Auth settings
4. ✅ App restarted after config changes
