import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import GameImage from '../components/ui/GameImage';
import { useEffect, useState } from 'react';

const GamesPage = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'multiplayer' | 'singleplayer'>('all');
  
  useEffect(() => {
    // Set loaded state after components have mounted
    setIsLoaded(true);
  }, []);
  
  const games = [
    {
      id: 'tictactoe',
      title: 'Tic Tac Toe',
      description: 'The classic game of X\'s and O\'s. Challenge a friend or play against AI.',
      multiplayer: true,
      difficulty: 'Easy'
    },
    {
      id: 'memory',
      title: 'Memory Match',
      description: 'Test your memory by matching pairs of cards in the shortest time possible.',
      multiplayer: false,
      difficulty: 'Medium'
    },
    {
      id: 'snake',
      title: 'Snake',
      description: 'Navigate the snake to eat apples without hitting walls or yourself.',
      multiplayer: false,
      difficulty: 'Medium'
    },
    {
      id: 'tetris',
      title: 'Tetris',
      description: 'Arrange falling blocks to create complete lines and score points.',
      multiplayer: false,
      difficulty: 'Hard'
    },
    {
      id: 'pong',
      title: 'Pong (Coming Soon)',
      description: 'This game is currently under development. Check back soon!',
      multiplayer: true,
      difficulty: 'Easy',
      disabled: true
    },
    {
      id: 'chess',
      title: 'Chess',
      description: 'The ultimate game of strategy. Challenge friends to a match of wits and tactics.',
      multiplayer: true,
      difficulty: 'Hard'
    }
  ];

  // Count games by category for the filter tabs
  const multiplayerGamesCount = games.filter(game => game.multiplayer).length;
  const singlePlayerGamesCount = games.filter(game => !game.multiplayer).length;

  // Filter games based on the active filter
  const filteredGames = games.filter(game => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'multiplayer') return game.multiplayer;
    if (activeFilter === 'singleplayer') return !game.multiplayer;
    return true;
  });

  return (
    <div className="container mx-auto px-4 py-10 overflow-x-hidden">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 20 }}
        transition={{ duration: 0.5, staggerChildren: 0.1 }}
        className="flex flex-col items-center"
      >
        <h1 className="text-4xl font-gaming font-bold gradient-text text-center mb-8">
          Our Games
        </h1>
        
        <div className="flex justify-center mb-8 w-full overflow-x-auto">
          <div className="inline-flex bg-dark-light rounded-lg p-1">
            <button 
              onClick={() => setActiveFilter('all')}
              className={`px-4 py-2 rounded-md flex items-center ${activeFilter === 'all' ? 'bg-primary text-white' : 'text-gray-300 hover:bg-dark-lighter'}`}
            >
              All Games
              <span className="ml-2 bg-dark-lighter px-2 py-0.5 rounded-full text-xs">
                {games.length}
              </span>
            </button>
            <button 
              onClick={() => setActiveFilter('multiplayer')}
              className={`px-4 py-2 rounded-md flex items-center ${activeFilter === 'multiplayer' ? 'bg-primary text-white' : 'text-gray-300 hover:bg-dark-lighter'}`}
            >
              Multiplayer
              <span className={`ml-2 ${activeFilter === 'multiplayer' ? 'bg-primary-dark' : 'bg-dark-lighter'} px-2 py-0.5 rounded-full text-xs`}>
                {multiplayerGamesCount}
              </span>
            </button>
            <button 
              onClick={() => setActiveFilter('singleplayer')}
              className={`px-4 py-2 rounded-md flex items-center ${activeFilter === 'singleplayer' ? 'bg-primary text-white' : 'text-gray-300 hover:bg-dark-lighter'}`}
            >
              Single Player
              <span className={`ml-2 ${activeFilter === 'singleplayer' ? 'bg-primary-dark' : 'bg-dark-lighter'} px-2 py-0.5 rounded-full text-xs`}>
                {singlePlayerGamesCount}
              </span>
            </button>
          </div>
        </div>
        
        <AnimatePresence mode="wait">
          <motion.div 
            key={activeFilter}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 w-full"
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {filteredGames.map((game, index) => (
              <motion.div
                key={game.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ 
                  duration: 0.4, 
                  delay: index * 0.05,
                  ease: "easeOut"
                }}
                whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                whileTap={{ scale: 0.98 }}
                className="card-game h-full"
              >
                <div className="h-48 bg-dark-lighter rounded-t-lg overflow-hidden">
                  <GameImage 
                    game={game.id as 'tictactoe' | 'memory' | 'snake' | 'tetris' | 'pong' | 'chess'} 
                    className="w-full h-full object-cover transition-all duration-300 hover:scale-105" 
                  />
                </div>
                
                <div className="p-5 flex flex-col h-[calc(100%-12rem)]">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="game-title text-xl">{game.title}</h3>
                    <div className="flex space-x-2">
                      {game.multiplayer && (
                        <span className="bg-primary/20 text-primary text-xs px-2 py-1 rounded whitespace-nowrap">
                          Multiplayer
                        </span>
                      )}
                      <span className={`text-xs px-2 py-1 rounded whitespace-nowrap ${
                        game.difficulty === 'Easy'
                          ? 'bg-green-500/20 text-green-500'
                          : game.difficulty === 'Medium'
                          ? 'bg-yellow-500/20 text-yellow-500'
                          : 'bg-red-500/20 text-red-500'
                      }`}>
                        {game.difficulty}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-gray-300 mb-4 flex-grow">
                    {game.description}
                  </p>
                  
                  <Link
                    to={game.disabled ? '#' : `/games/${game.id}`}
                    onClick={(e) => game.disabled && e.preventDefault()}
                    className={`btn-primary inline-block w-full text-center mt-auto ${
                      game.disabled ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {game.disabled ? 'Coming Soon' : 'Play Now'}
                  </Link>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
        
        <motion.div 
          className="mt-16 text-center w-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 20 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <h2 className="text-2xl font-gaming font-bold text-primary mb-4">
            More Games Coming Soon!
          </h2>
          <p className="text-gray-300 mb-6">
            We're constantly working on adding new games to our collection. Stay tuned for updates!
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-dark p-4 rounded-md border border-primary/30 flex-1">
              <h3 className="text-lg text-primary mb-2">Connect Four</h3>
              <p className="text-gray-400 text-sm">Coming in July 2025</p>
            </div>
            <div className="bg-dark p-4 rounded-md border border-primary/30 flex-1">
              <h3 className="text-lg text-primary mb-2">Word Puzzle</h3>
              <p className="text-gray-400 text-sm">Coming in August 2025</p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default GamesPage; 