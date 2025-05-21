import { useListStore } from '../listStore';
import { getMyLists } from '../../api'; // Path to api
import { ReadingList } from '../../types';

// Mocking API functions
jest.mock('../../api', () => ({
  getMyLists: jest.fn(),
}));

// Helper to get initial state for reset
const getInitialListState = () => useListStore.getState();
let initialListState: ReturnType<typeof getInitialListState>;

describe('useListStore', () => {
  beforeEach(() => {
    if (!initialListState) {
        initialListState = { ...useListStore.getState() };
    }
    useListStore.setState(initialListState, true);
    jest.clearAllMocks();
  });

  describe('fetchUserLists action', () => {
    const mockUserLists: ReadingList[] = [
      { id: 'list1', name: 'My Favorites', book_ids: [1, 2], user_id: 'user1', created_at: '', updated_at: '' },
      { id: 'list2', name: 'To Read Next', book_ids: [3, 4], user_id: 'user1', created_at: '', updated_at: '' },
    ];

    it('should update lists and cache on successful fetch', async () => {
      (getMyLists as jest.Mock).mockResolvedValue(mockUserLists);

      await useListStore.getState().fetchUserLists();

      const state = useListStore.getState();
      expect(state.lists).toEqual(mockUserLists);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.cache?.data).toEqual(mockUserLists);
      expect(state.cache?.timestamp).toBeDefined();
    });

    it('should use cached lists if cache is valid and forceRefresh is false', async () => {
      const now = Date.now();
      // Pre-populate cache
      useListStore.setState({
        cache: { data: mockUserLists, timestamp: now - 1000 }, // Cache is 1 sec old
        lists: [], 
      });

      await useListStore.getState().fetchUserLists(false); // forceRefresh is false

      expect(getMyLists as jest.Mock).not.toHaveBeenCalled();
      const state = useListStore.getState();
      expect(state.lists).toEqual(mockUserLists);
      expect(state.isLoading).toBe(false);
    });

    it('should re-fetch lists if cache is expired', async () => {
      const expiredTimestamp = Date.now() - (6 * 60 * 1000); // 6 minutes ago
      useListStore.setState({
        cache: { data: [{id: 'oldList', name: 'Old List', book_ids:[], user_id:'user1', created_at:'', updated_at:''}], timestamp: expiredTimestamp },
      });
      (getMyLists as jest.Mock).mockResolvedValue(mockUserLists); // New data

      await useListStore.getState().fetchUserLists(false);

      expect(getMyLists as jest.Mock).toHaveBeenCalledTimes(1);
      const state = useListStore.getState();
      expect(state.lists).toEqual(mockUserLists); // Should have new data
    });

    it('should re-fetch lists if forceRefresh is true, even if cache is valid', async () => {
        const now = Date.now();
        useListStore.setState({
          cache: { data: [{id: 'cachedList', name: 'Cached List', book_ids:[], user_id:'user1', created_at:'', updated_at:''}], timestamp: now - 1000 },
        });
        (getMyLists as jest.Mock).mockResolvedValue(mockUserLists); // New data
  
        await useListStore.getState().fetchUserLists(true); // forceRefresh is true
  
        expect(getMyLists as jest.Mock).toHaveBeenCalledTimes(1);
        const state = useListStore.getState();
        expect(state.lists).toEqual(mockUserLists);
      });

    it('should set error state on API failure', async () => {
      const errorMessage = 'Network error fetching lists';
      (getMyLists as jest.Mock).mockRejectedValue(new Error(errorMessage));

      await useListStore.getState().fetchUserLists();

      const state = useListStore.getState();
      expect(state.error).toBe(errorMessage); // Assuming error message is directly set
      expect(state.isLoading).toBe(false);
      expect(state.lists).toEqual([]);
    });
  });

  it('clearLists should reset lists, error, cache, and isLoading', () => {
    useListStore.setState({ 
        lists: [{id: 'list1'} as ReadingList], 
        error: 'some error', 
        cache: {data: [], timestamp: Date.now()}, 
        isLoading: true 
    });
    useListStore.getState().clearLists();
    const state = useListStore.getState();
    expect(state.lists).toEqual([]);
    expect(state.error).toBeNull();
    expect(state.cache).toBeNull();
    expect(state.isLoading).toBe(false);
  });
});
