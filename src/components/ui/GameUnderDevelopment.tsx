import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

interface GameUnderDevelopmentProps {
  gameName: string;
}

const GameUnderDevelopment: React.FC<GameUnderDevelopmentProps> = ({ gameName }) => {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <motion.div 
        className="bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full p-8 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div 
          className="text-5xl mb-6"
          initial={{ scale: 0 }}
          animate={{ scale: 1, rotate: [0, 10, 0] }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          🚧
        </motion.div>
        
        <motion.h1 
          className="text-3xl font-bold text-white mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {gameName} is Under Development
        </motion.h1>
        
        <motion.p 
          className="text-gray-300 mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          We're working hard to bring you an awesome {gameName} experience. 
          The game is currently under development and will be available soon.
        </motion.p>
        
        <motion.div
          className="bg-gray-700 rounded-lg p-4 mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <p className="text-yellow-300 font-medium">Expected Release</p>
          <p className="text-white text-xl">Coming Summer 2025</p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <Link 
            to="/games" 
            className="inline-block bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 px-6 rounded-lg transition-colors"
          >
            Browse Other Games
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default GameUnderDevelopment; 