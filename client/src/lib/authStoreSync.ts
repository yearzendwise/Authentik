import { authManager, addAuthStateListener, removeAuthStateListener } from "./auth";
import { setAccessToken, clearAuth } from "../store/authSlice";

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
    if (!store) {
      console.warn("🔄 Auth store sync attempted but no store available");
      return;
    }
    
    try {
      if (token) {
        // Token was set - update Redux store
        console.log("🔄 Syncing token to Redux store");
        store.dispatch(setAccessToken(token));
      } else {
        // Token was cleared - clear Redux store
        console.log("🔄 Clearing Redux store authentication state");
        store.dispatch(clearAuth());
      }
    } catch (error) {
      console.error("Failed to sync auth state to Redux store:", error);
      // Don't rethrow to prevent breaking the auth system
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