import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { doc, updateDoc, getDoc, increment } from 'firebase/firestore';
import { db } from '../../firebase/config';
import Confetti from 'react-confetti';
import useWindowSize from 'react-use/lib/useWindowSize';

// Types
type Card = {
  id: number;
  type: string;
  flipped: boolean;
  matched: boolean;
};

type GameState = 'READY' | 'PLAYING' | 'WIN';
type Difficulty = 'easy' | 'medium' | 'hard';

const MemoryMatch = () => {
  // Game state
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCount, setFlippedCount] = useState(0);
  const [flippedIndexes, setFlippedIndexes] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [gameState, setGameState] = useState<GameState>('READY');
  const [timer, setTimer] = useState(0);
  const [bestTime, setBestTime] = useState<number | null>(null);
  const [bestMoves, setBestMoves] = useState<number | null>(null);
  const [gamesPlayed, setGamesPlayed] = useState(0);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Refs
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const gameContainerRef = useRef<HTMLDivElement>(null);
  
  // Auth and window size
  const { currentUser } = useAuth();
  const { width, height } = useWindowSize();
  
  // Card types (emoji for different themes)
  const cardTypes = {
    animals: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮'],
    food: ['🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍒', '🍑', '🥝', '🍍'],
    travel: ['🚗', '✈️', '🚀', '🚂', '🚢', '🚁', '🚕', '🚓', '🚑', '🚒', '🛵', '🏍️'],
    sports: ['⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏉', '🎱', '🏓', '🏸', '🥊', '⛳'],
    tech: ['📱', '💻', '⌚', '🖥️', '🖨️', '🖱️', '🕹️', '📷', '📹', '📺', '📟', '🎮']
  };
  
  // Current theme (random selection on mount)
  const [theme, setTheme] = useState<keyof typeof cardTypes>(
    Object.keys(cardTypes)[Math.floor(Math.random() * Object.keys(cardTypes).length)] as keyof typeof cardTypes
  );
  

  
  useEffect(() => {
    if (currentUser) {
      loadUserStats();
    }
  }, [currentUser]);
  
  const loadUserStats = async () => {
    if (!currentUser) return;
    
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.games && userData.games.memoryMatch) {
          setBestTime(userData.games.memoryMatch.bestTime || null);
          setBestMoves(userData.games.memoryMatch.bestMoves || null);
          setGamesPlayed(userData.games.memoryMatch.gamesPlayed || 0);
        }
      }
    } catch (error) {
      console.error('Error loading user stats:', error);
    }
  };
  
  // Start game timer
  useEffect(() => {
    if (gameState === 'PLAYING') {
      timerRef.current = setInterval(() => {
        setTimer(prevTimer => prevTimer + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [gameState]);
  
  // Initialize cards based on difficulty
  const initializeCards = () => {
    // Determine number of pairs based on difficulty
    let numPairs;
    switch(difficulty) {
      case 'easy':
        numPairs = 6;
        break;
      case 'medium':
        numPairs = 8;
        break;
      case 'hard':
        numPairs = 12;
        break;
      default:
        numPairs = 8;
    }
    
    // Select card types for this game
    const selectedTypes = [...cardTypes[theme]].slice(0, numPairs);
    
    // Create card pairs
    let newCards: Card[] = [];
    selectedTypes.forEach((type, index) => {
      newCards.push(
        { id: index * 2, type, flipped: false, matched: false },
        { id: index * 2 + 1, type, flipped: false, matched: false }
      );
    });
    
    // Shuffle cards
    newCards = shuffleArray(newCards);
    setCards(newCards);
  };
  
  // Shuffle array implementation (Fisher-Yates algorithm)
  const shuffleArray = <T extends unknown>(array: T[]): T[] => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };
  
  // Start a new game
  const startGame = () => {
    setMoves(0);
    setTimer(0);
    setFlippedCount(0);
    setFlippedIndexes([]);
    initializeCards();
    setGameState('PLAYING');
  };
  
  // Handle card click
  const handleCardClick = (index: number) => {
    // Don't allow flips during animation or if card is already matched/flipped
    if (
      flippedCount >= 2 || 
      cards[index].flipped || 
      cards[index].matched ||
      gameState !== 'PLAYING'
    ) {
      return;
    }
    
    // Flip the card
    const newCards = [...cards];
    newCards[index].flipped = true;
    setCards(newCards);
    
    // Track flipped cards
    const newFlippedIndexes = [...flippedIndexes, index];
    setFlippedIndexes(newFlippedIndexes);
    setFlippedCount(flippedCount + 1);
    
    // If this is the second card flipped, check for a match
    if (flippedCount === 1) {
      setMoves(moves + 1);
      const firstIndex = flippedIndexes[0];
      const secondIndex = index;
      
      if (newCards[firstIndex].type === newCards[secondIndex].type) {
        // Match found
        newCards[firstIndex].matched = true;
        newCards[secondIndex].matched = true;
        setCards(newCards);
        
        // Reset flipped count and indexes after a brief delay
        setTimeout(() => {
          setFlippedCount(0);
          setFlippedIndexes([]);
          
          // Check if all cards are matched
          if (newCards.every(card => card.matched)) {
            gameWon();
          }
        }, 500);
      } else {
        // No match
        setTimeout(() => {
          newCards[firstIndex].flipped = false;
          newCards[secondIndex].flipped = false;
          setCards(newCards);
          setFlippedCount(0);
          setFlippedIndexes([]);
        }, 1000);
      }
    }
  };
  
  // Game won handler
  const gameWon = async () => {
    setGameState('WIN');
    let newBestTime = bestTime;
    let newBestMoves = bestMoves;
    
    // Check for new records
    if (bestTime === null || timer < bestTime) {
      newBestTime = timer;
      setBestTime(timer);
    }
    
    if (bestMoves === null || moves < bestMoves) {
      newBestMoves = moves;
      setBestMoves(moves);
    }
    
    // Update user stats if logged in
    if (currentUser) {
      try {
        const userRef = doc(db, 'users', currentUser.uid);
        
        await updateDoc(userRef, {
          'games.memoryMatch.gamesPlayed': increment(1)
        });
        
        if (newBestTime !== bestTime) {
          await updateDoc(userRef, {
            'games.memoryMatch.bestTime': newBestTime
          });
        }
        
        if (newBestMoves !== bestMoves) {
          await updateDoc(userRef, {
            'games.memoryMatch.bestMoves': newBestMoves
          });
        }
        
        setGamesPlayed(gamesPlayed + 1);
      } catch (error) {
        console.error('Error updating stats:', error);
      }
    }
  };
  
  // Change theme
  const changeTheme = () => {
    const themes = Object.keys(cardTypes);
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex] as keyof typeof cardTypes);
  };
  
  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      gameContainerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };
  
  // Calculate grid columns based on difficulty
  const getGridCols = () => {
    switch(difficulty) {
      case 'easy':
        return 'grid-cols-3';
      case 'medium':
        return 'grid-cols-4';
      case 'hard':
        return 'grid-cols-4 md:grid-cols-6';
      default:
        return 'grid-cols-4';
    }
  };
  
  // Render the card grid
  const renderCards = () => {
    return (
      <div className={`grid ${getGridCols()} gap-3 md:gap-4`}>
        {cards.map((card, index) => (
          <motion.div 
            key={card.id}
            className="relative cursor-pointer aspect-square"
            whileHover={{ scale: card.flipped || card.matched ? 1 : 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => handleCardClick(index)}
          >
            <div className="relative preserve-3d w-full h-full card-shadow rounded-xl overflow-hidden">
              {/* Card back */}
              <motion.div
                className={`card-content bg-gradient-to-br from-purple-700 to-indigo-900 rounded-xl shadow-lg flex items-center justify-center border-2 ${card.flipped || card.matched ? 'border-transparent' : 'border-purple-400'}`}
                initial={false}
                animate={{
                  rotateY: card.flipped || card.matched ? 180 : 0,
                  opacity: card.flipped || card.matched ? 0 : 1,
                  zIndex: card.flipped || card.matched ? 0 : 1
                }}
                transition={{ 
                  duration: 0.6, 
                  ease: [0.4, 0.0, 0.2, 1],
                  opacity: { duration: 0.2 }
                }}
              >
                <div className="relative text-white">
                  {/* Card center icon */}
                  <div className="absolute text-4xl opacity-20 transform -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2">
                    ♠
                  </div>
                  
                  {/* Card corner icons */}
                  <div className="absolute top-1 left-1 text-sm">♦</div>
                  <div className="absolute top-1 right-1 text-sm">♥</div>
                  <div className="absolute bottom-1 left-1 text-sm">♣</div>
                  <div className="absolute bottom-1 right-1 text-sm">♠</div>
                  
                  {/* Card design */}
                  <div className="flex flex-col items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </motion.div>
              
              {/* Card front */}
              <motion.div
                className={`card-content bg-white rounded-xl shadow-lg flex items-center justify-center ${card.matched ? 'bg-green-50 border-2 border-green-400' : 'border-2 border-indigo-300'}`}
                initial={false}
                animate={{
                  rotateY: card.flipped || card.matched ? 0 : -180,
                  opacity: card.flipped || card.matched ? 1 : 0,
                  zIndex: card.flipped || card.matched ? 1 : 0
                }}
                transition={{ 
                  duration: 0.6, 
                  ease: [0.4, 0.0, 0.2, 1],
                  opacity: { duration: 0.2, delay: card.flipped || card.matched ? 0.2 : 0 }
                }}
              >
                <div className="text-5xl transform transition-transform duration-200 ease-out">
                  {card.type}
                </div>
                
                {/* Subtle glow effect for matched cards */}
                {card.matched && (
                  <motion.div
                    className="absolute inset-0 rounded-xl"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    style={{
                      background: 'radial-gradient(circle, rgba(74, 222, 128, 0.2) 0%, rgba(74, 222, 128, 0) 70%)',
                      pointerEvents: 'none'
                    }}
                  />
                )}
              </motion.div>
            </div>
          </motion.div>
        ))}
      </div>
    );
  };
  
  // Set up CSS for 3D card effect
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .preserve-3d {
        transform-style: preserve-3d;
        backface-visibility: hidden;
        perspective: 1000px;
      }
      .card-flip {
        transition: transform 0.6s cubic-bezier(0.4, 0.0, 0.2, 1);
        transform-style: preserve-3d;
      }
      .card-shadow {
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
        transition: box-shadow 0.6s ease;
        min-height: 80px;
      }
      .card-shadow:hover {
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      }
      .card-content {
        position: absolute;
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  
  return (
    <div 
      ref={gameContainerRef}
      className={`min-h-screen flex items-center justify-center bg-gradient-to-b from-indigo-900 to-purple-900 py-6 px-4 ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}
    >
      <div className="w-full max-w-4xl">
        <motion.h1 
          className="text-3xl md:text-4xl font-bold text-center mb-6"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <span className="bg-gradient-to-r from-pink-400 to-purple-500 text-transparent bg-clip-text">
            Memory Match
          </span>
        </motion.h1>
        
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-4 md:p-6 shadow-2xl border border-purple-500/20">
          {/* Game controls */}
          <div className="flex flex-wrap justify-between items-center mb-4 md:mb-6 gap-2">
            <div className="flex items-center space-x-2">
              <div className="bg-gray-700/70 text-white px-3 py-2 rounded-lg flex items-center space-x-2">
                <span className="text-purple-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                </span>
                <span className="font-mono font-bold">{formatTime(timer)}</span>
              </div>
              
              <div className="bg-gray-700/70 text-white px-3 py-2 rounded-lg flex items-center space-x-2">
                <span className="text-purple-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                  </svg>
                </span>
                <span className="font-bold">{moves}</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={changeTheme}
                className="bg-gray-700/70 hover:bg-purple-700 text-white p-2 rounded-lg transition-colors"
                title="Change theme"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M4 2a2 2 0 00-2 2v11a3 3 0 106 0V4a2 2 0 00-2-2H4zm1 14a1 1 0 100-2 1 1 0 000 2zm5-1.757l4.9-4.9a2 2 0 000-2.828L13.485 5.1a2 2 0 00-2.828 0L10 5.757v8.486zM16 18H9.071l6-6H16a2 2 0 012 2v2a2 2 0 01-2 2z" />
                </svg>
              </button>
              
              <button
                onClick={toggleFullscreen}
                className="bg-gray-700/70 hover:bg-purple-700 text-white p-2 rounded-lg transition-colors"
                title="Toggle fullscreen"
              >
                {isFullscreen ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5 4a1 1 0 00-1 1v4a1 1 0 01-2 0V5a3 3 0 013-3h4a1 1 0 010 2H5zM10 9a1 1 0 011-1h4a3 3 0 013 3v4a1 1 0 11-2 0v-4a1 1 0 00-1-1h-4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 01-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 011.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 011.414-1.414L15 13.586V12a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
              
              {gameState !== 'PLAYING' && (
                <motion.button
                  onClick={startGame}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-4 py-2 rounded-lg font-medium shadow-lg"
                >
                  {gameState === 'READY' ? 'Start Game' : 'Play Again'}
                </motion.button>
              )}
            </div>
          </div>
          
          {/* Difficulty selection */}
          <div className="flex justify-center mb-4">
            <div className="bg-gray-700/70 rounded-lg p-1 flex space-x-1">
              {(['easy', 'medium', 'hard'] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => setDifficulty(level)}
                  className={`px-3 py-1 rounded text-sm ${
                    difficulty === level 
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium'
                      : 'text-gray-300 hover:text-white'
                  }`}
                  disabled={gameState === 'PLAYING'}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </button>
              ))}
            </div>
          </div>
          
          {/* Game board */}
          <div className="relative">
            {gameState === 'READY' ? (
              <div className="bg-gray-800/90 backdrop-blur rounded-xl p-6 text-center min-h-[300px] flex flex-col items-center justify-center">
                <motion.div 
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-2xl font-bold text-purple-300 mb-3"
                >
                  Memory Match
                </motion.div>
                
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-gray-300 mb-6 max-w-md"
                >
                  Test your memory by matching pairs of cards. 
                  Find all matches in the shortest time with the fewest moves!
                </motion.p>
                
                <motion.button
                  onClick={startGame}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-3 rounded-lg font-medium shadow-lg"
                >
                  Start Game
                </motion.button>
              </div>
            ) : (
              <motion.div 
                initial={gameState === 'PLAYING' ? { opacity: 0, scale: 0.95 } : false}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="p-3 md:p-4 bg-gray-800/40 rounded-xl"
              >
                {renderCards()}
              </motion.div>
            )}
            
            {/* Win overlay */}
            <AnimatePresence>
              {gameState === 'WIN' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-xl z-10"
                >
                  <Confetti
                    width={width}
                    height={height}
                    recycle={false}
                    numberOfPieces={200}
                    gravity={0.15}
                  />
                  <motion.div
                    initial={{ scale: 0.8, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    className="text-center p-6 bg-gray-800/90 rounded-xl shadow-2xl border border-purple-500/30 max-w-md"
                  >
                    <h3 className="text-2xl font-bold text-purple-300 mb-2">You Win!</h3>
                    <div className="flex justify-center space-x-4 mb-4">
                      <div className="text-center">
                        <p className="text-gray-400 text-sm">Time</p>
                        <p className="text-xl font-mono font-bold text-white">{formatTime(timer)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-400 text-sm">Moves</p>
                        <p className="text-xl font-bold text-white">{moves}</p>
                      </div>
                    </div>
                    
                    {(timer === bestTime || moves === bestMoves) && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-gray-900 font-bold py-2 px-4 rounded-lg mb-4"
                      >
                        {timer === bestTime && moves === bestMoves ? (
                          <span>New Record! 🏆</span>
                        ) : timer === bestTime ? (
                          <span>Fastest Time! ⏱️</span>
                        ) : (
                          <span>Fewest Moves! 👏</span>
                        )}
                      </motion.div>
                    )}
                    
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-2 rounded-lg font-medium shadow-lg"
                      onClick={startGame}
                    >
                      Play Again
                    </motion.button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* Stats panel */}
          {currentUser && (
            <div className="mt-4 md:mt-6 bg-gray-800/70 rounded-xl p-4">
              <h3 className="text-lg font-medium text-purple-300 mb-3">Your Stats</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-gray-400 text-sm">Best Time</p>
                  <p className="text-lg font-mono font-bold text-white">
                    {bestTime !== null ? formatTime(bestTime) : '--:--'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Best Moves</p>
                  <p className="text-lg font-bold text-white">
                    {bestMoves !== null ? bestMoves : '--'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Games Played</p>
                  <p className="text-lg font-bold text-white">{gamesPlayed}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MemoryMatch; 