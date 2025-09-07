import React, { useState, useEffect, useRef} from 'react';
import {
  StyleSheet,
  Text,
  View,
  Button,
  TextInput,
  Keyboard,
  TouchableWithoutFeedback,
  Image,
  AppState,
  Platform,
  Alert
} from 'react-native';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Safe notification imports - detect simulator vs device
let Notifications = null;
let notificationsAvailable = false;

// Enable notifications for development builds (including simulator)
if (Platform.OS !== 'web') {
  try {
    Notifications = require('expo-notifications');
    notificationsAvailable = true;
    
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true, 
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
    console.log('Notifications enabled for development build');
  } catch (error) {
    console.log('Notification setup failed:', error.message);
    notificationsAvailable = false;
  }
} else {
  console.log('Notifications disabled for web - using alerts only');
}

console.log('Carrot Timer starting - Background timer enabled, notifications:', notificationsAvailable ? 'enabled' : 'disabled');

const PomodoroTimer = () => {
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState('work');
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [workDuration, setWorkDuration] = useState(25);
  const [breakDuration, setBreakDuration] = useState(5);
  const [startTime, setStartTime] = useState(null);
  const [totalDuration, setTotalDuration] = useState(25 * 60);
  const [pendingAlert, setPendingAlert] = useState(null);
  const appState = useRef(AppState.currentState);
  const [soundObject, setSoundObject] = useState(null);
  const enableAudio = async () => {
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: false,
        // Remove problematic interruptionModeIOS for now
        playThroughEarpieceAndroid: false,
      });
      console.log('Audio mode configured successfully');
    } catch (error) {
      console.log('Audio mode setup failed:', error.message);
    }
  };

  // Request notification permissions
  const requestNotificationPermissions = async () => {
    if (!notificationsAvailable) {
      console.log('Notifications not available - using alerts only');
      return;
    }
    
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        console.log('Notification permissions denied');
      } else {
        console.log('Notification permissions granted');
      }
    } catch (error) {
      console.log('Error requesting permissions:', error);
    }
  };

  // Schedule background notification
  const scheduleNotification = async (seconds, message) => {
    if (notificationsAvailable) {
      try {
        await Notifications.cancelAllScheduledNotificationsAsync();
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Carrot Timer',
            body: message,
            sound: 'default',
          },
          trigger: { seconds },
        });
        console.log('Background notification scheduled');
      } catch (error) {
        console.log('Failed to schedule notification:', error);
      }
    } else {
      console.log('Notification fallback:', message, 'in', seconds, 'seconds');
    }
  };

  // Cancel scheduled notifications
  const cancelNotifications = async () => {
    if (notificationsAvailable) {
      try {
        await Notifications.cancelAllScheduledNotificationsAsync();
      } catch (error) {
        console.log('Failed to cancel notifications:', error);
      }
    }
  };

  // Show timer completion alert (fallback)
  const showTimerAlert = (message) => {
    Alert.alert(
      'Carrot Timer',
      message,
      [{ text: 'OK', style: 'default' }],
      { cancelable: true }
    );
  };

  // Load saved timer state
  const loadTimerState = async () => {
    try {
      const savedState = await AsyncStorage.getItem('timerState');
      if (savedState) {
        const parsed = JSON.parse(savedState);
        const { isActive, mode, startTime, totalDuration, workDuration, breakDuration } = parsed;
        
        if (workDuration && breakDuration) {
          setWorkDuration(workDuration);
          setBreakDuration(breakDuration);
        }
        
        if (mode) {
          setMode(mode);
        }
        
        // Calculate current seconds left if timer was running
        if (isActive && startTime && totalDuration) {
          const now = Date.now();
          const elapsed = Math.floor((now - startTime) / 1000);
          const remaining = Math.max(0, totalDuration - elapsed);
          
          if (remaining > 0) {
            setIsActive(true);
            setStartTime(startTime);
            setTotalDuration(totalDuration);
            setSecondsLeft(remaining);
          } else {
            // Timer completed while app was closed
            setIsActive(false);
            setStartTime(null);
            setSecondsLeft(mode === 'work' ? workDuration * 60 : breakDuration * 60);
          }
        } else {
          setSecondsLeft(mode === 'work' ? workDuration * 60 : breakDuration * 60);
        }
      }
    } catch (error) {
      console.log('Error loading timer state:', error);
      // Set defaults on error
      setSecondsLeft(25 * 60);
    }
  };

  // Save timer state
  const saveTimerState = async (state) => {
    try {
      await AsyncStorage.setItem('timerState', JSON.stringify(state));
    } catch (error) {
      console.log('Error saving timer state:', error);
    }
  };

  // Preload sound during app initialization
  const preloadSound = async () => {
    try {
      const sound = new Audio.Sound();
      await sound.loadAsync(require('./assets/sounds/chirp.mp3'));
      setSoundObject(sound);
      console.log('Sound preloaded successfully');
    } catch (error) {
      console.log('Sound preload failed:', error.message);
    }
  };

  const playSound = async () => {
    console.log('Playing sound');
    
    try {
      // Always reactivate audio mode before playing
      await enableAudio();
      
      if (soundObject) {
        // Rewind and play preloaded sound
        await soundObject.setPositionAsync(0);
        await soundObject.playAsync();
        console.log('Sound played successfully');
      } else {
        // Fallback: create and play new sound
        console.log('Fallback: loading sound on demand');
        const sound = new Audio.Sound();
        await sound.loadAsync(require('./assets/sounds/chirp.mp3'));
        await sound.playAsync();
        await sound.unloadAsync();
        console.log('Fallback sound played successfully');
      }
    } catch (error) {
      console.log('Sound playback failed:', error.message);
      // Try alternative approach
      try {
        console.log('Trying alternative sound approach...');
        const { sound } = await Audio.Sound.createAsync(
          require('./assets/sounds/chirp.mp3')
        );
        await sound.playAsync();
        console.log('Alternative sound played successfully');
      } catch (altError) {
        console.log('Alternative sound failed:', altError.message);
      }
    }
  };

  // Show alert when timer completes
  useEffect(() => {
    if (pendingAlert) {
      console.log('Showing alert:', pendingAlert);
      // Small delay to ensure UI is ready
      setTimeout(() => {
        showTimerAlert(pendingAlert);
        setPendingAlert(null);
      }, 100);
    }
  }, [pendingAlert]);

  // Initialize app - load state and setup audio/notifications
  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('Initializing app...');
        await enableAudio();
        await preloadSound();
        await loadTimerState();
        await requestNotificationPermissions();
        console.log('App initialized successfully - background timer ready');
      } catch (error) {
        console.log('Error initializing app:', error);
      }
    };
    
    initializeApp();
  }, []);

  // AppState change handler for background/foreground
  useEffect(() => {
    const handleAppStateChange = async (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App came to foreground - sync timer
        if (isActive && startTime) {
          const now = Date.now();
          const elapsed = Math.floor((now - startTime) / 1000);
          const remaining = Math.max(0, totalDuration - elapsed);
          setSecondsLeft(remaining);
          
          if (remaining === 0) {
            // Timer completed while in background
            await handleTimerComplete();
          }
        }
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [isActive, startTime, totalDuration]);

  // Timer tick effect
  useEffect(() => {
    let interval = null;
    if (isActive && secondsLeft > 0) {
      interval = setInterval(async () => {
        if (startTime) {
          const now = Date.now();
          const elapsed = Math.floor((now - startTime) / 1000);
          const remaining = Math.max(0, totalDuration - elapsed);
          setSecondsLeft(remaining);
          
          if (remaining === 0) {
            await handleTimerComplete();
          }
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, startTime, totalDuration]);

  // Save state whenever it changes
  useEffect(() => {
    const state = {
      isActive,
      mode,
      startTime,
      totalDuration,
      workDuration,
      breakDuration
    };
    saveTimerState(state);
  }, [isActive, mode, startTime, totalDuration, workDuration, breakDuration]);

  const handleTimerComplete = async () => {
    console.log('Timer completed!');
    
    // Play sound immediately (works in background with proper audio setup)
    try {
      await playSound();
    } catch (error) {
      console.log('Audio playback failed:', error);
    }
    
    setIsActive(false);
    
    const message = mode === 'work' 
      ? `Work session complete! Time for a ${breakDuration} minute break.`
      : `Break time over! Ready for a ${workDuration} minute work session?`;
    
    // Show alert for foreground users
    setPendingAlert(message);
    
    if (mode === 'work') {
      setMode('break');
      const newDuration = breakDuration * 60;
      setTotalDuration(newDuration);
      setSecondsLeft(newDuration);
    } else {
      setMode('work');
      const newDuration = workDuration * 60;
      setTotalDuration(newDuration);
      setSecondsLeft(newDuration);
    }
    
    setStartTime(null);
    await cancelNotifications();
    console.log('Timer completed:', message);
  };

  const toggleIsActive = async () => {
    if (!isActive) {
      // Starting timer
      const now = Date.now();
      const duration = mode === 'work' ? workDuration * 60 : breakDuration * 60;
      
      setIsActive(true);
      setStartTime(now);
      setTotalDuration(duration);
      setSecondsLeft(duration);
      
      // Schedule notification for completion
      const message = mode === 'work' 
        ? `Work session complete! Time for a ${breakDuration} minute break.`
        : `Break time over! Ready for a ${workDuration} minute work session?`;
      
      await scheduleNotification(duration, message);
      console.log(`Timer started: ${mode} session for ${duration/60} minutes`);
    } else {
      // Pausing timer
      setIsActive(false);
      setStartTime(null);
      await cancelNotifications();
      console.log('Timer paused');
    }
  };

  const resetTimer = async () => {
    setIsActive(false);
    setMode('work');
    const duration = workDuration * 60;
    setSecondsLeft(duration);
    setTotalDuration(duration);
    setStartTime(null);
    await cancelNotifications();
    console.log('Timer reset');
  };

  const formatTime = () => {
    const minutes = Math.floor(secondsLeft / 60);
    const seconds = secondsLeft % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const handleDurationChange = (setter, value) => {
    const num = parseInt(value);
    if (!isNaN(num) && num >= 0) {
        setter(num);
    } else if (value === '') {
        setter(0);  // Temporarily set to 0 internally but don't update the timer until a valid number is entered
    }
  };

  const handleChangeComplete = (setter, value) => {
    if (value === '') {
        setter(25);  // Assuming 25 as a default value for both work and break if field is empty
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.container}>
        <Image source={require('./assets/tomato.png')} style={styles.tomatoImage} />
        <Text style={styles.title}>Carrot Timer</Text>
        <Text style={styles.time}>{formatTime()}</Text>
        <Text style={styles.mode}>{mode === 'work' ? 'Work Time' : 'Break Time'}</Text>
        <TextInput
            style={styles.input}
            value={workDuration.toString()}
            onChangeText={(text) => handleDurationChange(setWorkDuration, text)}
            onEndEditing={() => handleChangeComplete(setWorkDuration, workDuration.toString())}
            keyboardType="numeric"
            placeholder="Work Duration (min)"
        />
        <TextInput
            style={styles.input}
            value={breakDuration.toString()}
            onChangeText={(text) => handleDurationChange(setBreakDuration, text)}
            onEndEditing={() => handleChangeComplete(setBreakDuration, breakDuration.toString())}
            keyboardType="numeric"
            placeholder="Break Duration (min)"
        />
        <Button onPress={toggleIsActive} title={isActive ? 'Pause' : 'Start'} />
        <Button onPress={resetTimer} title="Reset" />
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 32,
    marginBottom: 10,
  },
  time: {
    fontSize: 48,
    marginBottom: 20,
  },
  mode: {
    fontSize: 24,
    marginBottom: 20,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    width: 100,
    textAlign: 'center',
    marginBottom: 20,
  },
  tomatoImage: {
    width: 100,
    height: 100,
    marginBottom: 20,
  },
});

export default PomodoroTimer;
