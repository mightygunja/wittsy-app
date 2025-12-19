# Wittsy - Real-Time Witty Phrase Battle Game

A modern, cross-platform mobile and web game built with React Native and Firebase.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd wittsy-app
npm install
```

### 2. Set Up Firebase

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Copy `.env.example` to `.env`
3. Fill in your Firebase credentials in `.env`

```bash
cp .env.example .env
# Edit .env with your Firebase config
```

### 3. Run the App

```bash
# Start development server
npm start

# Run on iOS (Mac only)
npm run ios

# Run on Android
npm run android

# Run on Web
npm run web
```

## 📁 Project Structure

```
wittsy-app/
├── src/
│   ├── components/     # Reusable UI components
│   ├── screens/        # Main app screens
│   ├── services/       # Firebase & API services
│   ├── hooks/          # Custom React hooks
│   ├── utils/          # Helper functions
│   ├── context/        # React Context providers
│   ├── types/          # TypeScript definitions
│   └── assets/         # Images, sounds, fonts
├── App.tsx            # Root component
├── package.json       # Dependencies
└── tsconfig.json      # TypeScript config
```

## 🎮 Features

- Real-time multiplayer gameplay
- Anonymous voting system
- Global and regional leaderboards
- Customizable avatars
- Achievement system
- Friend system
- Chat and emotes
- Cross-platform (iOS, Android, Web)

## 🛠️ Tech Stack

- **React Native** - Cross-platform mobile framework
- **Expo** - Development platform
- **TypeScript** - Type safety
- **Firebase** - Backend services
  - Authentication
  - Firestore Database
  - Realtime Database
  - Cloud Functions
  - Cloud Storage
  - Analytics
- **React Navigation** - Navigation
- **Redux Toolkit** - State management

## 📖 Documentation

See [SETUP_GUIDE.md](../SETUP_GUIDE.md) for detailed setup instructions.

See [WITTSY_FEATURE_SPEC.md](../WITTSY_FEATURE_SPEC.md) for complete feature specifications.

## 🧪 Testing

```bash
# Run tests
npm test

# Type check
npm run tsc

# Lint code
npm run lint
```

## 📝 Development Workflow

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes
3. Run tests and type check
4. Commit: `git commit -m "Add your feature"`
5. Push: `git push origin feature/your-feature`

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is private and proprietary.

## 🙏 Support

For issues or questions, please refer to the documentation or create an issue.

---

**Happy coding! Let's build something amazing! 🚀**
