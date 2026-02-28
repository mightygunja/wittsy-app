# Auto-Leave & Rejoin Room Implementation

## ✅ Feature Implemented

Users will now **automatically leave game rooms** when they close the app or switch away, and can **rejoin the same room** if it's still active when they return.

---

## 🎯 How It Works

### **When User Closes/Backgrounds App:**
1. App detects state change (active → background/inactive)
2. Automatically calls `leaveRoom()` for current room
3. Saves room info to AsyncStorage as "last room"
4. User is removed from room's player list
5. Room continues for remaining players (if 3+ players remain)

### **When User Reopens App:**
1. App checks for "last room" in AsyncStorage
2. If room was joined within last 10 minutes → Show rejoin prompt
3. User can choose to rejoin or dismiss
4. If rejoined → Navigate to GameRoomScreen
5. If dismissed → Clear last room data

---

## 📁 Files Created

### **1. Room Persistence Service** (`src/services/roomPersistence.ts`)

Handles tracking and persistence of room sessions:

**Functions:**
- `saveCurrentRoom(roomId, userId, roomName)` - Save active room
- `getCurrentRoom()` - Get current room session
- `clearCurrentRoom()` - Clear when user leaves normally
- `getLastRoom()` - Get last room for rejoin
- `clearLastRoom()` - Clear last room data
- `autoLeaveCurrentRoom()` - Auto-leave on app close
- `shouldPromptRejoin(userId)` - Check if rejoin prompt should show

**Storage Keys:**
- `@wittsy:currentRoom` - Active room session
- `@wittsy:lastRoom` - Last room for rejoin (10 min expiry)

### **2. Rejoin Room Prompt** (`src/components/game/RejoinRoomPrompt.tsx`)

Beautiful modal component showing rejoin option:

**Features:**
- Blur background
- Gradient card design
- Shows room name
- "Rejoin Room" and "No Thanks" buttons
- Haptic feedback
- Smooth animations

---

## 🔧 Files Modified

### **1. App.tsx**

Added AppState listener to detect app backgrounding:

```typescript
// Detects when app goes to background
const handleAppStateChange = async (nextAppState: AppStateStatus) => {
  if (
    appState.current.match(/active/) &&
    nextAppState.match(/inactive|background/)
  ) {
    // Auto-leave current room
    await autoLeaveCurrentRoom();
  }
  appState.current = nextAppState;
};
```

**When triggered:**
- User presses home button
- User switches to another app
- User locks phone
- App is force-closed

### **2. GameRoomScreen.tsx**

Added room persistence tracking:

**On Mount:**
```typescript
useEffect(() => {
  if (user?.uid && room?.name) {
    saveCurrentRoom(roomId, user.uid, room.name);
  }
  
  return () => {
    // Auto-leave on unmount
    if (user?.uid) {
      leaveRoom(roomId, user.uid);
      clearCurrentRoom();
    }
  };
}, [roomId, user?.uid, room?.name]);
```

**On Manual Leave:**
```typescript
const handleLeaveRoom = async () => {
  // ... existing leave logic ...
  await clearCurrentRoom(); // Clear persistence
  navigation.goBack();
};
```

---

## 🎮 User Experience Flow

### **Scenario 1: App Closed During Game**

1. User is in game room playing
2. User closes app (home button, task switcher, etc.)
3. **App detects background state**
4. **Auto-leave triggered** → User removed from room
5. Room info saved to "last room"
6. Other players continue if 3+ remain

### **Scenario 2: User Returns Within 10 Minutes**

1. User reopens app
2. App checks for last room
3. **Rejoin prompt appears:**
   ```
   🚪 Rejoin Game?
   You were in "Epic Game Room"
   The room is still active. Would you like to rejoin?
   
   [No Thanks]  [Rejoin Room 🎮]
   ```
4. If "Rejoin" → Navigate to GameRoomScreen
5. If "No Thanks" → Clear last room, go to home

### **Scenario 3: User Returns After 10+ Minutes**

1. User reopens app
2. Last room expired (> 10 minutes old)
3. No rejoin prompt shown
4. Last room data cleared automatically
5. User goes to home screen

### **Scenario 4: User Manually Leaves Room**

1. User taps "Leave Room" button
2. Normal leave process
3. Current room cleared
4. Saved to last room (for potential rejoin)
5. Navigate back to home

---

