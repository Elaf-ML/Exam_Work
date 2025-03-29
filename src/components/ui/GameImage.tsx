import { useState, useEffect } from 'react';

interface GameImageProps {
  game: 'tictactoe' | 'memory' | 'snake' | 'tetris' | 'pong' | 'chess';
  className?: string;
}

// Color schemes for each game
const colorSchemes = {
  tictactoe: ['#FF4560', '#775DD0'],
  memory: ['#00E396', '#008FFB'],
  snake: ['#00E396', '#008FFB'],
  tetris: ['#FEB019', '#FF4560'],
  pong: ['#775DD0', '#00E396'],
  chess: ['#3A3A40', '#645CBB'],
};

// Game icons (using Unicode symbols as placeholders)
const gameIcons = {
  tictactoe: '❌⭕',
  memory: '🃏🎴',
  snake: '🐍🍎',
  tetris: '🟥🟦🟩🟨',
  pong: '🏓',
  chess: '♞♟',
};

const GameImage = ({ game, className = '' }: GameImageProps) => {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setLoaded(true), 300);
    return () => clearTimeout(timer);
  }, []);

  // Get colors for this game
  const [primaryColor, secondaryColor] = colorSchemes[game];

  // Generate a fancy background gradient
  const background = `linear-gradient(45deg, ${primaryColor} 0%, ${secondaryColor} 100%)`;

  return (
    <div 
      className={`w-full h-full flex items-center justify-center ${className} ${
        loaded ? 'animate-none' : 'animate-pulse'
      } relative`}
      style={{ background }}
    >
      <div className="text-4xl relative z-10">{gameIcons[game]}</div>
      <div 
        className="absolute inset-0 bg-dark opacity-40 hover:opacity-20 transition-opacity duration-300"
        style={{
          backgroundImage: 'radial-gradient(circle, transparent 20%, #121212 80%)',
          backgroundSize: '15px 15px',
        }}
      />
      <div className="absolute bottom-4 left-4 text-white text-xl font-bold capitalize z-10">
        {game}
      </div>
    </div>
  );
};

export default GameImage; 