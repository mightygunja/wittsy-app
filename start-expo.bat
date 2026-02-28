@echo off
SET PATH=%PATH%;C:\Program Files\nodejs
SET EXPO_NO_TELEMETRY=1
cd /d "C:\Dev\wittsy-app-main\wittsy-app"
echo.
echo ========================================
echo Starting Expo Dev Server for Expo Go
echo ========================================
echo.
echo Scan the QR code with Expo Go app on your phone
echo Make sure your phone and computer are on the same WiFi network
echo.
npx expo start --clear --tunnel --go
