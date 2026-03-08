export default {
  expo: {
    name: "Wittz - Party Word Game",
    slug: "wittsy-app",
    version: "1.0.5",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "automatic",
    scheme: "wittsy",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#6C63FF"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.wittsy.app",
      buildNumber: "40",
      infoPlist: {
        NSCameraUsageDescription: "Wittz needs access to your camera to take profile photos.",
        NSPhotoLibraryUsageDescription: "Wittz needs access to your photo library to select profile photos.",
        NSMicrophoneUsageDescription: "Wittz needs access to your microphone for voice chat features.",
        NSUserNotificationsUsageDescription: "Wittz needs to send you notifications about game invites, challenges, and events."
      },
      config: {
        usesNonExemptEncryption: false
      },
      associatedDomains: [
        "applinks:wittz.app",
        "applinks:www.wittz.app"
      ]
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#6C63FF"
      },
      package: "com.wittsy.app",
      versionCode: 1,
      permissions: [
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE",
        "RECORD_AUDIO",
        "VIBRATE",
        "POST_NOTIFICATIONS"
      ],
      intentFilters: [
        {
          action: "VIEW",
          autoVerify: true,
          data: [
            {
              scheme: "https",
              host: "wittz.app",
              pathPrefix: "/"
            }
          ],
          category: [
            "BROWSABLE",
            "DEFAULT"
          ]
        }
      ]
    },
    web: {
      favicon: "./assets/favicon.png",
      bundler: "metro"
    },
    plugins: [
      [
        "expo-splash-screen",
        {
          backgroundColor: "#6C63FF",
          image: "./assets/splash-icon.png",
          imageWidth: 200
        }
      ],
      [
        "expo-notifications",
        {
          icon: "./assets/notification-icon.png",
          color: "#6C63FF",
          sounds: [
            "./assets/audio/notification.mp3"
          ]
        }
      ],
      [
        "expo-av",
        {
          microphonePermission: "Allow Wittz to access your microphone for voice chat."
        }
      ]
    ],
    extra: {
      eas: {
        projectId: "947483cc-b065-449a-b8fd-7e0da17d1ed2"
      },
      // Firebase configuration
      firebaseApiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyBJf4239QrQhCtd4ivB-fNPZ358dYIEG6M",
      firebaseAuthDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "wittsy-51992.firebaseapp.com",
      firebaseProjectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "wittsy-51992",
      firebaseStorageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "wittsy-51992.firebasestorage.app",
      firebaseMessagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "757129696124",
      firebaseAppId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:757129696124:ios:ef033560b02392c9b80af9",
      firebaseMeasurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
      // RevenueCat configuration
      revenueCatIosKey: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY,
      revenueCatAndroidKey: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY,
    },
    owner: "adilgunja",
    updates: {
      enabled: false
    }
  }
};
