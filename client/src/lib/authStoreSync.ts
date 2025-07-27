import { authManager, addAuthStateListener, removeAuthStateListener } from "./auth";

// This module handles synchronization between the auth manager and Redux store
// It's imported by the Redux store to listen for auth state changes

let store: any = null;
let authListener: ((token: string | null) => void) | null = null;

export const initializeAuthStoreSync = (reduxStore: any) => {
  store = reduxStore;
  
  // Remove existing listener if any
  if (authListener) {
    removeAuthStateListener(authListener);
  }
  
  // Create new listener
  authListener = (token: string | null) => {
    if (!store) return;
    
    try {
      if (token) {
        // Token was set - update Redux store
        const { setAccessToken } = require("../store/authSlice");
        console.log("🔄 Syncing token to Redux store");
        store.dispatch(setAccessToken(token));
      } else {
        // Token was cleared - clear Redux store
        const { clearAuth } = require("../store/authSlice");
        console.log("🔄 Clearing Redux store authentication state");
        store.dispatch(clearAuth());
      }
    } catch (error) {
      console.error("Failed to sync auth state to Redux store:", error);
    }
  };
  
  // Add the listener
  addAuthStateListener(authListener);
  
  console.log("🔄 Auth store sync initialized");
};

export const cleanupAuthStoreSync = () => {
  if (authListener) {
    removeAuthStateListener(authListener);
    authListener = null;
  }
  store = null;
  console.log("🔄 Auth store sync cleaned up");
}; 