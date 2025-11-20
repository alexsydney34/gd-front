import { DUCK_NAME_MAP, DUCK_IMAGE_MAP, DEFAULT_DUCK_IMAGE, DEFAULT_DUCK_NAME } from './constants';
import { DuckFromAPI } from '../../types';

// Normalize duck key: remove spaces, lowercase
export const normalizeDuckKey = (key: string): string => {
  return key.toLowerCase().replace(/\s+/g, '');
};

// Get translation key for duck name
export const getDuckNameKey = (key: string): string => {
  const normalized = normalizeDuckKey(key);
  return DUCK_NAME_MAP[normalized] || DEFAULT_DUCK_NAME;
};

// Get image path for duck
export const getDuckImage = (key: string, customImage?: string): string => {
  if (customImage) return customImage;
  
  const normalized = normalizeDuckKey(key).replace('duck', '');
  return DUCK_IMAGE_MAP[normalized] || DEFAULT_DUCK_IMAGE;
};

// Format seconds to HH:MM:SS
export const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

// Check if duck can be played
export const canPlayDuck = (duck: DuckFromAPI): boolean => {
  // Duck must be opened and not on cooldown
  if (!duck.opened || duck.seconds_to_play > 0) {
    return false;
  }
  
  // If duck has no lives and all days are used up (e.g., 30/30), it's dead
  if (duck.lives === 0 && duck.curent_from && duck.curent_from.curent >= duck.curent_from.from) {
    return false;
  }
  
  return true;
};

// Check if duck is on cooldown
export const isDuckOnCooldown = (duck: DuckFromAPI): boolean => {
  return duck.opened && duck.seconds_to_play > 0;
};

