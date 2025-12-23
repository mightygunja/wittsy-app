export default {
  expo: {
    name: "Wittsy",
    slug: "wittsy-app",
    version: "1.0.0",
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
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false
      },
      associatedDomains: ["applinks:wittsy.app"]
    },
    android: {
      package: "com.wittsy.app",
      intentFilters: [
        {
          action: "VIEW",
          autoVerify: true,
          data: [
            {
              scheme: "https",
              host: "wittsy.app"
            },
            {
              scheme: "wittsy"
            }
          ],
          category: ["BROWSABLE", "DEFAULT"]
        }
      ],
      permissions: [
        "VIBRATE",
        "RECEIVE_BOOT_COMPLETED"
      ]
    },
    web: {
      bundler: "metro"
    },
    plugins: [
      [
        "expo-notifications",
        {
          icon: "./assets/notification-icon.png",
          color: "#6C63FF"
        }
      ]
    ],
    extra: {
      eas: {
        projectId: "1836a769-48db-4dc3-bffb-6487530c5daa"
      },
      EXPO_PUBLIC_FIREBASE_API_KEY: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
      EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
      EXPO_PUBLIC_FIREBASE_PROJECT_ID: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
      EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
      EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      EXPO_PUBLIC_FIREBASE_APP_ID: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
      EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID
    }
  }
}
