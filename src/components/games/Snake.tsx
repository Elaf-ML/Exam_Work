import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';

// Types
type Direction = 'UP' | 'RIGHT' | 'DOWN' | 'LEFT';
type Position = { x: number; y: number };
type GameState = 'READY' | 'PLAYING' | 'GAME_OVER';

// Increased grid size for more play area
const GRID_SIZE = 21;
// Base speed values - smaller numbers = faster snake
const BASE_SPEED = 200; // ms - starting speed (increased from 150 to make it slower initially)
const MIN_SPEED = 70;   // ms - maximum speed (minimum delay)
const SPEED_FACTOR = 1; // how much to reduce delay per food eaten (reduced from 2 to make speed increase more gradual)

const Snake = () => {
  const [snake, setSnake] = useState<Position[]>([{ x: 10, y: 10 }]);
  const [food, setFood] = useState<Position>({ x: 5, y: 5 });
  const [direction, setDirection] = useState<Direction>('RIGHT');
  const [nextDirection, setNextDirection] = useState<Direction>('RIGHT');
  const [gameState, setGameState] = useState<GameState>('READY');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gamesPlayed, setGamesPlayed] = useState(0);
  const [lastMoveTime, setLastMoveTime] = useState(0);
  const [showOverlay, setShowOverlay] = useState(false);
  const [foodType, setFoodType] = useState<'apple' | 'cherry' | 'berry'>('apple');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const gameLoopRef = useRef<number | null>(null);
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const { currentUser } = useAuth();

  // Load user stats
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
        if (userData.games && userData.games.snake) {
          setHighScore(userData.games.snake.highScore || 0);
          setGamesPlayed(userData.games.snake.gamesPlayed || 0);
        }
      }
    } catch (error) {
      console.error('Error loading user stats:', error);
    }
  };

  // Handle keyboard controls with improved direction buffering
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'PLAYING') return;
      
      // Buffer the next direction instead of changing immediately
      // This prevents rapid opposite key presses from causing game over
      switch (e.key) {
        case 'ArrowUp':
          if (direction !== 'DOWN') setNextDirection('UP');
          break;
        case 'ArrowRight':
          if (direction !== 'LEFT') setNextDirection('RIGHT');
          break;
        case 'ArrowDown':
          if (direction !== 'UP') setNextDirection('DOWN');
          break;
        case 'ArrowLeft':
          if (direction !== 'RIGHT') setNextDirection('LEFT');
          break;
        case ' ': // Space key to pause/resume
          setShowOverlay(prev => !prev);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [direction, gameState]);

  // Game loop with animation frame for smoother movement
  useEffect(() => {
    if (gameState !== 'PLAYING' || showOverlay) return;

    // Calculate current speed based on snake length
    const calculateSpeed = () => {
      // Start slow and gradually increase speed with a progressive formula
      // The longer the snake, the faster it gets, but with diminishing returns
      const snakeLength = snake.length - 1; // minus 1 to account for initial length
      
      // Increase speed gradually: slower at first, then faster as snake gets bigger
      let speedMultiplier = 1;
      if (snakeLength > 5) speedMultiplier = 1.2;
      if (snakeLength > 10) speedMultiplier = 1.5;
      if (snakeLength > 15) speedMultiplier = 1.8;
      if (snakeLength > 20) speedMultiplier = 2.0;
      
      const currentSpeed = Math.max(
        MIN_SPEED, 
        BASE_SPEED - ((snakeLength * SPEED_FACTOR) * speedMultiplier)
      );
      return currentSpeed;
    };

    const moveSnake = (timestamp: number) => {
      // Only move after enough time has passed - speed increases with snake length
      const currentSpeed = calculateSpeed();
      if (timestamp - lastMoveTime < currentSpeed) {
        gameLoopRef.current = requestAnimationFrame(moveSnake);
        return;
      }

      setLastMoveTime(timestamp);
      
      // Update direction from the buffer
      setDirection(nextDirection);
      
      setSnake(prevSnake => {
        const newSnake = [...prevSnake];
        const head = { ...newSnake[0] };

        // Move head based on direction
        switch (nextDirection) {
          case 'UP':
            head.y -= 1;
            break;
          case 'RIGHT':
            head.x += 1;
            break;
          case 'DOWN':
            head.y += 1;
            break;
          case 'LEFT':
            head.x -= 1;
            break;
        }

        // Check wall collision
        if (
          head.x < 0 ||
          head.x >= GRID_SIZE ||
          head.y < 0 ||
          head.y >= GRID_SIZE
        ) {
          gameOver();
          return prevSnake;
        }

        // Check self collision (skip the tail tip since it will move)
        for (let i = 0; i < newSnake.length - 1; i++) {
          if (newSnake[i].x === head.x && newSnake[i].y === head.y) {
            gameOver();
            return prevSnake;
          }
        }

        // Add new head
        newSnake.unshift(head);

        // Check if snake ate food
        if (head.x === food.x && head.y === food.y) {
          // Increase score
          setScore(prev => prev + 10);
          // Generate new food
          generateFood(newSnake);
          // Change food type occasionally
          setFoodType(['apple', 'cherry', 'berry'][Math.floor(Math.random() * 3)] as 'apple' | 'cherry' | 'berry');
        } else {
          // Remove tail
          newSnake.pop();
        }

        return newSnake;
      });

      gameLoopRef.current = requestAnimationFrame(moveSnake);
    };

    // Start game loop
    gameLoopRef.current = requestAnimationFrame(moveSnake);

    // Cleanup function
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [direction, nextDirection, food, gameState, showOverlay, lastMoveTime, snake.length]);

  const startGame = () => {
    // Reset game state
    setSnake([{ x: 10, y: 10 }]);
    setDirection('RIGHT');
    setNextDirection('RIGHT');
    setScore(0);
    setLastMoveTime(0);
    setShowOverlay(false);
    // Generate a random food type
    setFoodType(['apple', 'cherry', 'berry'][Math.floor(Math.random() * 3)] as 'apple' | 'cherry' | 'berry');
    generateFood([{ x: 10, y: 10 }]);
    setGameState('PLAYING');
  };

  const gameOver = async () => {
    setGameState('GAME_OVER');
    
    if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current);
    }
    
    // Update stats if logged in
    if (currentUser) {
      try {
        const userRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const currentHighScore = userData.games?.snake?.highScore || 0;
          const newGamesPlayed = (userData.games?.snake?.gamesPlayed || 0) + 1;
          
          // Update if current score is higher
          if (score > currentHighScore) {
            await updateDoc(userRef, {
              'games.snake.highScore': score,
              'games.snake.gamesPlayed': newGamesPlayed
            });
            setHighScore(score);
          } else {
            await updateDoc(userRef, {
              'games.snake.gamesPlayed': newGamesPlayed
            });
          }
          
          setGamesPlayed(newGamesPlayed);
        }
      } catch (error) {
        console.error('Error updating stats:', error);
      }
    }
  };

  const generateFood = (currentSnake: Position[]) => {
    let newFood: Position;
    let foodOnSnake = true;
    
    // Generate food not on snake
    while (foodOnSnake) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
      };
      
      foodOnSnake = currentSnake.some(
        segment => segment.x === newFood.x && segment.y === newFood.y
      );
      
      if (!foodOnSnake) {
        setFood(newFood);
      }
    }
  };

  // Get snake segment type for styling
  const getSegmentType = (index: number, snakeLength: number) => {
    if (index === 0) return 'head';
    if (index === snakeLength - 1) return 'tail';
    return 'body';
  };

  // Get rotation for snake head based on direction
  const getHeadRotation = () => {
    switch (direction) {
      case 'UP': return 'rotate-0';
      case 'RIGHT': return 'rotate-90';
      case 'DOWN': return 'rotate-180';
      case 'LEFT': return 'rotate-270';
      default: return 'rotate-90';
    }
  };

  // Get adjacent segments to determine body curve
  const getSegmentDirection = (index: number, segments: Position[]) => {
    if (index === 0 || index >= segments.length - 1) return '';
    
    const prev = segments[index + 1];
    const curr = segments[index];
    const next = segments[index - 1];
    
    // Horizontal straight
    if (prev.y === curr.y && curr.y === next.y) return 'horizontal';
    // Vertical straight
    if (prev.x === curr.x && curr.x === next.x) return 'vertical';
    
    // Curves
    if (prev.x < curr.x && next.y < curr.y || prev.y < curr.y && next.x < curr.x) return 'curve-tl';
    if (prev.x > curr.x && next.y < curr.y || prev.y < curr.y && next.x > curr.x) return 'curve-tr';
    if (prev.x < curr.x && next.y > curr.y || prev.y > curr.y && next.x < curr.x) return 'curve-bl';
    if (prev.x > curr.x && next.y > curr.y || prev.y > curr.y && next.x > curr.x) return 'curve-br';
    
    return 'horizontal'; // Fallback
  };

  // Render functions
  const renderCell = (x: number, y: number) => {
    // Find any snake segment at this cell
    const segmentIndex = snake.findIndex(segment => segment.x === x && segment.y === y);
    const isSnake = segmentIndex !== -1;
    const isFood = food.x === x && food.y === y;
    
    // Empty cell - just render a grid cell
    if (!isSnake && !isFood) {
      return (
        <div 
          key={`${x}-${y}`} 
          className="w-5 h-5 border border-dark-lighter/20"
          style={{ backgroundColor: (x + y) % 2 === 0 ? '#1b1e2a' : '#1f2336' }}
        />
      );
    }
    
    // Food cell
    if (isFood) {
      return (
        <motion.div
          key={`food-${x}-${y}`}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-5 h-5 flex items-center justify-center"
        >
          <div className={`
            w-4 h-4 rounded-full shadow-md ${
              foodType === 'apple' ? 'bg-red-500' : 
              foodType === 'cherry' ? 'bg-red-600' : 'bg-purple-500'
            }`}
          >
            <div className="w-1 h-2 bg-red-800 rounded-sm absolute -top-1 right-1.5 transform rotate-12"/>
          </div>
        </motion.div>
      );
    }
    
    // Snake segment
    const segmentType = getSegmentType(segmentIndex, snake.length);
    const segmentDirection = segmentType === 'body' ? getSegmentDirection(segmentIndex, snake) : '';
    
    // Different styling for head, body, and tail
    const getSegmentClass = () => {
      const baseClass = "w-5 h-5 flex items-center justify-center";
      
      if (segmentType === 'head') {
        return `${baseClass} ${getHeadRotation()}`;
      }
      
      // Apply different styles based on where in the snake this segment is - red color theme
      const colorClass = 
        segmentIndex < snake.length * 0.3 ? "bg-red-400" :
        segmentIndex < snake.length * 0.6 ? "bg-red-500" : "bg-red-600";
        
      if (segmentType === 'tail') {
        return `${baseClass} ${colorClass} rounded-full scale-75`;
      }
      
      // Body segments with directional styles
      const directionClass = 
        segmentDirection === 'horizontal' ? "w-5 h-3.5 rounded-full" :
        segmentDirection === 'vertical' ? "w-3.5 h-5 rounded-full" :
        segmentDirection.startsWith('curve') ? "w-4 h-4 rounded-full" : "w-4 h-4 rounded-full";
        
      return `${baseClass} ${colorClass} ${directionClass}`;
    };
    
    return (
      <div key={`snake-${x}-${y}`} className="w-5 h-5 flex items-center justify-center">
        <motion.div 
          className={getSegmentClass()}
          initial={{ scale: segmentType === 'head' ? 1 : 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.1 }}
        >
          {segmentType === 'head' && (
            <>
              <div className="relative w-4.5 h-4.5 bg-red-400 rounded-full">
                <div className="absolute top-1 left-2.5 w-1 h-1 bg-black rounded-full" />
                <div className="absolute top-1 right-2.5 w-1 h-1 bg-black rounded-full" />
              </div>
            </>
          )}
        </motion.div>
      </div>
    );
  };

  const renderGrid = () => {
    const grid = [];
    
    for (let y = 0; y < GRID_SIZE; y++) {
      const row = [];
      for (let x = 0; x < GRID_SIZE; x++) {
        row.push(renderCell(x, y));
      }
      grid.push(
        <div key={y} className="flex">
          {row}
        </div>
      );
    }
    
    return grid;
  };

  const renderControls = () => {
    return (
      <div className="mt-6 grid grid-cols-3 gap-2 max-w-[180px] mx-auto">
        <div></div>
        <button 
          onClick={() => nextDirection !== 'DOWN' && setNextDirection('UP')}
          className="bg-dark-lighter/80 text-white p-3 rounded-full hover:bg-red-500 transition-colors shadow-lg"
          disabled={gameState !== 'PLAYING'}
        >
          ↑
        </button>
        <div></div>
        
        <button 
          onClick={() => nextDirection !== 'RIGHT' && setNextDirection('LEFT')}
          className="bg-dark-lighter/80 text-white p-3 rounded-full hover:bg-red-500 transition-colors shadow-lg"
          disabled={gameState !== 'PLAYING'}
        >
          ←
        </button>
        <button
          onClick={() => setShowOverlay(prev => !prev)}
          className="bg-dark-lighter/80 text-white p-2 rounded-full hover:bg-primary-dark transition-colors text-xs"
          disabled={gameState !== 'PLAYING'}
        >
          {showOverlay ? '▶' : '⏸'}
        </button>
        <button 
          onClick={() => nextDirection !== 'LEFT' && setNextDirection('RIGHT')}
          className="bg-dark-lighter/80 text-white p-3 rounded-full hover:bg-red-500 transition-colors shadow-lg"
          disabled={gameState !== 'PLAYING'}
        >
          →
        </button>
        
        <div></div>
        <button 
          onClick={() => nextDirection !== 'UP' && setNextDirection('DOWN')}
          className="bg-dark-lighter/80 text-white p-3 rounded-full hover:bg-red-500 transition-colors shadow-lg"
          disabled={gameState !== 'PLAYING'}
        >
          ↓
        </button>
        <div></div>
      </div>
    );
  };

  // Function to toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      gameContainerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  return (
    <div ref={gameContainerRef} className={`flex justify-center items-center min-h-screen bg-dark bg-[url('/subtle-pattern.png')] bg-repeat ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      <div className="game-container max-w-4xl p-6 w-full">
        <motion.h1 
          className="text-3xl md:text-4xl font-gaming font-bold text-center mb-8"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <span className="bg-gradient-to-r from-red-400 to-red-600 text-transparent bg-clip-text">
            Snake Game
          </span>
        </motion.h1>
        
        <div className="flex flex-col items-center justify-center">
          {/* Game panel with centered board */}
          <div className="flex flex-col items-center mb-4 w-full">
            <div className="w-full max-w-md flex justify-between items-center mb-4">
              <div className="flex flex-col">
                <div className="text-xl font-medium text-gray-300">
                  Score: <span className="text-red-400 font-bold">{score}</span>
                </div>
                <div className="text-xs text-gray-400">
                  Speed: <span className="text-red-300 font-bold">
                    {(() => {
                      // Calculate current speed percentage based on the new formula
                      const snakeLength = snake.length - 1;
                      let speedMultiplier = 1;
                      if (snakeLength > 5) speedMultiplier = 1.2;
                      if (snakeLength > 10) speedMultiplier = 1.5;
                      if (snakeLength > 15) speedMultiplier = 1.8;
                      if (snakeLength > 20) speedMultiplier = 2.0;
                      
                      const currentSpeed = Math.max(
                        MIN_SPEED, 
                        BASE_SPEED - ((snakeLength * SPEED_FACTOR) * speedMultiplier)
                      );
                      
                      // Convert to percentage (0-100%)
                      // BASE_SPEED is the slowest (0%), MIN_SPEED is the fastest (100%)
                      const speedPercentage = Math.round(
                        ((BASE_SPEED - currentSpeed) / (BASE_SPEED - MIN_SPEED)) * 100
                      );
                      
                      return `${speedPercentage}%`;
                    })()}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={toggleFullscreen}
                  className="p-2 rounded-full bg-dark-lighter/80 hover:bg-red-500 text-white transition-colors shadow-lg"
                  title="Toggle fullscreen"
                >
                  {isFullscreen ? '⤓' : '⤢'}
                </button>
                
                {gameState !== 'PLAYING' ? (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-colors"
                    onClick={startGame}
                  >
                    {gameState === 'READY' ? 'Start Game' : 'Play Again'}
                  </motion.button>
                ) : (
                  <div className="text-xl font-medium text-gray-300">
                    Best: <span className="text-red-400 font-bold">{highScore}</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Game board with stylish border */}
            <div className="relative">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="border-2 border-dark-lighter bg-dark-lighter/30 p-1 rounded-lg shadow-2xl overflow-hidden"
                style={{ 
                  boxShadow: '0 0 20px rgba(239, 68, 68, 0.2), inset 0 0 5px rgba(0, 0, 0, 0.2)',
                  backdropFilter: 'blur(10px)'
                }}
              >
                {renderGrid()}
              </motion.div>
              
              {/* Overlay for game states */}
              <AnimatePresence>
                {(gameState === 'READY' || gameState === 'GAME_OVER' || showOverlay) && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center rounded-lg"
                  >
                    {gameState === 'READY' && (
                      <div className="text-center p-4">
                        <h3 className="text-2xl font-bold text-red-400 mb-2">Ready to Play?</h3>
                        <p className="text-gray-300 mb-4">Control the snake with arrow keys or buttons</p>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg"
                          onClick={startGame}
                        >
                          Start Game
                        </motion.button>
                      </div>
                    )}
                    
                    {gameState === 'GAME_OVER' && (
                      <motion.div
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        className="text-center p-4"
                      >
                        <h3 className="text-2xl font-bold text-red-500 mb-2">Game Over!</h3>
                        <p className="text-gray-300 mb-1">
                          Final Score: <span className="text-green-400 font-bold">{score}</span>
                        </p>
                        {score > 0 && score >= highScore && currentUser && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="text-yellow-400 font-bold mb-4"
                          >
                            New High Score! 🏆
                          </motion.div>
                        )}
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="mt-3 px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg"
                          onClick={startGame}
                        >
                          Play Again
                        </motion.button>
                      </motion.div>
                    )}
                    
                    {gameState === 'PLAYING' && showOverlay && (
                      <div className="text-center p-4">
                        <h3 className="text-2xl font-bold text-yellow-400 mb-2">Paused</h3>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="mt-2 px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg"
                          onClick={() => setShowOverlay(false)}
                        >
                          Resume
                        </motion.button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {/* Controls */}
            {renderControls()}
          </div>
          
          {/* Info panel */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-lg">
            {currentUser && (
              <div className="bg-dark-lighter/60 p-4 rounded-lg backdrop-blur shadow-lg">
                <h3 className="text-xl text-red-400 mb-3 border-b border-gray-700 pb-2">Player Stats</h3>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-gray-400">High Score</p>
                    <p className="text-2xl text-red-400">{highScore}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Games Played</p>
                    <p className="text-2xl text-red-300">{gamesPlayed}</p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="bg-dark-lighter/60 p-4 rounded-lg backdrop-blur shadow-lg">
              <h3 className="text-xl text-red-400 mb-3 border-b border-gray-700 pb-2">How To Play</h3>
              <ul className="list-disc list-inside text-gray-300 space-y-2">
                <li>Use arrow keys or buttons to navigate</li>
                <li>Collect food to grow longer</li>
                <li>Avoid walls and your own tail</li>
                <li>Press space or the pause button to pause</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Snake; 