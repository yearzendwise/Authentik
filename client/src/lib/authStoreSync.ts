import { authManager, addAuthStateListener, removeAuthStateListener } from "./auth";
import { setAccessToken, clearAuth } from "../store/authSlice";

// This module handles synchronization between the auth manager and Redux store
// It's imported by the Redux store to listen for auth state changes

let store: any = null;
let authListener: ((token: string | null) => void) | null = null;
let isUpdatingFromRedux = false;

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
    
    // Prevent circular updates - don't dispatch if we're already updating from Redux
    if (isUpdatingFromRedux) {
      return;
    }
    
    // Use setTimeout to defer the dispatch to the next tick
    // This prevents the "cannot call getState while reducer is executing" error
    setTimeout(() => {
      try {
        const currentState = store.getState();
        const currentToken = currentState.auth?.accessToken;
        
        // Only update if the token actually changed
        if (token !== currentToken) {
          if (token) {
            // Token was set - update Redux store
            console.log("🔄 Syncing token to Redux store");
            store.dispatch(setAccessToken(token));
          } else {
            // Token was cleared - clear Redux store
            console.log("🔄 Clearing Redux store authentication state");
            store.dispatch(clearAuth());
          }
        }
      } catch (error) {
        console.error("Failed to sync auth state to Redux store:", error);
        // Don't rethrow to prevent breaking the auth system
      }
    }, 0);
  };
  
  // Add the listener
  addAuthStateListener(authListener);
  
  console.log("🔄 Auth store sync initialized");
};

// Export a function to set the update flag
export const setUpdatingFromRedux = (value: boolean) => {
  isUpdatingFromRedux = value;
};

export const cleanupAuthStoreSync = () => {
  if (authListener) {
    removeAuthStateListener(authListener);
    authListener = null;
  }
  store = null;
  console.log("🔄 Auth store sync cleaned up");
}; 