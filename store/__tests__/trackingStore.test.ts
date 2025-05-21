import { useTrackingStore } from '../trackingStore';
import { addBookToTracking, removeBookFromTracking, updateBookTracking, getMyLibraryBooks } from '../../api'; // Path to api
import { Book, BookResponse, BookTracking } from '../../types';

// Mocking API functions
jest.mock('../../api', () => ({
  addBookToTracking: jest.fn(),
  removeBookFromTracking: jest.fn(),
  updateBookTracking: jest.fn(),
  getMyLibraryBooks: jest.fn(),
}));

// Helper to get initial state for reset
const getInitialTrackingState = () => useTrackingStore.getState();
let initialTrackingState: ReturnType<typeof getInitialTrackingState>;

const mockBook1: Book = {
    id: 1, title: 'Book 1', author: 'Author 1', cover_image: 'img1.jpg',
    description: 'Desc 1', release_year: 2021, genres: [], tags: [],
    type: 'manga', status: 'ongoing', chapters_count: 10, rating: 4.0,
    tracking: false, // Initially not tracked or this field might be optional
};

const mockBook2: Book = {
    id: 2, title: 'Book 2', author: 'Author 2', cover_image: 'img2.jpg',
    description: 'Desc 2', release_year: 2022, genres: [], tags: [],
    type: 'novel', status: 'completed', chapters_count: 20, rating: 4.5,
    tracking: false,
};

describe('useTrackingStore', () => {
  beforeEach(() => {
    if (!initialTrackingState) {
        initialTrackingState = { ...useTrackingStore.getState() };
    }
    useTrackingStore.setState(initialTrackingState, true);
    jest.clearAllMocks();
  });

  describe('fetchTrackedBooks action', () => {
    const mockBookResponse1: BookResponse = {
        book: { id: 1, title: 'Book 1 API', author: 'Author 1', cover_image: 'img1.jpg', description: '', release_year: 2021, genres:[], tags:[], type:'manga', status:'ongoing', chapters_count:10, rating: 4.0 },
        tracking_info: { status: 'reading', current_chapter: 5, updated_at: new Date().toISOString() } as BookTracking,
      };
      const mockBookResponse2: BookResponse = {
        book: { id: 2, title: 'Book 2 API', author: 'Author 2', cover_image: 'img2.jpg', description: '', release_year: 2022, genres:[], tags:[], type:'novel', status:'completed', chapters_count:20, rating: 4.5 },
        tracking_info: { status: 'completed', current_chapter: 20, updated_at: new Date().toISOString() } as BookTracking,
      };
    const mockApiLibraryResponse: BookResponse[] = [mockBookResponse1, mockBookResponse2];

    it('should update trackedBooks on successful fetch', async () => {
      (getMyLibraryBooks as jest.Mock).mockResolvedValue(mockApiLibraryResponse);

      await useTrackingStore.getState().fetchTrackedBooks();

      const state = useTrackingStore.getState();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
      expect(Object.keys(state.trackedBooks).length).toBe(2);
      expect(state.trackedBooks[1].title).toBe('Book 1 API');
      expect(state.trackedBooks[1].tracking).toBe(true);
      expect(state.trackedBooks[1].tracking_status).toBe('reading'); // Verifying mapping
      expect(state.trackedBooks[2].title).toBe('Book 2 API');
      expect(state.trackedBooks[2].tracking).toBe(true);
      expect(state.trackedBooks[2].tracking_status).toBe('completed');
    });

    it('should set error state on API failure', async () => {
      const errorMessage = 'Network error';
      (getMyLibraryBooks as jest.Mock).mockRejectedValue(new Error(errorMessage));

      await useTrackingStore.getState().fetchTrackedBooks();

      const state = useTrackingStore.getState();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe('Failed to fetch tracked books');
      expect(Object.keys(state.trackedBooks).length).toBe(0);
    });
  });

  describe('addTrackedBook action', () => {
    const mockTrackingInfoResponse: BookTracking = {
        status: 'plan_to_read', 
        current_chapter: 0,
        updated_at: new Date().toISOString(),
        // other fields if present in BookTracking
    };

    it('should add book to trackedBooks and update state correctly on success', async () => {
      (addBookToTracking as jest.Mock).mockResolvedValue(mockTrackingInfoResponse);

      await useTrackingStore.getState().addTrackedBook(mockBook1);

      const state = useTrackingStore.getState();
      expect(state.trackedBooks[mockBook1.id]).toBeDefined();
      expect(state.trackedBooks[mockBook1.id].title).toBe(mockBook1.title);
      expect(state.trackedBooks[mockBook1.id].tracking).toBe(true);
      expect(state.trackedBooks[mockBook1.id].tracking_status).toBe(mockTrackingInfoResponse.status);
      expect(state.isUpdating[mockBook1.id]).toBe(false);
      expect(state.updateError[mockBook1.id]).toBeNull();
    });

    it('should set updateError on API failure for addTrackedBook', async () => {
      const errorMessage = 'API error adding book';
      (addBookToTracking as jest.Mock).mockRejectedValue(new Error(errorMessage));

      await useTrackingStore.getState().addTrackedBook(mockBook1);

      const state = useTrackingStore.getState();
      expect(state.trackedBooks[mockBook1.id]).toBeUndefined();
      expect(state.isUpdating[mockBook1.id]).toBe(false);
      expect(state.updateError[mockBook1.id]).toBe(`Failed to add ${mockBook1.id} to tracking`);
    });
  });

  describe('removeTrackedBook action', () => {
    it('should remove book from trackedBooks on success', async () => {
      // Pre-populate store with a book
      useTrackingStore.setState({
        trackedBooks: { [mockBook1.id]: { ...mockBook1, tracking: true, tracking_status: 'reading' } },
      });
      (removeBookFromTracking as jest.Mock).mockResolvedValue(undefined); // API call is successful

      await useTrackingStore.getState().removeTrackedBook(mockBook1.id);

      const state = useTrackingStore.getState();
      expect(state.trackedBooks[mockBook1.id]).toBeUndefined();
      expect(state.isUpdating[mockBook1.id]).toBe(false);
      expect(state.updateError[mockBook1.id]).toBeNull(); // Ensure error is null on success
    });

    it('should set updateError on API failure for removeTrackedBook', async () => {
        // Pre-populate store with a book
        useTrackingStore.setState({
            trackedBooks: { [mockBook1.id]: { ...mockBook1, tracking: true, tracking_status: 'reading' } },
        });
        const errorMessage = 'API error removing book';
        (removeBookFromTracking as jest.Mock).mockRejectedValue(new Error(errorMessage));
  
        await useTrackingStore.getState().removeTrackedBook(mockBook1.id);
  
        const state = useTrackingStore.getState();
        expect(state.trackedBooks[mockBook1.id]).toBeDefined(); // Book should still be there if API failed
        expect(state.isUpdating[mockBook1.id]).toBe(false);
        expect(state.updateError[mockBook1.id]).toBe(`Failed to remove ${mockBook1.id}`);
      });
  });

  // Tests for updateTrackedBook would be similar:
  // - Mock updateBookTracking API.
  // - Check successful update in trackedBooks and isUpdating/updateError states.
  // - Check error handling.

  // Selectors are simple and directly derive state, usually tested implicitly via actions.
  // isBookTracked, getTrackedBooks, getTrackedBookStatus
});
