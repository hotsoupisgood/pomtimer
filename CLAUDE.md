# PomTimer - Pomodoro Timer App

## Project Overview
**PomTimer** is a React Native Expo app that provides a full-featured Pomodoro timer without paywalls. The app implements the Pomodoro Technique with customizable work and break durations, audio notifications, and a clean interface.

## Tech Stack
- **Framework**: React Native with Expo SDK 51.0.2
- **Navigation**: React Navigation v6
- **Audio**: expo-av for sound playback
- **Platform**: iOS, Android, and Web support
- **Node**: Uses React 18.2.0 and React Native 0.74.1

## Project Structure
```
pomtimer/
├── App.js                  # Main app component with timer logic
├── app.json               # Expo configuration
├── package.json           # Dependencies and scripts
├── babel.config.js        # Babel configuration
├── assets/
│   ├── tomato.png         # Main timer icon
│   ├── icon.png           # App icon
│   ├── splash.png         # Splash screen
│   ├── adaptive-icon.png  # Android adaptive icon
│   ├── favicon.png        # Web favicon
│   └── sounds/
│       └── chirp.mp3      # Timer completion sound
└── README.md              # Basic project description
```

## Key Features
1. **Customizable Durations**: Work and break periods can be adjusted via input fields
2. **Audio Notifications**: Plays chirp.mp3 when timer completes
3. **Mode Switching**: Automatically alternates between work and break periods
4. **Timer Controls**: Start/Pause and Reset functionality
5. **Visual Feedback**: Shows current time and mode (Work Time/Break Time)

## Development Commands
- `npm start` or `expo start` - Start development server
- `npm run android` - Start on Android
- `npm run ios` - Start on iOS  
- `npm run web` - Start web version

## Code Architecture
- **Single Component App**: All logic contained in App.js PomodoroTimer component
- **State Management**: Uses React hooks (useState, useEffect)
- **Timer Logic**: useEffect with setInterval for countdown
- **Audio Setup**: Configures iOS silent mode compatibility
- **Input Handling**: Numeric inputs with validation for duration settings

## Key Functions
- `toggleIsActive()`: Start/pause timer functionality in App.js:55
- `resetTimer()`: Reset to work mode with work duration in App.js:59
- `playSound()`: Audio notification system in App.js:27
- `formatTime()`: Time display formatting in App.js:65
- `handleDurationChange()`: Input validation for durations in App.js:71

## Dependencies
**Main**: expo, react, react-native, expo-av, react-navigation
**Dev**: @babel/core
**Audio**: expo-av for cross-platform sound
**Navigation**: @react-navigation/native and native-stack

## Styling
- Uses React Native StyleSheet
- Centered layout with flex positioning
- Simple, clean interface with tomato image
- Input fields for duration customization

## Current Status
- Basic Pomodoro functionality implemented
- Cross-platform support (iOS, Android, Web)
- Audio notifications working
- Customizable work/break durations
- Git repository with recent commits

## Testing & Build
- No specific test scripts configured
- Uses standard Expo build process
- Currently no linting or type checking setup

## Known Issues & Improvements
- Single component architecture could benefit from modularization
- No persistent settings (durations reset on app restart)
- Basic styling could be enhanced
- No session tracking or statistics
- Could benefit from notification system for background operation