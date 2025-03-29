import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { collection, query,  limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';

// Types
interface LeaderboardUser {
  id: string;
  displayName: string;
  stats: {
    wins?: number;
    highScore?: number;
    bestTime?: number;
    gamesPlayed?: number;
  };
}

const gameLabels = {
  tictactoe: 'Tic Tac Toe',
  snake: 'Snake',
  memory: 'Memory',
  tetris: 'Tetris',
  pong: 'Pong',
  chess: 'Chess'
};

const Leaderboard = () => {
  const [activeGame, setActiveGame] = useState('tictactoe');
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { currentUser } = useAuth();

  // Fetch leaderboard data
  useEffect(() => {
    const fetchLeaderboardData = async () => {
      setLoading(true);
      setError('');
      
      try {
        let sortedData: LeaderboardUser[] = [];

        // Try first approach - if we're logged in
        if (currentUser) {
          try {
            // Create a simpler query - just get all users and sort client-side
            const usersRef = collection(db, 'users');
            const q = query(usersRef, limit(50));
            
            const querySnapshot = await getDocs(q);
            const allData: LeaderboardUser[] = [];
            
            querySnapshot.forEach((doc) => {
              const userData = doc.data();
              const gameData = userData.games?.[activeGame];
              
              if (gameData) {
                allData.push({
                  id: doc.id,
                  displayName: userData.displayName || 'Anonymous',
                  stats: {
                    wins: gameData.wins || 0,
                    highScore: gameData.highScore || 0,
                    bestTime: gameData.bestTime || null,
                    gamesPlayed: gameData.gamesPlayed || 0
                  }
                });
              }
            });
            
            // Sort the data based on the active game
            if (activeGame === 'memory') {
              const usersWithBestTime = allData.filter(user => user.stats.bestTime !== null);
              const usersWithoutBestTime = allData.filter(user => user.stats.bestTime === null);
              
              usersWithBestTime.sort((a, b) => {
                return (a.stats.bestTime || 999999) - (b.stats.bestTime || 999999);
              });
              
              sortedData = [...usersWithBestTime, ...usersWithoutBestTime];
            } else if (activeGame === 'tictactoe' || activeGame === 'pong' || activeGame === 'chess') {
              allData.sort((a, b) => (b.stats.wins || 0) - (a.stats.wins || 0));
              sortedData = allData;
            } else {
              allData.sort((a, b) => (b.stats.highScore || 0) - (a.stats.highScore || 0));
              sortedData = allData;
            }
          } catch (err) {
            console.error('Error with first approach:', err);
            // If first approach fails, we'll try the second one below
          }
        }
        
        // If first approach failed or returned no data, try the fallback
        // Only use fallback data for games other than chess
        if (sortedData.length === 0 && activeGame !== 'chess') {
          // Fallback to sample data for demonstration
          const sampleData = generateSampleData(activeGame);
          sortedData = sampleData;
          console.log("Using fallback data for leaderboard");
        }
        
        // Take top 10
        setLeaderboardData(sortedData.slice(0, 10));
        
        // If still no data, show message
        if (sortedData.length === 0) {
          if (activeGame === 'chess') {
            setError(`No chess players found in the database. Be the first to play!`);
          } else {
            setError(`No leaderboard data available for ${gameLabels[activeGame as keyof typeof gameLabels]}. Be the first to play!`);
          }
        }
      } catch (err) {
        console.error('Error fetching leaderboard data:', err);
        
        if (activeGame === 'chess') {
          setError('No chess leaderboard data available in the database.');
        } else {
          setError('Failed to load leaderboard data. Please try again later.');
          
          // Last resort - use sample data for games other than chess
          const sampleData = generateSampleData(activeGame);
          setLeaderboardData(sampleData);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboardData();
  }, [activeGame, currentUser]);

  // Function to generate sample data for demonstration
  const generateSampleData = (game: string): LeaderboardUser[] => {
    switch (game) {
      case 'tictactoe':
        return Array.from({ length: 10 }, (_, i) => ({
          id: `sample-${i}`,
          displayName: `Player${i+1}`,
          stats: { wins: 50 - i * 3, gamesPlayed: 100 - i * 5 }
        }));
      case 'snake':
        return Array.from({ length: 10 }, (_, i) => ({
          id: `sample-${i}`,
          displayName: `Snake${i+1}`,
          stats: { highScore: 1000 - i * 50, gamesPlayed: 50 - i * 3 }
        }));
      case 'memory':
        return Array.from({ length: 10 }, (_, i) => ({
          id: `sample-${i}`,
          displayName: `Memory${i+1}`,
          stats: { bestTime: 10 + i * 0.5, gamesPlayed: 40 - i * 2 }
        }));
      case 'tetris':
        return Array.from({ length: 10 }, (_, i) => ({
          id: `sample-${i}`,
          displayName: `Tetris${i+1}`,
          stats: { highScore: 20000 - i * 1000, gamesPlayed: 60 - i * 4 }
        }));
      case 'pong':
        return Array.from({ length: 10 }, (_, i) => ({
          id: `sample-${i}`,
          displayName: `Pong${i+1}`,
          stats: { wins: 60 - i * 4, gamesPlayed: 90 - i * 5 }
        }));
      case 'chess':
        return Array.from({ length: 10 }, (_, i) => ({
          id: `sample-${i}`,
          displayName: `Chess${i+1}`,
          stats: { wins: 65 - i * 5, gamesPlayed: 95 - i * 6 }
        }));
      default:
        return [];
    }
  };

  const getStatLabel = () => {
    switch (activeGame) {
      case 'tictactoe':
      case 'pong':
      case 'chess':
        return 'Wins';
      case 'memory':
        return 'Best Time';
      default:
        return 'High Score';
    }
  };

  const formatStat = (user: LeaderboardUser) => {
    switch (activeGame) {
      case 'tictactoe':
      case 'pong':
      case 'chess':
        return user.stats.wins ?? 0;
      case 'memory':
        return user.stats.bestTime ? `${user.stats.bestTime.toFixed(1)}s` : '-';
      default:
        return user.stats.highScore?.toLocaleString() ?? 0;
    }
  };

  return (
    <div className="container mx-auto px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl font-gaming font-bold gradient-text text-center mb-8">
          Leaderboards
        </h1>
        
        <div className="flex justify-center mb-8 overflow-x-auto">
          <div className="inline-flex bg-dark-light rounded-lg p-1">
            <button 
              onClick={() => setActiveGame('tictactoe')}
              className={`px-4 py-2 rounded-md ${activeGame === 'tictactoe' ? 'bg-primary text-white' : 'text-gray-300 hover:bg-dark-lighter'}`}
            >
              Tic Tac Toe
            </button>
            <button 
              onClick={() => setActiveGame('snake')}
              className={`px-4 py-2 rounded-md ${activeGame === 'snake' ? 'bg-primary text-white' : 'text-gray-300 hover:bg-dark-lighter'}`}
            >
              Snake
            </button>
            <button 
              onClick={() => setActiveGame('memory')}
              className={`px-4 py-2 rounded-md ${activeGame === 'memory' ? 'bg-primary text-white' : 'text-gray-300 hover:bg-dark-lighter'}`}
            >
              Memory
            </button>
            <button 
              onClick={() => setActiveGame('tetris')}
              className={`px-4 py-2 rounded-md ${activeGame === 'tetris' ? 'bg-primary text-white' : 'text-gray-300 hover:bg-dark-lighter'}`}
            >
              Tetris
            </button>
            <button 
              onClick={() => setActiveGame('pong')}
              className={`px-4 py-2 rounded-md ${activeGame === 'pong' ? 'bg-primary text-white' : 'text-gray-300 hover:bg-dark-lighter'}`}
            >
              Pong
            </button>
            <button 
              onClick={() => setActiveGame('chess')}
              className={`px-4 py-2 rounded-md ${activeGame === 'chess' ? 'bg-primary text-white' : 'text-gray-300 hover:bg-dark-lighter'}`}
            >
              Chess
            </button>
          </div>
        </div>
        
        <div className="bg-dark-light rounded-lg overflow-hidden max-w-4xl mx-auto">
          <div className="bg-dark-lighter p-4 border-b border-dark flex justify-between items-center">
            <h2 className="text-xl font-gaming font-bold text-primary">
              {gameLabels[activeGame as keyof typeof gameLabels]} Leaderboard
            </h2>
            <span className="text-gray-400">Top 10 Players</span>
          </div>
          
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-pulse text-primary">
                Loading leaderboard data...
              </div>
            </div>
          ) : error ? (
            <div className="p-8 text-center text-gray-400">
              {error}
            </div>
          ) : (
            <div className="p-4">
              <div className="grid grid-cols-12 gap-4 py-2 px-4 border-b border-dark-lighter text-gray-400">
                <div className="col-span-2">Rank</div>
                <div className="col-span-7">Player</div>
                <div className="col-span-3 text-right">{getStatLabel()}</div>
              </div>
              
              {leaderboardData.map((user, index) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`grid grid-cols-12 gap-4 py-3 px-4 ${
                    index < 3 ? 'bg-dark-lighter/50' : ''
                  } ${index !== leaderboardData.length - 1 ? 'border-b border-dark-lighter' : ''}`}
                >
                  <div className="col-span-2 flex items-center">
                    {index < 3 ? (
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        index === 0
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : index === 1
                          ? 'bg-gray-400/20 text-gray-300'
                          : 'bg-amber-800/20 text-amber-600'
                      }`}>
                        {index + 1}
                      </span>
                    ) : (
                      <span className="text-gray-500 font-medium pl-3">
                        {index + 1}
                      </span>
                    )}
                  </div>
                  <div className="col-span-7 font-medium truncate">
                    {user.displayName}
                    <span className="text-xs text-gray-500 ml-2">
                      {user.stats.gamesPlayed ? `(${user.stats.gamesPlayed} games)` : ''}
                    </span>
                  </div>
                  <div className="col-span-3 text-right font-bold">
                    {formatStat(user)}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Leaderboard; 