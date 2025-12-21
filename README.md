# 🛒 Grocery Shopping App

A real-time collaborative grocery shopping app built with **React Native (Expo)** and **Firebase**. Perfect for couples to manage their shopping list together with instant notifications!

## ✨ Features

- 🔐 **User Authentication** - Email/password login with role selection (Wife/Husband)
- 📝 **Real-time Sync** - Grocery list updates instantly across devices using Firestore
- 🔔 **Push Notifications** - Get notified when your partner adds or purchases items
- 👥 **Collaborative** - Share a grocery list with your family using a Family ID
- 📱 **Cross-platform** - Works on iOS, Android, and Web
- 🎨 **Beautiful UI** - Modern design with smooth animations

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **npm** or **yarn** package manager
- **Expo CLI** (optional, but recommended)
- A **Firebase account** - [Create one here](https://firebase.google.com/)

### Step 1: Install Dependencies

```bash
cd grocery-app
npm install
```

### Step 2: Set Up Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (or use an existing one)
3. Enable **Email/Password Authentication**:
   - Go to Authentication > Sign-in method
   - Enable "Email/Password"
4. Create a **Firestore Database**:
   - Go to Firestore Database
   - Click "Create database"
   - Start in **test mode** (you can add security rules later)
5. Get your Firebase configuration:
   - Go to Project Settings (gear icon)
   - Scroll down to "Your apps"
   - Click the web icon (`</>`) to add a web app
   - Copy the Firebase configuration object

### Step 3: Configure Firebase in the App

Open `firebase.config.js` and replace the placeholder values with your Firebase configuration:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### Step 4: Run the App

```bash
npm start
```

This will start the Expo development server. You have several options:

- **📱 On your phone**: Install the **Expo Go** app ([iOS](https://apps.apple.com/app/expo-go/id982107779) | [Android](https://play.google.com/store/apps/details?id=host.exp.exponent)) and scan the QR code
- **💻 On web**: Press `w` in the terminal
- **📱 On iOS Simulator**: Press `i` (macOS only, requires Xcode)
- **📱 On Android Emulator**: Press `a` (requires Android Studio)

## 📖 How to Use

### Creating an Account

1. Open the app and tap **"Sign Up"**
2. Enter your email and password
3. Select your role: **Wife** 👩 or **Husband** 👨
4. Enter a **Family ID** (e.g., "smith-family")
   - **Important**: Both partners must use the same Family ID to share the grocery list
5. Tap **"Sign Up"**

### Adding Grocery Items

1. Tap the **"+"** floating button
2. Enter the item name (e.g., "Milk", "Bread")
3. Tap **"Add Item"**
4. Your partner will receive a notification! 🔔

### Purchasing Items

1. Tap on any item in the list to mark it as bought ✅
2. Your partner will be notified that you purchased the item
3. Tap again to unmark if needed

### Notification Setup

For full push notification support:
- On **iOS**: Notifications work automatically on physical devices
- On **Android**: Notifications work automatically, but you may need to enable them in system settings
- On **Web**: Notifications are not supported by Expo

## 📂 Project Structure

```
grocery-app/
├── App.js                          # Main app entry
├── firebase.config.js              # Firebase configuration
├── src/
│   ├── screens/
│   │   ├── LoginScreen.js          # Login/Signup screen
│   │   ├── GroceryListScreen.js    # Main grocery list
│   │   └── ProfileScreen.js        # User profile
│   ├── components/
│   │   ├── GroceryItem.js          # Grocery item component
│   │   ├── AddItemModal.js         # Add item modal
│   │   └── NotificationBadge.js    # Notification badge
│   ├── services/
│   │   ├── authService.js          # Authentication logic
│   │   ├── groceryService.js       # Firestore operations
│   │   └── notificationService.js  # Notification handling
│   └── styles/
│       └── theme.js                # App styling theme
```

## 🔒 Security Rules (Optional but Recommended)

After testing, secure your Firestore database with these rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Grocery lists
    match /groceryLists/{familyId}/items/{itemId} {
      allow read, write: if request.auth != null &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.familyId == familyId;
    }
  }
}
```

## 🛠️ Tech Stack

- **Frontend**: React Native with Expo
- **Navigation**: React Navigation
- **Backend**: Firebase (Auth + Firestore)
- **Notifications**: Expo Notifications
- **Styling**: React Native StyleSheet

## 📝 Customization

### Change App Colors

Edit `src/styles/theme.js` to customize colors:

```javascript
export const colors = {
  primary: '#6366f1',  // Change this to your preferred color
  wifeColor: '#ec4899',
  husbandColor: '#3b82f6',
  // ... more colors
};
```

### Change Role Names

If you prefer generic names instead of "Wife/Husband", search for these terms in the codebase and replace them with your preferred labels (e.g., "Partner 1", "Partner 2").

## 🐛 Troubleshooting

### "npx: command not found"
- Install Node.js from [nodejs.org](https://nodejs.org/)
- Restart your terminal after installation

### Firebase errors
- Double-check your Firebase configuration in `firebase.config.js`
- Ensure Email/Password authentication is enabled in Firebase Console
- Make sure Firestore is created and in test mode

### Notifications not working
- Notifications require physical devices or proper simulator setup
- Check that notification permissions are granted in device settings
- Web version doesn't support push notifications

## 📱 Building for Production

### Build for iOS
```bash
expo build:ios
```

### Build for Android
```bash
expo build:android
```

For detailed instructions, see [Expo's Building Standalone Apps guide](https://docs.expo.dev/distribution/building-standalone-apps/).

## 📄 License

This project is open source and available for personal use.

## 🤝 Contributing

Feel free to fork this project and customize it for your needs!

---

**Made with ❤️ for couples who shop together**
