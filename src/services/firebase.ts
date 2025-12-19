// React Native Firebase - Native modules for full Firebase support
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

// Note: Firebase config is handled by GoogleService-Info.plist (iOS) and google-services.json (Android)
// No need for manual initialization with React Native Firebase

// Export Firebase services - now synchronous!
export const getAuth = () => auth();
export { firestore };

// TODO: Add these when needed
// import database from '@react-native-firebase/database';
// import storage from '@react-native-firebase/storage';
// export const realtimeDb = database();
// export const storage = storage();
