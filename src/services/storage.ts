/**
 * Cloud Storage Service
 * Handle file uploads (avatars, images, etc.)
 */

import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { app } from './firebase';

class StorageService {
  private storage: any;

  constructor() {
    this.storage = getStorage(app);
  }

  /**
   * Upload user avatar
   */
  async uploadAvatar(userId: string, imageUri: string): Promise<string> {
    try {
      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      const storageRef = ref(this.storage, `avatars/${userId}.jpg`);
      await uploadBytes(storageRef, blob);
      
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (error) {
      console.error('Failed to upload avatar:', error);
      throw error;
    }
  }

  /**
   * Upload prompt image
   */
  async uploadPromptImage(promptId: string, imageUri: string): Promise<string> {
    try {
      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      const storageRef = ref(this.storage, `prompts/${promptId}.jpg`);
      await uploadBytes(storageRef, blob);
      
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (error) {
      console.error('Failed to upload prompt image:', error);
      throw error;
    }
  }

  /**
   * Upload event banner
   */
  async uploadEventBanner(eventId: string, imageUri: string): Promise<string> {
    try {
      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      const storageRef = ref(this.storage, `events/${eventId}.jpg`);
      await uploadBytes(storageRef, blob);
      
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (error) {
      console.error('Failed to upload event banner:', error);
      throw error;
    }
  }

  /**
   * Delete file
   */
  async deleteFile(path: string): Promise<void> {
    try {
      const storageRef = ref(this.storage, path);
      await deleteObject(storageRef);
    } catch (error) {
      console.error('Failed to delete file:', error);
      throw error;
    }
  }

  /**
   * Get download URL for existing file
   */
  async getDownloadURL(path: string): Promise<string> {
    try {
      const storageRef = ref(this.storage, path);
      return await getDownloadURL(storageRef);
    } catch (error) {
      console.error('Failed to get download URL:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const storageService = new StorageService();

// Export convenience functions
export const storage = {
  uploadAvatar: (userId: string, imageUri: string) => storageService.uploadAvatar(userId, imageUri),
  uploadPromptImage: (promptId: string, imageUri: string) => storageService.uploadPromptImage(promptId, imageUri),
  uploadEventBanner: (eventId: string, imageUri: string) => storageService.uploadEventBanner(eventId, imageUri),
  deleteFile: (path: string) => storageService.deleteFile(path),
  getDownloadURL: (path: string) => storageService.getDownloadURL(path),
};
