/**
 * Validation utilities for forms and user input
 */

export const validateEmail = (email: string): string | null => {
  if (!email) {
    return 'Email is required';
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Invalid email format';
  }
  
  return null;
};

export const validatePassword = (password: string): string | null => {
  if (!password) {
    return 'Password is required';
  }
  
  if (password.length < 6) {
    return 'Password must be at least 6 characters';
  }
  
  return null;
};

export const validateUsername = (username: string): string | null => {
  if (!username) {
    return 'Username is required';
  }
  
  if (username.length < 3) {
    return 'Username must be at least 3 characters';
  }
  
  if (username.length > 20) {
    return 'Username must be less than 20 characters';
  }
  
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return 'Username can only contain letters, numbers, and underscores';
  }
  
  return null;
};

export const validateRoomName = (name: string): string | null => {
  if (!name) {
    return 'Room name is required';
  }
  
  if (name.length < 2) {
    return 'Room name must be at least 2 characters';
  }
  
  if (name.length > 30) {
    return 'Room name must be less than 30 characters';
  }
  
  return null;
};

export const validatePhrase = (phrase: string): string | null => {
  if (!phrase || !phrase.trim()) {
    return 'Phrase cannot be empty';
  }
  
  if (phrase.length > 200) {
    return 'Phrase must be less than 200 characters';
  }
  
  return null;
};
