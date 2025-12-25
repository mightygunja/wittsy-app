/**
 * Audio Service
 * Manages background music and sound effects
 */

import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';

class AudioService {
  private backgroundMusic: Audio.Sound | null = null;
  private soundEffects: Map<string, Audio.Sound> = new Map();
  private isMusicEnabled: boolean = true;
  private areSFXEnabled: boolean = true;
  private musicVolume: number = 0.5;
  private sfxVolume: number = 0.7;
  private isInitialized: boolean = false;

  async initialize() {
    if (this.isInitialized) return;

    try {
      // Set audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
      });

      // Load settings from storage
      await this.loadSettings();

      // Preload sound effects
      await this.preloadSoundEffects();

      this.isInitialized = true;
      console.log('Audio service initialized');
    } catch (error) {
      console.error('Failed to initialize audio service:', error);
    }
  }

  private async loadSettings() {
    try {
      const settings = await AsyncStorage.getItem('audioSettings');
      if (settings) {
        const parsed = JSON.parse(settings);
        this.isMusicEnabled = parsed.enableMusic ?? true;
        this.areSFXEnabled = parsed.enableSFX ?? true;
        this.musicVolume = parsed.musicVolume ?? 0.5;
        this.sfxVolume = parsed.sfxVolume ?? 0.7;
      }
    } catch (error) {
      console.error('Failed to load audio settings:', error);
    }
  }

  private async preloadSoundEffects() {
    // Note: These are placeholder files - will fail gracefully if files are empty
    try {
      const effects = {
        click: require('../../assets/audio/click.mp3'),
        success: require('../../assets/audio/success.mp3'),
        error: require('../../assets/audio/error.mp3'),
        notification: require('../../assets/audio/notification.mp3'),
        vote: require('../../assets/audio/vote.mp3'),
        win: require('../../assets/audio/win.mp3'),
        star: require('../../assets/audio/star.mp3'),
      };

      for (const [name, source] of Object.entries(effects)) {
        try {
          const { sound } = await Audio.Sound.createAsync(source, {
            volume: this.sfxVolume,
          });
          this.soundEffects.set(name, sound);
        } catch (error) {
          // Silently fail for empty placeholder files
          console.log(`Sound effect '${name}' not loaded (add real audio file)`);
        }
      }
    } catch (error) {
      console.log('Sound effects not loaded (add real audio files)');
    }
  }

  async playBackgroundMusic() {
    if (!this.isMusicEnabled) return;

    try {
      // Stop existing music if playing
      if (this.backgroundMusic) {
        await this.backgroundMusic.stopAsync();
        await this.backgroundMusic.unloadAsync();
      }

      // Try to load and play background music
      try {
        const { sound } = await Audio.Sound.createAsync(
          require('../../assets/audio/background-music.mp3'),
          {
            isLooping: true,
            volume: this.musicVolume,
          }
        );

        this.backgroundMusic = sound;
        await sound.playAsync();
        console.log('Background music started');
      } catch (error) {
        // Fail gracefully if audio file is empty/missing
        console.log('Background music not loaded (add real audio file)');
      }
    } catch (error) {
      console.error('Failed to play background music:', error);
    }
  }

  async stopBackgroundMusic() {
    if (this.backgroundMusic) {
      try {
        await this.backgroundMusic.stopAsync();
        await this.backgroundMusic.unloadAsync();
        this.backgroundMusic = null;
        console.log('Background music stopped');
      } catch (error) {
        console.error('Failed to stop background music:', error);
      }
    }
  }

  async pauseBackgroundMusic() {
    if (this.backgroundMusic) {
      try {
        await this.backgroundMusic.pauseAsync();
      } catch (error) {
        console.error('Failed to pause background music:', error);
      }
    }
  }

  async resumeBackgroundMusic() {
    if (this.backgroundMusic && this.isMusicEnabled) {
      try {
        await this.backgroundMusic.playAsync();
      } catch (error) {
        console.error('Failed to resume background music:', error);
      }
    }
  }

  async playSoundEffect(effectName: string) {
    if (!this.areSFXEnabled) return;

    const sound = this.soundEffects.get(effectName);
    if (sound) {
      try {
        await sound.replayAsync();
      } catch (error) {
        console.error(`Failed to play sound effect: ${effectName}`, error);
      }
    }
  }

  // Convenience methods for common sound effects
  playClick() {
    this.playSoundEffect('click');
  }

  playSuccess() {
    this.playSoundEffect('success');
  }

  playError() {
    this.playSoundEffect('error');
  }

  playNotification() {
    this.playSoundEffect('notification');
  }

  playVote() {
    this.playSoundEffect('vote');
  }

  playWin() {
    this.playSoundEffect('win');
  }

  playStar() {
    this.playSoundEffect('star');
  }

  async setMusicEnabled(enabled: boolean) {
    this.isMusicEnabled = enabled;
    await this.saveSettings();

    if (enabled) {
      await this.playBackgroundMusic();
    } else {
      await this.stopBackgroundMusic();
    }
  }

  async setSFXEnabled(enabled: boolean) {
    this.areSFXEnabled = enabled;
    await this.saveSettings();
  }

  async setMusicVolume(volume: number) {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    await this.saveSettings();

    if (this.backgroundMusic) {
      try {
        await this.backgroundMusic.setVolumeAsync(this.musicVolume);
      } catch (error) {
        console.error('Failed to set music volume:', error);
      }
    }
  }

  async setSFXVolume(volume: number) {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
    await this.saveSettings();

    // Update all sound effects volume
    for (const sound of this.soundEffects.values()) {
      try {
        await sound.setVolumeAsync(this.sfxVolume);
      } catch (error) {
        console.error('Failed to set SFX volume:', error);
      }
    }
  }

  private async saveSettings() {
    try {
      const settings = {
        enableMusic: this.isMusicEnabled,
        enableSFX: this.areSFXEnabled,
        musicVolume: this.musicVolume,
        sfxVolume: this.sfxVolume,
      };
      await AsyncStorage.setItem('audioSettings', JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save audio settings:', error);
    }
  }

  async cleanup() {
    await this.stopBackgroundMusic();

    for (const sound of this.soundEffects.values()) {
      try {
        await sound.unloadAsync();
      } catch (error) {
        console.error('Failed to unload sound effect:', error);
      }
    }

    this.soundEffects.clear();
    this.isInitialized = false;
  }

  // Getters
  getMusicEnabled() {
    return this.isMusicEnabled;
  }

  getSFXEnabled() {
    return this.areSFXEnabled;
  }

  getMusicVolume() {
    return this.musicVolume;
  }

  getSFXVolume() {
    return this.sfxVolume;
  }
}

export const audioService = new AudioService();
