import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { updateProfile } from 'firebase/auth';
import toast from 'react-hot-toast';

// Types
interface GameStats {
  tictactoe: {
    wins: number;
    losses: number;
    draws: number;
  };
  memory: {
    bestTime: number | null;
    gamesPlayed: number;
  };
  snake: {
    highScore: number;
    gamesPlayed: number;
  };
  tetris: {
    highScore: number;
    gamesPlayed: number;
  };
  pong: {
    wins: number;
    losses: number;
  };
  chess: {
    wins: number;
    losses: number;
    draws: number;
  };
}

interface UserData {
  displayName: string;
  email: string;
  createdAt: any;
  games: GameStats;
  lastNameChange?: {
    seconds: number;
    nanoseconds: number;
  };
}

const Profile = () => {
  const { currentUser, logout } = useAuth();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('stats');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [canChangeName, setCanChangeName] = useState(true);
  const [timeUntilNextChange, setTimeUntilNextChange] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        const userRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          const data = userDoc.data() as UserData;
          setUserData(data);
          setNewDisplayName(currentUser.displayName || '');
          
          // Check if user can change name (once per day limit)
          if (data.lastNameChange) {
            const lastChangeDate = new Date(data.lastNameChange.seconds * 1000);
            const now = new Date();
            const oneDayInMs = 24 * 60 * 60 * 1000;
            const diffMs = now.getTime() - lastChangeDate.getTime();
            
            if (diffMs < oneDayInMs) {
              setCanChangeName(false);
              
              // Calculate time remaining until next change is allowed
              const remainingMs = oneDayInMs - diffMs;
              const remainingHrs = Math.floor(remainingMs / (60 * 60 * 1000));
              const remainingMins = Math.floor((remainingMs % (60 * 60 * 1000)) / (60 * 1000));
              setTimeUntilNextChange(`${remainingHrs}h ${remainingMins}m`);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [currentUser]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };
  
  const handleUpdateProfile = async () => {
    if (!currentUser || !userData) return;
    
    // Validate input
    if (!newDisplayName.trim()) {
      toast.error('Display name cannot be empty');
      return;
    }
    
    if (newDisplayName.trim() === currentUser.displayName) {
      toast.error('New name must be different from current name');
      return;
    }
    
    if (!canChangeName) {
      toast.error(`You can only change your name once per day. Try again in ${timeUntilNextChange}.`);
      return;
    }
    
    setIsUpdating(true);
    
    try {
      // Update auth profile
      await updateProfile(currentUser, {
        displayName: newDisplayName.trim()
      });
      
      // Update Firestore user document
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        displayName: newDisplayName.trim(),
        lastNameChange: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      // Update local state
      setUserData({
        ...userData,
        displayName: newDisplayName.trim(),
        lastNameChange: {
          seconds: Math.floor(Date.now() / 1000),
          nanoseconds: 0
        }
      });
      
      // Set name change cooldown
      setCanChangeName(false);
      setTimeUntilNextChange('24h 0m');
      
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-10 text-center">
        <div className="animate-pulse text-primary">
          Loading...
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="container mx-auto px-4 py-10 text-center">
        <h2 className="text-3xl font-gaming font-bold text-primary mb-6">
          Please Log In
        </h2>
        <p className="text-gray-300 mb-6">
          You need to be logged in to view your profile.
        </p>
        <button 
          onClick={() => navigate('/login')}
          className="btn-primary"
        >
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto"
      >
        <div className="bg-dark-light rounded-lg overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-primary to-primary-dark h-32 relative">
            <div className="absolute -bottom-16 left-8">
              <div className="w-32 h-32 bg-dark-lighter rounded-full border-4 border-dark-light flex items-center justify-center text-4xl text-primary font-bold">
                {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : 'U'}
              </div>
            </div>
          </div>
          
          <div className="pt-20 pb-6 px-8">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-gaming font-bold text-white">
                  {currentUser.displayName || 'User'}
                </h1>
                <p className="text-gray-400">
                  {currentUser.email}
                </p>
                {userData?.createdAt && (
                  <p className="text-gray-400 text-sm mt-1">
                    Member since: {new Date(userData.createdAt.seconds * 1000).toLocaleDateString()}
                  </p>
                )}
              </div>
              
              <button
                onClick={handleLogout}
                className="btn-secondary"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
        
        <div className="bg-dark-light rounded-lg overflow-hidden">
          <div className="border-b border-dark-lighter">
            <div className="flex">
              <button
                onClick={() => setActiveTab('stats')}
                className={`px-6 py-4 font-medium ${
                  activeTab === 'stats'
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                Game Stats
              </button>
              
              <button
                onClick={() => setActiveTab('history')}
                className={`px-6 py-4 font-medium ${
                  activeTab === 'history'
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                Game History
              </button>
              
              <button
                onClick={() => setActiveTab('settings')}
                className={`px-6 py-4 font-medium ${
                  activeTab === 'settings'
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                Settings
              </button>
            </div>
          </div>
          
          <div className="p-6">
            {activeTab === 'stats' && userData && (
              <div>
                <h2 className="text-2xl font-gaming font-bold text-primary mb-6">
                  Your Game Statistics
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-dark p-4 rounded-lg border border-dark-lighter">
                    <h3 className="text-xl text-primary mb-3">Tic Tac Toe</h3>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-gray-400">Wins</p>
                        <p className="text-2xl text-primary">{userData.games.tictactoe.wins}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Losses</p>
                        <p className="text-2xl text-primary-light">{userData.games.tictactoe.losses}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Draws</p>
                        <p className="text-2xl text-gray-300">{userData.games.tictactoe.draws}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-dark p-4 rounded-lg border border-dark-lighter">
                    <h3 className="text-xl text-primary mb-3">Snake</h3>
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <p className="text-gray-400">High Score</p>
                        <p className="text-2xl text-primary">{userData.games.snake.highScore}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Games Played</p>
                        <p className="text-2xl text-primary-light">{userData.games.snake.gamesPlayed}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-dark p-4 rounded-lg border border-dark-lighter">
                    <h3 className="text-xl text-primary mb-3">Memory Match</h3>
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <p className="text-gray-400">Best Time</p>
                        <p className="text-2xl text-primary">{userData.games.memory.bestTime ? `${userData.games.memory.bestTime}s` : '-'}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Games Played</p>
                        <p className="text-2xl text-primary-light">{userData.games.memory.gamesPlayed}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-dark p-4 rounded-lg border border-dark-lighter">
                    <h3 className="text-xl text-primary mb-3">Tetris</h3>
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <p className="text-gray-400">High Score</p>
                        <p className="text-2xl text-primary">{userData.games.tetris.highScore}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Games Played</p>
                        <p className="text-2xl text-primary-light">{userData.games.tetris.gamesPlayed}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-dark p-4 rounded-lg border border-dark-lighter">
                    <h3 className="text-xl text-primary mb-3">Pong</h3>
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <p className="text-gray-400">Wins</p>
                        <p className="text-2xl text-primary">{userData.games.pong.wins}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Losses</p>
                        <p className="text-2xl text-primary-light">{userData.games.pong.losses}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-dark p-4 rounded-lg border border-dark-lighter">
                    <h3 className="text-xl text-primary mb-3">Chess</h3>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-gray-400">Wins</p>
                        <p className="text-2xl text-primary">{userData.games.chess?.wins || 0}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Losses</p>
                        <p className="text-2xl text-primary-light">{userData.games.chess?.losses || 0}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Draws</p>
                        <p className="text-2xl text-gray-300">{userData.games.chess?.draws || 0}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'history' && (
              <div>
                <h2 className="text-2xl font-gaming font-bold text-primary mb-6">
                  Game History
                </h2>
                <p className="text-gray-300">
                  Recent games will appear here (feature coming soon).
                </p>
              </div>
            )}
            
            {activeTab === 'settings' && (
              <div>
                <h2 className="text-2xl font-gaming font-bold text-primary mb-6">
                  Profile Settings
                </h2>
                <div className="bg-dark p-6 rounded-lg mb-6">
                  <h3 className="text-xl text-primary mb-4">Change Display Name</h3>
                  
                  <div className="mb-4">
                    <label className="block text-gray-300 mb-2" htmlFor="displayName">
                      Display Name
                    </label>
                    <input
                      type="text"
                      id="displayName"
                      className="w-full px-3 py-2 bg-dark-lighter border border-dark-lighter rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-white"
                      value={newDisplayName}
                      onChange={(e) => setNewDisplayName(e.target.value)}
                      maxLength={20}
                      disabled={isUpdating || !canChangeName}
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      {canChangeName ? 'You can change your name once per day' : `You can change your name again in ${timeUntilNextChange}`}
                    </p>
                  </div>
                  
                  <button 
                    className={`btn-primary ${(!canChangeName || isUpdating) ? 'opacity-60 cursor-not-allowed' : ''}`}
                    onClick={handleUpdateProfile}
                    disabled={!canChangeName || isUpdating}
                  >
                    {isUpdating ? 'Updating...' : 'Update Profile'}
                  </button>
                  
                  {!canChangeName && (
                    <div className="mt-4 p-3 bg-primary/10 rounded-md text-primary-light text-sm">
                      <p>You can only change your name once every 24 hours.</p>
                      <p className="mt-1">Next available change: <span className="font-bold">{timeUntilNextChange}</span> from now</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Profile; 