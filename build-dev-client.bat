@echo off
SET PATH=%PATH%;C:\Program Files\nodejs
cd /d "C:\Dev\wittsy-app-main\wittsy-app"
echo.
echo ========================================
echo Building Development Client for iOS
echo ========================================
echo.
echo This will create a custom Expo Go build with your native modules
echo You'll install this on your phone instead of regular Expo Go
echo.
npx eas-cli build --profile development --platform ios
