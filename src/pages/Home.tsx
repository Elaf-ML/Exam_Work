import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import ModelScene from '../components/models/ModelScene';
import GameImage from '../components/ui/GameImage';



// Game Card Component
const GameCard = ({ 
  title, 
  description, 
  game, 
  link 
}: { 
  title: string; 
  description: string; 
  game: 'tictactoe' | 'memory' | 'snake' | 'tetris' | 'pong' | 'chess'; 
  link: string 
}) => {
  return (
    <motion.div 
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="card-game flex flex-col h-full overflow-hidden"
    >
      <div className="h-48 bg-dark-lighter rounded-t-lg overflow-hidden relative">
        <GameImage game={game} className="transition-all duration-500 hover:scale-110" />
      </div>
      <div className="p-4 flex-grow">
        <h3 className="game-title mb-2">{title}</h3>
        <p className="text-gray-300 mb-4">{description}</p>
        <Link to={link} className="btn-primary inline-block mt-auto">
          Play Now
        </Link>
      </div>
    </motion.div>
  );
};

const Home = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="container mx-auto px-4 py-10">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-16"
      >
        <h1 className="text-5xl md:text-6xl font-gaming font-bold gradient-text mb-6">
          Welcome to GamesHub
        </h1>
        <p className="text-xl text-gray-300 max-w-3xl mx-auto">
          Your ultimate destination for online multiplayer games.
          Challenge friends, track your statistics, and climb the leaderboards!
        </p>
        
        {/* 3D Model Display */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="my-12 max-w-2xl mx-auto"
        >
          <ModelScene modelType="cube" height="300px" background="rgba(0,0,0,0.2)" />
        </motion.div>
        
        {!isAuthenticated && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mt-8"
          >
            <div className="bg-dark-light border border-primary/30 p-4 rounded-lg inline-block">
              <p className="text-gray-300 mb-4">
                <span className="text-primary font-bold">Sign in</span> to play games and track your progress!
              </p>
              <div className="flex justify-center space-x-4">
                <Link to="/login" className="btn-secondary">
                  Login
                </Link>
                <Link to="/register" className="btn-primary">
                  Sign Up
                </Link>
              </div>
            </div>
          </motion.div>
        )}
        
        <div className="mt-12">
          <Link to="/games" className="btn-primary text-lg px-8 py-3">
            Browse Games
          </Link>
        </div>
      </motion.div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, staggerChildren: 0.1 }}
        >
          <GameCard 
            title="Tic Tac Toe" 
            description="The classic game of X's and O's. Challenge a friend or play against AI."
            game="tictactoe"
            link="/games/tictactoe"
          />
          
          <GameCard 
            title="Memory Match" 
            description="Test your memory by matching pairs of cards in the shortest time possible."
            game="memory"
            link="/games/memory"
          />
          
          <GameCard 
            title="Snake" 
            description="Navigate the snake to eat apples without hitting walls or yourself."
            game="snake"
            link="/games/snake"
          />
          
          <GameCard 
            title="Tetris" 
            description="Arrange falling blocks to create complete lines and score points."
            game="tetris"
            link="/games/tetris"
          />
          
          <GameCard 
            title="Pong" 
            description="The classic table tennis arcade game. Play against a friend or AI."
            game="pong"
            link="/games/pong"
          />
          
          <GameCard 
            title="Chess" 
            description="The classic game of strategy. Challenge a friend to a battle of wits on the chessboard."
            game="chess"
            link="/games/chess"
          />
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-16 max-w-4xl mx-auto"
        >
          <h2 className="text-3xl font-gaming font-bold text-primary mb-6">
            Why Choose GamesHub?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <div className="bg-dark-light p-6 rounded-lg">
              <h3 className="text-xl text-primary mb-3">Track Your Progress</h3>
              <p className="text-gray-300">
                Keep track of your stats and high scores across all games. See how you rank against other players.
              </p>
            </div>
            
            <div className="bg-dark-light p-6 rounded-lg">
              <h3 className="text-xl text-primary mb-3">Challenge Friends</h3>
              <p className="text-gray-300">
                Invite friends to play online multiplayer games with our easy-to-use invite system.
              </p>
            </div>
            
            <div className="bg-dark-light p-6 rounded-lg">
              <h3 className="text-xl text-primary mb-3">Beautiful Design</h3>
              <p className="text-gray-300">
                Enjoy our carefully crafted user interface with smooth animations and responsive design.
              </p>
            </div>
          </div>
        </motion.div>
        
        {/* 3D Console Display */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="mt-16 mb-12 max-w-4xl mx-auto"
        >
          <div className="bg-dark-light p-6 rounded-lg">
            <h2 className="text-2xl font-gaming font-bold text-primary mb-4">
              Experience Our Interactive Gaming Room
            </h2>
            <ModelScene height="450px" modelType="enhanced" />
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Home; 