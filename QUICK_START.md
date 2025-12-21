# 📱 How to Run Your Grocery App

## ✅ What's Been Fixed

I've resolved all the errors:
- ✅ Installed `babel-preset-expo` package
- ✅ Created all missing asset files (app icon, splash screen, etc.)
- ✅ App is now ready to run!

---

## 🚀 Next Steps

### **Step 1: Stop the Current Server**

In your PowerShell terminal where the app is running, press:
```
Ctrl + C
```

This will stop the current server that has errors.

### **Step 2: Clear Cache and Restart**

Run this command to clear the cache and start fresh:
```powershell
npm start -- --clear
```

Or simply:
```powershell
npm start
```

### **Step 3: See the App on Your Phone**

Once the server starts and shows the QR code:

**On Android:**
1. Open **Expo Go** app
2. Tap "Scan QR code"
3. Point camera at QR code in terminal
4. App will load!

**On iOS:**
1. Open **Camera** app
2. Point at QR code
3. Tap notification
4. Opens in Expo Go

**Or press `w` to open in web browser for quick preview**

---

## ⚠️ Important: Configure Firebase Before Using

The app will load, but you need to set up Firebase to use the login and grocery features:

1. Go to: https://console.firebase.google.com/
2. Click "Add project" or use existing
3. Enable **Email/Password** authentication
4. Create **Firestore** database (test mode)
5. Copy your config to: `d:\projects\grocery-app\firebase.config.js`

Replace these lines:
```javascript
apiKey: "YOUR_API_KEY",
authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
projectId: "YOUR_PROJECT_ID",
// ... etc
```

---

## 📝 Quick Commands

```powershell
# Stop the server
Ctrl + C

# Restart the app
npm start

# Clear cache if issues
npm start -- --clear

# Open in web browser (quick preview)
# (After npm start, press 'w')
```

---

## 🎉 You're Almost There!

The app is ready to run on your phone. Just need Firebase configuration to make login work!