## ⚙️ Configuration

### **Rejoin Time Window**

Currently set to **10 minutes**. Modify in `roomPersistence.ts`:

```typescript
const tenMinutes = 10 * 60 * 1000; // Change this value
```

### **Room Validation**

Before showing rejoin prompt, you can add additional checks:
- Room still exists in Firestore
- Room has available slots
- Room status is 'waiting' or 'active'
- User is not banned from room

---

## 🧪 Testing Checklist

### **Auto-Leave:**
- [ ] Close app during game → User removed from room
- [ ] Switch to another app → User removed from room
- [ ] Lock phone during game → User removed from room
- [ ] Force close app → User removed from room
- [ ] Navigate away from GameRoomScreen → User removed from room

### **Rejoin:**
- [ ] Reopen app within 10 min → Rejoin prompt shows
- [ ] Tap "Rejoin" → Navigate to game room
- [ ] Tap "No Thanks" → Prompt dismisses, go to home
- [ ] Reopen after 10+ min → No prompt, go to home
- [ ] Rejoin when room is full → Handle gracefully
- [ ] Rejoin when room finished → Handle gracefully

### **Edge Cases:**
- [ ] User in multiple rooms (shouldn't happen, but test)
- [ ] Room deleted while user away → No crash
- [ ] Network offline when auto-leaving → Graceful handling
- [ ] User logs out while in room → Room cleared
- [ ] Different user logs in → No rejoin prompt for previous user

---

## 🔒 Security Considerations

### **Data Stored in AsyncStorage:**
- Room ID
- User ID
- Join timestamp
- Room name (optional)

**No sensitive data stored** - all game state remains in Firestore.

### **Validation:**
- User ID must match before showing rejoin prompt
- Time window prevents stale rejoin attempts
- Room existence should be verified before rejoining (optional enhancement)

---

## 📊 Analytics Events (Optional)

Consider tracking these events:

```typescript
analytics.logEvent('room_auto_left', {
  roomId,
  reason: 'app_background',
  duration: sessionDuration,
});

analytics.logEvent('room_rejoin_prompted', {
  roomId,
  timeSinceLeft: timeElapsed,
});

analytics.logEvent('room_rejoined', {
  roomId,
  success: true,
});
```

---

## 🚀 Future Enhancements

### **1. Reconnection Grace Period**
- Don't remove user immediately
- Give 30 seconds to reconnect
- Mark as "disconnected" instead of leaving
- Auto-remove after grace period

### **2. Room Validation Before Rejoin**
```typescript
// Check if room still exists and has space
const room = await getDoc(doc(firestore, 'rooms', roomId));
if (!room.exists() || room.data().status === 'finished') {
  return null; // Don't show rejoin prompt
}
```

### **3. Multiple Room History**
- Track last 5 rooms instead of just 1
- Let user choose which to rejoin
- Show room status (active, finished, etc.)

### **4. Push Notification**
- Notify user if room is about to start
- "Your game is starting! Tap to rejoin"

### **5. Background Mode**
- Keep user in room even when backgrounded
- Show notification when it's their turn
- Only leave after extended inactivity

---

## 🐛 Known Limitations

1. **No server-side validation** - Room existence not checked before showing prompt
2. **10-minute window is fixed** - Not configurable per user
3. **Single room tracking** - Can't track multiple rooms
4. **No reconnection grace period** - User removed immediately

These can be addressed in future iterations.

---

## 💡 Implementation Notes

### **Why Auto-Leave?**
- Prevents "ghost players" in rooms
- Keeps player counts accurate
- Allows games to continue with active players
- Improves matchmaking accuracy

### **Why 10-Minute Window?**
- Long enough for quick app switches
- Short enough to avoid stale rooms
- Balances UX with data freshness

### **Why AsyncStorage?**
- Persists across app restarts
- Fast read/write
- No network required
- Simple key-value storage

---

## ✅ Summary

Your app now handles app closure gracefully:

- ✅ **Auto-leave** when app closes/backgrounds
- ✅ **Room persistence** with AsyncStorage
- ✅ **Rejoin prompt** for returning users
- ✅ **10-minute time window** for rejoin
- ✅ **Beautiful UI** for rejoin prompt
- ✅ **Proper cleanup** on manual leave

Users can now **seamlessly return to their games** after brief interruptions, while preventing ghost players from blocking game progress!
