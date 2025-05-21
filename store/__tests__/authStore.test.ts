import { useAuthStore } from '../authStore';
import { useTrackingStore } from '../trackingStore';
import { useListStore } from '../listStore';
import * as SecureStore from 'expo-secure-store';
import { login as loginApi } from '../../api/auth'; // Path to api/auth

// Mocking external dependencies
jest.mock('expo-secure-store');
jest.mock('../../api/auth', () => ({
  login: jest.fn(),
}));

jest.mock('../trackingStore', () => ({
  useTrackingStore: {
    getState: jest.fn(() => ({
      fetchTrackedBooks: jest.fn().mockResolvedValue(undefined),
      clearTrackedBooks: jest.fn(),
    })),
  },
}));

jest.mock('../listStore', () => ({
  useListStore: {
    getState: jest.fn(() => ({
      fetchUserLists: jest.fn().mockResolvedValue(undefined),
      clearLists: jest.fn(),
    })),
  },
}));

// Helper to get initial state for reset
const getInitialAuthState = () => useAuthStore.getState();
let initialAuthState: ReturnType<typeof getInitialAuthState>;


describe('useAuthStore', () => {
  beforeEach(() => {
    // Capture initial state before store is potentially modified by a test
    // This is a simplified way to get a snapshot of the initial state structure
    // More robust solutions might involve exporting initial state from the store definition itself
    if (!initialAuthState) {
        initialAuthState = { ...useAuthStore.getState() };
    }
    // Reset the store to its initial state before each test
    useAuthStore.setState(initialAuthState, true); 
    jest.clearAllMocks(); // Clear all mock function calls
  });

  describe('login action', () => {
    it('should update state correctly on successful login', async () => {
      const mockLoginResponse = {
        access_token: 'fake_access_token',
        refresh_token: 'fake_refresh_token',
        message: 'Login successful',
      };
      (loginApi as jest.Mock).mockResolvedValue(mockLoginResponse);
      (SecureStore.setItemAsync as jest.Mock).mockResolvedValue(undefined);

      await useAuthStore.getState().login('test@example.com', 'password');

      const state = useAuthStore.getState();
      expect(state.token).toBe(mockLoginResponse.access_token);
      expect(state.refreshToken).toBe(mockLoginResponse.refresh_token);
      expect(state.isAuthenticated).toBe(true);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('USER_AUTH_TOKEN', mockLoginResponse.access_token);
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('USER_REFRESH_TOKEN', mockLoginResponse.refresh_token);
      expect(useTrackingStore.getState().fetchTrackedBooks).toHaveBeenCalled();
      expect(useListStore.getState().fetchUserLists).toHaveBeenCalled();
    });

    it('should set error state on failed login (API error)', async () => {
      const apiErrorMessage = 'Invalid credentials';
      (loginApi as jest.Mock).mockRejectedValue(new Error(apiErrorMessage));

      try {
        await useAuthStore.getState().login('test@example.com', 'wrong_password');
      } catch (e: any) {
        // error is expected
        expect(e.message).toBe(apiErrorMessage);
      }

      const state = useAuthStore.getState();
      expect(state.token).toBeNull();
      expect(state.refreshToken).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe(apiErrorMessage);
    });

    it('should set error state if login response has no tokens', async () => {
      const mockLoginResponseNoTokens = { message: 'Login failed: No tokens' };
      (loginApi as jest.Mock).mockResolvedValue(mockLoginResponseNoTokens);

      try {
        await useAuthStore.getState().login('test@example.com', 'password');
      } catch (e: any) {
         // error is expected
         expect(e.message).toBe(mockLoginResponseNoTokens.message);
      }
      
      const state = useAuthStore.getState();
      expect(state.token).toBeNull();
      expect(state.refreshToken).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe(mockLoginResponseNoTokens.message);
    });
  });

  describe('logout action', () => {
    it('should clear auth state and call dependent clear actions', async () => {
      // Setup initial logged-in state for logout testing
      useAuthStore.setState({
        token: 'initial_token',
        refreshToken: 'initial_refresh_token',
        user: { id: '1', username: 'testuser', email: 'test@example.com' }, // Assuming User type
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      (SecureStore.deleteItemAsync as jest.Mock).mockResolvedValue(undefined);

      await useAuthStore.getState().logout();

      const state = useAuthStore.getState();
      expect(state.token).toBeNull();
      expect(state.refreshToken).toBeNull();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false); // should be false after logout completes
      expect(state.error).toBeNull();
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('USER_AUTH_TOKEN');
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('USER_REFRESH_TOKEN');
      expect(useTrackingStore.getState().clearTrackedBooks).toHaveBeenCalled();
      expect(useListStore.getState().clearLists).toHaveBeenCalled();
    });

    it('should set error state if SecureStore.deleteItemAsync fails', async () => {
        const deleteErrorMessage = "Failed to delete token";
        (SecureStore.deleteItemAsync as jest.Mock).mockRejectedValue(new Error(deleteErrorMessage));
  
        // Setup initial logged-in state
        useAuthStore.setState({
          token: 'initial_token',
          refreshToken: 'initial_refresh_token',
          isAuthenticated: true,
        });
  
        await useAuthStore.getState().logout();
  
        const state = useAuthStore.getState();
        // Tokens might still be in state if deletion failed before setting them to null
        // but error should be set, and isLoading should be false.
        expect(state.error).toBe('Failed to logout'); // Generic error message from catch block
        expect(state.isLoading).toBe(false);
      });
  });

  describe('initializeAuth action', () => {
    it('should restore auth state if tokens are found in SecureStore', async () => {
      const storedToken = 'stored_access_token';
      const storedRefreshToken = 'stored_refresh_token';
      (SecureStore.getItemAsync as jest.Mock)
        .mockImplementation(async (key: string) => {
          if (key === 'USER_AUTH_TOKEN') return storedToken;
          if (key === 'USER_REFRESH_TOKEN') return storedRefreshToken;
          return null;
        });

      await useAuthStore.getState().initializeAuth();

      const state = useAuthStore.getState();
      expect(SecureStore.getItemAsync).toHaveBeenCalledWith('USER_AUTH_TOKEN');
      expect(SecureStore.getItemAsync).toHaveBeenCalledWith('USER_REFRESH_TOKEN');
      expect(state.token).toBe(storedToken);
      expect(state.refreshToken).toBe(storedRefreshToken);
      expect(state.isAuthenticated).toBe(true);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
      // expect(useTrackingStore.getState().fetchTrackedBooks).toHaveBeenCalled(); // These were added later
      // expect(useListStore.getState().fetchUserLists).toHaveBeenCalled();
    });

    it('should not change auth state if no tokens are found', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
      const initialSnapshot = { ...useAuthStore.getState() }; // Snapshot before action

      await useAuthStore.getState().initializeAuth();

      const state = useAuthStore.getState();
      expect(state.token).toBe(initialSnapshot.token); // Should remain null or initial
      expect(state.refreshToken).toBe(initialSnapshot.refreshToken); // Should remain null or initial
      expect(state.isAuthenticated).toBe(initialSnapshot.isAuthenticated); // Should remain false or initial
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
      expect(useTrackingStore.getState().fetchTrackedBooks).not.toHaveBeenCalled();
      expect(useListStore.getState().fetchUserLists).not.toHaveBeenCalled();
    });
  });
});

// Note: For a truly robust reset, initialAuthState should be the actual initial state object
// defined in the store, not just a spread of the state at an arbitrary point.
// If the store definition is: create<AuthState>(() => ({ token: null, ... })),
// then that object should be exported and used for reset.
// The current beforeEach tries to capture it, but it's better to export it.
// For example:
// export const authStoreInitialState = { token: null, refreshToken: null, ... };
// beforeEach(() => { useAuthStore.setState(authStoreInitialState, true); });
// This was simplified due to not being able to modify the store files directly to export initial state.
// The `true` in `setState(newState, true)` replaces the state instead of merging.
