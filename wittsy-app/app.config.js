export default {
  expo: {
    name: "Wittz",
    slug: "wittsy-app",
    version: "1.0.1",
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
      buildNumber: "3",
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
        "applinks:wittsy.app",
        "applinks:www.wittsy.app"
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
              host: "wittsy.app",
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
        projectId: "1836a769-48db-4dc3-bffb-6487530c5daa"
      },
      // Environment variables - these will be available via expo-constants
      revenueCatIosKey: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY,
      revenueCatAndroidKey: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY,
    },
    owner: "mightygunja",
    updates: {
      enabled: false
    }
  }
};
