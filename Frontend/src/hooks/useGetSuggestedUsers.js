import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setSuggestedUsers } from '../store/authSlice';

// This hook fetches suggested users for the current user
const useGetSuggestedUsers = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    // In a real application, this would make an API call to fetch suggested users
    // For now, we'll simulate this with mock data
    const fetchSuggestedUsers = async () => {
      try {
        // Simulated API response
        const mockSuggestedUsers = [
          {
            _id: '1',
            username: 'john_doe',
            profilePicture: '',
            bio: 'Software Developer'
          },
          {
            _id: '2',
            username: 'jane_smith',
            profilePicture: '',
            bio: 'UX Designer'
          },
          {
            _id: '3',
            username: 'alex_wilson',
            profilePicture: '',
            bio: 'Digital Marketing Specialist'
          },
          {
            _id: '4',
            username: 'sam_johnson',
            profilePicture: '',
            bio: 'Content Creator'
          },
          {
            _id: '5',
            username: 'taylor_brown',
            profilePicture: '',
            bio: 'Blockchain Enthusiast'
          }
        ];

        // Dispatch action to update Redux store with suggested users
        dispatch(setSuggestedUsers(mockSuggestedUsers));
      } catch (error) {
        console.error('Error fetching suggested users:', error);
      }
    };

    fetchSuggestedUsers();
  }, [dispatch]);

  // This hook doesn't return anything as it updates the Redux store directly
  return null;
};

export default useGetSuggestedUsers;