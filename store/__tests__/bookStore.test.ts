import { useBookStore } from '../bookStore';
import { getCategories, getBook, getCategory } from '../../api'; // Path to api
import { Book, Category } from '../../types';

// Mocking API functions
jest.mock('../../api', () => ({
  getCategories: jest.fn(),
  getBook: jest.fn(),
  getCategory: jest.fn(),
}));

// Helper to get initial state for reset
const getInitialBookState = () => useBookStore.getState();
let initialBookState: ReturnType<typeof getInitialBookState>;

describe('useBookStore', () => {
  beforeEach(() => {
    if (!initialBookState) {
        initialBookState = { ...useBookStore.getState() };
    }
    useBookStore.setState(initialBookState, true);
    jest.clearAllMocks();
  });

  describe('fetchCategories action', () => {
    const mockCategories: Category[] = [
      { id: '1', title: 'Fiction', description: 'Fictional books', books: [] },
      { id: '2', title: 'Science', description: 'Scientific books', books: [] },
    ];

    it('should update categories and cache on successful fetch', async () => {
      (getCategories as jest.Mock).mockResolvedValue(mockCategories);

      await useBookStore.getState().fetchCategories();

      const state = useBookStore.getState();
      expect(state.categories).toEqual(mockCategories);
      expect(state.isLoadingCategories).toBe(false);
      expect(state.errorCategories).toBeNull();
      expect(state.categoriesCache?.data).toEqual(mockCategories);
      expect(state.categoriesCache?.timestamp).toBeDefined();
    });

    it('should use cached categories if cache is valid and forceRefresh is false', async () => {
      const now = Date.now();
      // Pre-populate cache
      useBookStore.setState({
        categoriesCache: { data: mockCategories, timestamp: now - 1000 }, // Cache is 1 sec old
        categories: [], // Ensure categories are initially empty
      });

      await useBookStore.getState().fetchCategories(false); // forceRefresh is false

      expect(getCategories as jest.Mock).not.toHaveBeenCalled();
      const state = useBookStore.getState();
      expect(state.categories).toEqual(mockCategories);
      expect(state.isLoadingCategories).toBe(false);
    });

    it('should re-fetch categories if cache is expired', async () => {
      const expiredTimestamp = Date.now() - (6 * 60 * 1000); // 6 minutes ago, cache duration is 5 min
      useBookStore.setState({
        categoriesCache: { data: [{id: 'old', title: 'Old Category', books:[], description:''}], timestamp: expiredTimestamp },
      });
      (getCategories as jest.Mock).mockResolvedValue(mockCategories); // New data

      await useBookStore.getState().fetchCategories(false);

      expect(getCategories as jest.Mock).toHaveBeenCalledTimes(1);
      const state = useBookStore.getState();
      expect(state.categories).toEqual(mockCategories); // Should have new data
    });

    it('should re-fetch categories if forceRefresh is true, even if cache is valid', async () => {
        const now = Date.now();
        useBookStore.setState({
          categoriesCache: { data: [{id: 'cached', title: 'Cached Category', books:[], description:''}], timestamp: now - 1000 },
        });
        (getCategories as jest.Mock).mockResolvedValue(mockCategories); // New data
  
        await useBookStore.getState().fetchCategories(true); // forceRefresh is true
  
        expect(getCategories as jest.Mock).toHaveBeenCalledTimes(1);
        const state = useBookStore.getState();
        expect(state.categories).toEqual(mockCategories); // Should have new data
      });

    it('should set errorCategories on API failure', async () => {
      const errorMessage = 'Network error';
      (getCategories as jest.Mock).mockRejectedValue(new Error(errorMessage));

      await useBookStore.getState().fetchCategories();

      const state = useBookStore.getState();
      expect(state.errorCategories).toBe('Failed to fetch categories');
      expect(state.isLoadingCategories).toBe(false);
      expect(state.categories).toEqual([]); // Categories should be empty or initial state
    });
  });

  describe('fetchBookDetail action', () => {
    const mockBook: Book = {
        id: 1, title: 'Test Book 1', author: 'Author 1', cover_image: 'url1', 
        description: 'Desc 1', release_year: 2022, genres: [], tags: [],
        type: 'manga', status: 'ongoing', chapters_count: 10, rating: 4.5
    };
    const bookId = '1';

    it('should update currentBook and cache on successful fetch', async () => {
        (getBook as jest.Mock).mockResolvedValue(mockBook);

        await useBookStore.getState().fetchBookDetail(bookId);

        const state = useBookStore.getState();
        expect(state.currentBook).toEqual(mockBook);
        expect(state.isLoadingBookDetail).toBe(false);
        expect(state.errorBookDetail).toBeNull();
        expect(state.bookDetailCache[bookId]?.data).toEqual(mockBook);
    });

    // Similar tests for fetchBookDetail caching (valid, expired, forceRefresh) and error handling can be added here.
    // For brevity, I'm focusing on the primary success and error cases as per the task request.
  });

  describe('fetchRecommendations action', () => {
    const mockBookId = '1';
    const mockRecommendedBooks: Book[] = [
        { id: 10, title: 'Recommended Book 1', author: 'Rec Author 1', cover_image: 'url_rec1', description:'', release_year: 2023, genres:[], tags:[], type:'manga', status:'ongoing', chapters_count: 5, rating: 4.0 },
    ];
    const mockCategoryWithRecs: Category = {
        id: 'rec-cat-1', title: 'Recommendations', description: '', books: mockRecommendedBooks
    };

    it('should update recommendations on successful fetch', async () => {
        (getCategory as jest.Mock).mockResolvedValue(mockCategoryWithRecs);

        await useBookStore.getState().fetchRecommendations(mockBookId);

        const state = useBookStore.getState();
        expect(state.recommendations).toEqual(mockRecommendedBooks);
        expect(state.isLoadingRecommendations).toBe(false);
        expect(state.errorRecommendations).toBeNull();
    });

    it('should set errorRecommendations if API fails', async () => {
        (getCategory as jest.Mock).mockRejectedValue(new Error('API error'));
        await useBookStore.getState().fetchRecommendations(mockBookId);
        const state = useBookStore.getState();
        expect(state.errorRecommendations).toBe('Failed to fetch recommendations');
        expect(state.isLoadingRecommendations).toBe(false);
    });

    it('should set recommendations to empty array if category has no books', async () => {
        (getCategory as jest.Mock).mockResolvedValue({ ...mockCategoryWithRecs, books: [] });
        await useBookStore.getState().fetchRecommendations(mockBookId);
        const state = useBookStore.getState();
        expect(state.recommendations).toEqual([]);
        expect(state.isLoadingRecommendations).toBe(false);
        expect(state.errorRecommendations).toBe('No recommendations found or category has no books');
    });
  });

  // clearCurrentBook and clearRecommendations are simple state setters,
  // usually not requiring complex tests unless they involve side effects.
  it('clearCurrentBook should set currentBook to null', () => {
    useBookStore.setState({ currentBook: { id:1 } as Book }); // Set some book
    useBookStore.getState().clearCurrentBook();
    expect(useBookStore.getState().currentBook).toBeNull();
  });

  it('clearRecommendations should set recommendations to empty array', () => {
    useBookStore.setState({ recommendations: [{ id:1 } as Book] }); // Set some recs
    useBookStore.getState().clearRecommendations();
    expect(useBookStore.getState().recommendations).toEqual([]);
  });

});
