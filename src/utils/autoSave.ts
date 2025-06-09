import { FamilyMember } from '../types';

const AUTO_SAVE_KEY = 'genehive_auto_save';
const AUTO_SAVE_TIMESTAMP_KEY = 'genehive_auto_save_timestamp';
const AUTO_SAVE_INTERVAL = 30000; // 30 seconds

export interface AutoSaveData {
  familyMembers: FamilyMember[];
  timestamp: number;
  version: string;
}

export class AutoSaveManager {
  private saveTimer: NodeJS.Timeout | null = null;
  private lastSaveData: string = '';

  /**
   * Start auto-saving family data
   */
  startAutoSave(getFamilyMembers: () => FamilyMember[]) {
    this.stopAutoSave(); // Clear any existing timer
    
    this.saveTimer = setInterval(() => {
      this.saveData(getFamilyMembers());
    }, AUTO_SAVE_INTERVAL);
  }

  /**
   * Stop auto-saving
   */
  stopAutoSave() {
    if (this.saveTimer) {
      clearInterval(this.saveTimer);
      this.saveTimer = null;
    }
  }

  /**
   * Manually save data
   */
  saveData(familyMembers: FamilyMember[]) {
    try {
      const saveData: AutoSaveData = {
        familyMembers,
        timestamp: Date.now(),
        version: '1.0'
      };

      const dataString = JSON.stringify(saveData);
      
      // Only save if data has changed
      if (dataString !== this.lastSaveData) {
        localStorage.setItem(AUTO_SAVE_KEY, dataString);
        localStorage.setItem(AUTO_SAVE_TIMESTAMP_KEY, saveData.timestamp.toString());
        this.lastSaveData = dataString;
        
        console.log('Auto-saved family data at', new Date(saveData.timestamp).toLocaleTimeString());
      }
    } catch (error) {
      console.error('Failed to auto-save data:', error);
    }
  }

  /**
   * Load saved data
   */
  loadSavedData(): AutoSaveData | null {
    try {
      const savedData = localStorage.getItem(AUTO_SAVE_KEY);
      if (!savedData) return null;

      const parsedData: AutoSaveData = JSON.parse(savedData);
      
      // Validate the data structure
      if (!parsedData.familyMembers || !Array.isArray(parsedData.familyMembers)) {
        console.warn('Invalid auto-save data structure');
        return null;
      }

      return parsedData;
    } catch (error) {
      console.error('Failed to load auto-save data:', error);
      return null;
    }
  }

  /**
   * Check if there's a recent auto-save
   */
  hasRecentSave(maxAgeMinutes: number = 60): boolean {
    try {
      const timestampStr = localStorage.getItem(AUTO_SAVE_TIMESTAMP_KEY);
      if (!timestampStr) return false;

      const timestamp = parseInt(timestampStr);
      const now = Date.now();
      const maxAge = maxAgeMinutes * 60 * 1000; // Convert to milliseconds

      return (now - timestamp) <= maxAge;
    } catch (error) {
      console.error('Failed to check auto-save timestamp:', error);
      return false;
    }
  }

  /**
   * Get the timestamp of the last save
   */
  getLastSaveTime(): Date | null {
    try {
      const timestampStr = localStorage.getItem(AUTO_SAVE_TIMESTAMP_KEY);
      if (!timestampStr) return null;

      return new Date(parseInt(timestampStr));
    } catch (error) {
      console.error('Failed to get last save time:', error);
      return null;
    }
  }

  /**
   * Clear auto-save data
   */
  clearSavedData() {
    try {
      localStorage.removeItem(AUTO_SAVE_KEY);
      localStorage.removeItem(AUTO_SAVE_TIMESTAMP_KEY);
      this.lastSaveData = '';
      console.log('Auto-save data cleared');
    } catch (error) {
      console.error('Failed to clear auto-save data:', error);
    }
  }

  /**
   * Get save data info for display
   */
  getSaveInfo(): { hasData: boolean; lastSave: Date | null; isRecent: boolean } {
    const lastSave = this.getLastSaveTime();
    const hasData = this.loadSavedData() !== null;
    const isRecent = this.hasRecentSave();

    return {
      hasData,
      lastSave,
      isRecent
    };
  }

  /**
   * Compare current data with saved data to detect changes
   */
  hasUnsavedChanges(currentFamilyMembers: FamilyMember[]): boolean {
    const savedData = this.loadSavedData();
    if (!savedData) return currentFamilyMembers.length > 0;

    try {
      const currentDataString = JSON.stringify(currentFamilyMembers);
      const savedDataString = JSON.stringify(savedData.familyMembers);
      return currentDataString !== savedDataString;
    } catch (error) {
      console.error('Failed to compare data for changes:', error);
      return false;
    }
  }
}

// Create a singleton instance
export const autoSaveManager = new AutoSaveManager();

// Utility functions for React components
export const useAutoSave = () => {
  return {
    startAutoSave: (getFamilyMembers: () => FamilyMember[]) => 
      autoSaveManager.startAutoSave(getFamilyMembers),
    stopAutoSave: () => autoSaveManager.stopAutoSave(),
    saveData: (familyMembers: FamilyMember[]) => 
      autoSaveManager.saveData(familyMembers),
    loadSavedData: () => autoSaveManager.loadSavedData(),
    hasRecentSave: (maxAgeMinutes?: number) => 
      autoSaveManager.hasRecentSave(maxAgeMinutes),
    getLastSaveTime: () => autoSaveManager.getLastSaveTime(),
    clearSavedData: () => autoSaveManager.clearSavedData(),
    getSaveInfo: () => autoSaveManager.getSaveInfo(),
    hasUnsavedChanges: (currentFamilyMembers: FamilyMember[]) => 
      autoSaveManager.hasUnsavedChanges(currentFamilyMembers)
  };
};

// Session recovery dialog data
export interface SessionRecoveryInfo {
  hasRecoverableData: boolean;
  lastSaveTime: Date | null;
  memberCount: number;
  isRecent: boolean;
}

export const getSessionRecoveryInfo = (): SessionRecoveryInfo => {
  const savedData = autoSaveManager.loadSavedData();
  const saveInfo = autoSaveManager.getSaveInfo();
  
  return {
    hasRecoverableData: saveInfo.hasData && savedData !== null,
    lastSaveTime: saveInfo.lastSave,
    memberCount: savedData?.familyMembers.length || 0,
    isRecent: saveInfo.isRecent
  };
};