# Carrot Timer Development Log

## Major Changes Made to Enable Background Functionality

### 1. Fixed iOS Simulator Compatibility
**Problem**: iOS 18.5 SDK requirement  
**Solution**: Installed iOS 18.6 simulator
```bash
# Command used:
xcrun simctl list
# Then installed new iOS 18.6 simulator via Xcode
```

### 2. Fixed Expo Dev Menu Compilation Error
**Problem**: `TARGET_IPHONE_SIMULATOR` undefined in newer iOS SDKs  
**File**: `node_modules/expo-dev-menu/ios/DevMenuViewController.swift:66`  
**Change**:
```swift
// OLD:
let isSimulator = TARGET_IPHONE_SIMULATOR > 0

// NEW:
let isSimulator = ProcessInfo.processInfo.environment["SIMULATOR_DEVICE_NAME"] != nil
```

### 3. Fixed App Entry Point & Registration
**Problem**: Missing proper app registration causing "main not registered" error  
**Solution**: Created proper entry point

**Created**: `index.js`
```javascript
import { registerRootComponent } from 'expo';
import App from './App';
registerRootComponent(App);
```

**Updated**: `package.json`
```json
"main": "index.js"  // Changed from "expo/AppEntry.js"
```

### 4. Fixed ExpoFontLoader Module
**Problem**: Missing expo-font module  
**Solution**: Installed compatible version
```bash
npm install expo-font@12.0.10  # Version compatible with Expo SDK 51
npx pod-install ios
```

### 5. Fixed App Transport Security
**Problem**: Metro bundler connection blocked  
**File**: `ios/TimerApp/Info.plist`
**Added**:
```xml
<key>NSAppTransportSecurity</key>
<dict>
  <key>NSAllowsArbitraryLoads</key>
  <true/>
  <key>NSExceptionDomains</key>
  <dict>
    <key>localhost</key>
    <dict>
      <key>NSExceptionAllowsInsecureHTTPLoads</key>
      <true/>
    </dict>
    <!-- Added 127.0.0.1 and Metro IP exceptions -->
  </dict>
</dict>
```

### 6. Implemented Background Timer Logic
**File**: `App.js`  
**Key Changes**:

**Timestamp-based Timer** (replaces setInterval):
```javascript
// Core state for background operation
const [startTime, setStartTime] = useState(null);
const [totalDuration, setTotalDuration] = useState(25 * 60);

// Background-aware timer calculation
const now = Date.now();
const elapsed = Math.floor((now - startTime) / 1000);
const remaining = Math.max(0, totalDuration - elapsed);
```

**AppState Monitoring**:
```javascript
useEffect(() => {
  const handleAppStateChange = async (nextAppState) => {
    if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
      // Sync timer when returning to foreground
      if (isActive && startTime) {
        const remaining = calculateTimeRemaining();
        if (remaining === 0) {
          await handleTimerComplete();
        }
      }
    }
  };
  const subscription = AppState.addEventListener('change', handleAppStateChange);
  return () => subscription?.remove();
}, [isActive, startTime, totalDuration]);
```

### 7. Background Audio Configuration
**Audio Session Setup**:
```javascript
const enableAudio = async () => {
  await Audio.setAudioModeAsync({
    playsInSilentModeIOS: true,
    staysActiveInBackground: true,
    shouldDuckAndroid: false,
  });
};

// Preload sound for instant playback
const preloadSound = async () => {
  const sound = new Audio.Sound();
  await sound.loadAsync(require('./assets/sounds/chirp.mp3'));
  setSoundObject(sound);
};
```

### 8. Local Notifications System
**Conditional Loading** (avoids simulator crashes):
```javascript
// Enable notifications for development builds
if (Platform.OS !== 'web') {
  try {
    Notifications = require('expo-notifications');
    notificationsAvailable = true;
    
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true, 
        shouldPlaySound: true,
      }),
    });
  } catch (error) {
    console.log('Notification setup failed:', error.message);
  }
}
```

**Scheduling**:
```javascript
const scheduleNotification = async (seconds, message) => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Carrot Timer',
      body: message,
    },
    trigger: { seconds },
  });
};
```

### 9. Persistent Storage
**Timer State Persistence**:
```javascript
// Save state on changes
const saveTimerState = async (state) => {
  await AsyncStorage.setItem('timerState', JSON.stringify({
    isActive, mode, startTime, totalDuration, workDuration, breakDuration
  }));
};

// Load state on app startup
const loadTimerState = async () => {
  const savedState = await AsyncStorage.getItem('timerState');
  if (savedState) {
    const parsed = JSON.parse(savedState);
    // Restore state and calculate current time remaining
  }
};
```

### 10. Rebranded to Carrot Timer
**Problem**: App Store trademark issues with "Pomodoro"  
**Files Updated**:
- `App.js`: Title, notifications, alerts → "Carrot Timer"
- `app.json`: name → "Carrot Timer", slug → "CarrotTimer"  
- `package.json`: name → "carrot-timer"

## Build Commands Used
```bash
# Essential commands for development build
npm install
npx pod-install ios
EXPO_IOS_SIMULATOR_DEVICE_NAME="iPhone 15" npx expo run:ios

# For clean rebuilds
cd ios && rm -rf build && cd ..
```

## Key Dependencies Added
```json
{
  "expo-font": "^12.0.10",
  "expo-notifications": "~0.28.19",
  "expo-av": "~14.0.7", 
  "expo-dev-client": "~4.0.29",
  "@react-native-async-storage/async-storage": "1.23.1"
}
```

This log covers the major structural changes. The app now runs as a native development build with full background timer, audio, and notification functionality.