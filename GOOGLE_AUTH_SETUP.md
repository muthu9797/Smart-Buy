# Google Sign-In Setup Guide

To make the "Sign in with Google" button work, you need to configure Google Cloud and Supabase.

## 1. Google Cloud Console Setup

1.  Go to the [Google Cloud Console](https://console.cloud.google.com/).
2.  Create a new project (e.g., "Grocery App").
3.  Go to **APIs & Services** > **OAuth consent screen**.
    *   Select **External**.
    *   Fill in required fields (App name, Email).
    *   Click **Save and Continue**.
4.  Go to **Credentials**.
5.  Click **Create Credentials** > **OAuth client ID**.
6.  Select **Web application** (even though it's mobile, we use the web flow with Supabase).
7.  Add the **Authorized redirect URIs**:
    *   You need to get this from your Supabase Dashboard (see below).
    *   It usually looks like: `https://<your-project-ref>.supabase.co/auth/v1/callback`
8.  Click **Create**.
9.  Copy the **Client ID** and **Client Secret**.

## 2. Supabase Dashboard Setup

1.  Go to your [Supabase Dashboard](https://supabase.com/dashboard).
2.  Select your project.
3.  Go to **Authentication** > **Providers**.
4.  Select **Google**.
5.  Enable **Google**.
6.  Paste the **Client ID** and **Client Secret** from Google Cloud.
7.  Copy the **Callback URL (for OAuth)** shown here and make sure it's added to your Google Cloud "Authorized redirect URIs" (Step 1.7).
8.  Click **Save**.

## 3. URL Configuration (Supabase)

1.  In Supabase Dashboard, go to **Authentication** > **URL Configuration**.
2.  Add your app's redirect URL.
    *   If using **Expo Go**, it usually looks like `exp://<your-ip>:8081/--/auth/callback` or `exp://localhost:8081/--/auth/callback`.
    *   You can check the exact URL by running `console.log(makeRedirectUri({ path: 'auth/callback' }))` in your code if needed, or by checking the error message if it mismatches.
    *   A good safety net for development is to add `exp://*` (if supported) or just your specific Expo URL.

## 4. Test It

1.  Restart your app (`npx expo start`).
2.  Click **"Sign in with Google"**.
3.  A browser window should open.
4.  Sign in with your Google account.
5.  You should be redirected back to the app and logged in!
