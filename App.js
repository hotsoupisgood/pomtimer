import React, { useState, useEffect, useRef} from 'react';
import {
  StyleSheet,
  Text,
  View,
  Button,
  TextInput,
  Keyboard,
  TouchableWithoutFeedback,
  Image
} from 'react-native';
import { Audio } from 'expo-av';

const PomodoroTimer = () => {
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState('work');
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [workDuration, setWorkDuration] = useState(25);
  const [breakDuration, setBreakDuration] = useState(5);
  const enableAudio = async () => {
    await Audio.setAudioModeAsync({
    playsInSilentModeIOS: true,
    staysActiveInBackground: false,
    shouldDuckAndroid: false,
  })};

  const playSound = async () => {
    console.log("Loading Sound");
    enableAudio();
    const _sound = new Audio.Sound();
    await _sound.loadAsync(require("./assets/sounds/chirp.mp3"), {shouldPlay: true});
    await _sound.setPositionAsync(0);
    await _sound.playAsync();
  };

  useEffect(() => {
    let interval = null;
    if (isActive && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft(secondsLeft => secondsLeft - 1);
      }, 1000);
    } else if (isActive && secondsLeft === 0) {
      playSound();
      if (mode === 'work') {
        setMode('break');
        setSecondsLeft(breakDuration * 60);
      } else {
        setMode('work');
        setSecondsLeft(workDuration * 60);
      }
    }
    return () => clearInterval(interval);
  }, [isActive, secondsLeft, mode, workDuration, breakDuration]);

  const toggleIsActive = () => {
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false); 
    setMode('work'); 
    setSecondsLeft(workDuration * 60);
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
        <Text style={styles.title}>Pomodoro Timer</Text>
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
