import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { doc, updateDoc, getDoc, increment } from 'firebase/firestore';
import { db } from '../../firebase/config';

// Types
type TetrominoType = 'I' | 'J' | 'L' | 'O' | 'S' | 'T' | 'Z';
type CellColor = string | null;
type GameState = 'READY' | 'PLAYING' | 'PAUSED' | 'GAME_OVER';

interface Tetromino {
  shape: number[][];
  color: string;
  type: TetrominoType;
}

interface GameStats {
  score: number;
  level: number;
  lines: number;
  highScore: number;
}

interface PlayerPosition {
  x: number;
  y: number;
}

// Constants
const ROWS = 20;
const COLS = 10;
const POINTS_PER_LINE = [0, 40, 100, 300, 1200]; // 0, 1, 2, 3, 4 lines

// Define tetromino shapes and colors
const TETROMINOES: Record<TetrominoType, Tetromino> = {
  I: {
    shape: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ],
    color: '#00f0f0', // Cyan
    type: 'I'
  },
  J: {
    shape: [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0]
    ],
    color: '#0000f0', // Blue
    type: 'J'
  },
  L: {
    shape: [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0]
    ],
    color: '#f0a000', // Orange
    type: 'L'
  },
  O: {
    shape: [
      [1, 1],
      [1, 1]
    ],
    color: '#f0f000', // Yellow
    type: 'O'
  },
  S: {
    shape: [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0]
    ],
    color: '#00f000', // Green
    type: 'S'
  },
  T: {
    shape: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0]
    ],
    color: '#a000f0', // Purple
    type: 'T'
  },
  Z: {
    shape: [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0]
    ],
    color: '#f00000', // Red
    type: 'Z'
  }
};

// Helper functions
const createEmptyBoard = (): (CellColor)[][] => {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
};

const randomTetromino = (): Tetromino => {
  const tetrominoTypes: TetrominoType[] = Object.keys(TETROMINOES) as TetrominoType[];
  const randType = tetrominoTypes[Math.floor(Math.random() * tetrominoTypes.length)];
  return TETROMINOES[randType];
};

const Tetris = () => {
  // Game state
  const [gameState, setGameState] = useState<GameState>('READY');
  const [board, setBoard] = useState<CellColor[][]>(createEmptyBoard());
  const [currentTetromino, setCurrentTetromino] = useState<Tetromino>(randomTetromino());
  const [nextTetromino, setNextTetromino] = useState<Tetromino>(randomTetromino());
  const [position, setPosition] = useState<PlayerPosition>({ x: COLS / 2 - 2, y: 0 });
  const [stats, setStats] = useState<GameStats>({ score: 0, level: 1, lines: 0, highScore: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  
  // Refs
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const dropSpeedRef = useRef<number>(1000); // Starting drop speed (ms)
  
  // Auth
  const { currentUser } = useAuth();
  
  // Calculate drop speed based on level and difficulty
  const getDropSpeed = useCallback((level: number): number => {
    // Base speed for different difficulties (milliseconds between drops)
    const baseSpeed = {
      easy: 1200,     // Slower
      medium: 1000,    // Normal
      hard: 800       // Faster
    };

    // Speed reduction per level (smaller number = more gradual progression)
    const speedReduction = {
      easy: 40,       // Small reduction
      medium: 60,     // Medium reduction
      hard: 80        // Larger reduction
    };

    // Calculate drop speed with a minimum cap
    const minSpeed = {
      easy: 400,      // Slowest it can get on easy
      medium: 200,    // Slowest it can get on medium
      hard: 100       // Slowest it can get on hard
    };

    return Math.max(minSpeed[difficulty], baseSpeed[difficulty] - ((level - 1) * speedReduction[difficulty]));
  }, [difficulty]);
  
  // Load user stats
  useEffect(() => {
    if (currentUser) {
      loadUserStats();
    }
  }, [currentUser]);
  
  // Update drop speed when level or difficulty changes
  useEffect(() => {
    dropSpeedRef.current = getDropSpeed(stats.level);
  }, [stats.level, difficulty, getDropSpeed]);
  
  const loadUserStats = async () => {
    if (!currentUser) return;
    
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.games && userData.games.tetris) {
          setStats(prev => ({
            ...prev,
            highScore: userData.games.tetris.highScore || 0
          }));
        }
      }
    } catch (error) {
      console.error('Error loading user stats:', error);
    }
  };
  
  // Save user stats
  const saveUserStats = async () => {
    if (!currentUser) return;
    
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      
      if (stats.score > stats.highScore) {
        await updateDoc(userRef, {
          'games.tetris.highScore': stats.score
        });
      }
      
      await updateDoc(userRef, {
        'games.tetris.gamesPlayed': increment(1)
      });
    } catch (error) {
      console.error('Error saving user stats:', error);
    }
  };
  
  // Check for collision
  const checkCollision = useCallback((tetromino: Tetromino, pos: PlayerPosition): boolean => {
    for (let y = 0; y < tetromino.shape.length; y++) {
      for (let x = 0; x < tetromino.shape[y].length; x++) {
        // Skip empty squares
        if (!tetromino.shape[y][x]) continue;
        
        // Calculate actual position on board
        const boardX = pos.x + x;
        const boardY = pos.y + y;
        
        // Check boundaries
        if (
          boardX < 0 || 
          boardX >= COLS || 
          boardY >= ROWS || 
          // Check collision with existing blocks
          (boardY >= 0 && board[boardY][boardX])
        ) {
          return true;
        }
      }
    }
    return false;
  }, [board]);
  
  // Update board with current tetromino position
  const updateBoardWithTetromino = useCallback((): CellColor[][] => {
    // Create a deep copy of the current board to avoid mutation issues
    const newBoard: CellColor[][] = board.map(row => [...row]);
    
    // Add current tetromino
    for (let y = 0; y < currentTetromino.shape.length; y++) {
      for (let x = 0; x < currentTetromino.shape[y].length; x++) {
        if (currentTetromino.shape[y][x]) {
          const boardY = position.y + y;
          const boardX = position.x + x;
          if (boardY >= 0 && boardY < ROWS && boardX >= 0 && boardX < COLS) {
            newBoard[boardY][boardX] = currentTetromino.color;
          }
        }
      }
    }
    
    return newBoard;
  }, [board, currentTetromino, position]);
  
  // Handle movement
  const movePlayer = useCallback((dir: number) => {
    if (gameState !== 'PLAYING') return;
    
    const newPos = { ...position, x: position.x + dir };
    if (!checkCollision(currentTetromino, newPos)) {
      setPosition(newPos);
    }
  }, [gameState, position, currentTetromino, checkCollision]);
  
  // Handle rotation
  const rotateMatrix = (matrix: number[][]): number[][] => {
    const rotated = [];
    for (let i = 0; i < matrix[0].length; i++) {
      const row = [];
      for (let j = matrix.length - 1; j >= 0; j--) {
        row.push(matrix[j][i]);
      }
      rotated.push(row);
    }
    return rotated;
  };
  
  const rotate = useCallback(() => {
    if (gameState !== 'PLAYING') return;
    
    // Clone the tetromino to avoid mutation
    const newTetromino = {
      ...currentTetromino,
      shape: rotateMatrix(currentTetromino.shape)
    };
    
    // Ensure the rotation doesn't cause a collision
    const wallKickOffset = checkWallKick(newTetromino);
    if (wallKickOffset !== null) {
      const newPos = { ...position, x: position.x + wallKickOffset };
      if (!checkCollision(newTetromino, newPos)) {
        setCurrentTetromino(newTetromino);
        setPosition(newPos);
      }
    } else if (!checkCollision(newTetromino, position)) {
      setCurrentTetromino(newTetromino);
    }
  }, [gameState, currentTetromino, position, checkCollision]);
  
  // Wall kick logic
  const checkWallKick = useCallback((tetromino: Tetromino): number | null => {
    // Try no offset
    if (!checkCollision(tetromino, position)) return 0;
    
    // Try offsets
    for (let offset of [-1, 1, -2, 2]) {
      const newPos = { ...position, x: position.x + offset };
      if (!checkCollision(tetromino, newPos)) {
        return offset;
      }
    }
    
    return null;
  }, [position, checkCollision]);
  
  // Handle drop
  const drop = useCallback(() => {
    if (gameState !== 'PLAYING') return;
    
    const newPos = { ...position, y: position.y + 1 };
    
    if (!checkCollision(currentTetromino, newPos)) {
      setPosition(newPos);
    } else {
      // Tetromino has landed
      // 1. Check if game over
      if (position.y < 1) {
        gameOver();
        return;
      }
      
      // 2. Merge tetromino with board
      const mergedBoard = board.map(row => [...row]);
      for (let y = 0; y < currentTetromino.shape.length; y++) {
        for (let x = 0; x < currentTetromino.shape[y].length; x++) {
          if (currentTetromino.shape[y][x]) {
            const boardY = position.y + y;
            const boardX = position.x + x;
            if (boardY >= 0) {
              mergedBoard[boardY][boardX] = currentTetromino.color;
            }
          }
        }
      }
      setBoard(mergedBoard);
      
      // 3. Check for line clears
      const { clearedBoard, linesCleared } = clearLines(mergedBoard);
      setBoard(clearedBoard);
      
      // 4. Update score
      const pointsEarned = POINTS_PER_LINE[linesCleared] * stats.level;
      const newLines = stats.lines + linesCleared;
      const newLevel = Math.floor(newLines / 10) + 1;
      
      setStats(prev => ({
        ...prev,
        score: prev.score + pointsEarned,
        lines: newLines,
        level: newLevel,
        highScore: Math.max(prev.highScore, prev.score + pointsEarned)
      }));
      
      // 5. Update drop speed based on level - now handled by useEffect
      
      // 6. Set next tetromino
      setCurrentTetromino(nextTetromino);
      setNextTetromino(randomTetromino());
      setPosition({ x: COLS / 2 - 2, y: 0 });
    }
  }, [gameState, position, currentTetromino, checkCollision, board, nextTetromino, stats]);
  
  // Handle instant drop
  const hardDrop = useCallback(() => {
    if (gameState !== 'PLAYING') return;
    
    let newY = position.y;
    
    while (!checkCollision(currentTetromino, { ...position, y: newY + 1 })) {
      newY += 1;
    }
    
    setPosition({ ...position, y: newY });
    drop();
  }, [gameState, position, currentTetromino, checkCollision, drop]);
  
  // Clear completed lines
  const clearLines = (board: CellColor[][]): { clearedBoard: CellColor[][], linesCleared: number } => {
    let linesCleared = 0;
    const newBoard = board.filter(row => {
      const isLineFull = row.every(cell => cell !== null);
      if (isLineFull) {
        linesCleared++;
        return false;
      }
      return true;
    });
    
    // Add empty lines at the top
    const emptyLines = Array.from({ length: linesCleared }, () => Array(COLS).fill(null));
    const clearedBoard = [...emptyLines, ...newBoard];
    
    return { clearedBoard, linesCleared };
  };
  
  // Game controls
  useEffect(() => {
    if (gameState !== 'PLAYING') return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'PLAYING') return;
      
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          movePlayer(-1);
          break;
        case 'ArrowRight':
          e.preventDefault();
          movePlayer(1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          drop();
          break;
        case 'ArrowUp':
          e.preventDefault();
          rotate();
          break;
        case ' ':
          e.preventDefault();
          hardDrop();
          break;
        case 'p':
        case 'P':
          e.preventDefault();
          togglePause();
          break;
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [gameState, movePlayer, drop, rotate, hardDrop]);
  
  // Game loop
  useEffect(() => {
    if (gameState !== 'PLAYING') return;
    
    // Fixed timing for game loop to prevent timing issues
    let dropCounter = 0;
    let lastFrameTime = 0;
    let frameId: number;
    
    const gameLoop = (timestamp: number) => {
      if (gameState !== 'PLAYING') return;
      
      // Calculate elapsed time since last frame
      const deltaTime = lastFrameTime === 0 ? 0 : timestamp - lastFrameTime;
      lastFrameTime = timestamp;
      
      // Increment drop counter by elapsed time
      dropCounter += deltaTime;
      
      // Only drop when enough time has passed
      if (dropCounter > dropSpeedRef.current) {
        drop();
        dropCounter = 0;
      }
      
      // Request next frame
      frameId = requestAnimationFrame(gameLoop);
    };
    
    // Start the game loop
    frameId = requestAnimationFrame(gameLoop);
    
    // Cleanup function
    return () => {
      if (frameId) {
        cancelAnimationFrame(frameId);
      }
    };
  }, [gameState, drop]);
  
  // Start game
  const startGame = () => {
    // Reset game state
    setBoard(createEmptyBoard());
    setCurrentTetromino(randomTetromino());
    setNextTetromino(randomTetromino());
    setPosition({ x: COLS / 2 - 2, y: 0 });
    setStats(prev => ({ ...prev, score: 0, level: 1, lines: 0 }));
    
    // Set initial drop speed based on difficulty
    dropSpeedRef.current = getDropSpeed(1);
    setGameState('PLAYING');
  };
  
  // Toggle pause
  const togglePause = () => {
    if (gameState === 'PLAYING') {
      setGameState('PAUSED');
    } else if (gameState === 'PAUSED') {
      setGameState('PLAYING');
    }
  };
  
  // Game over
  const gameOver = () => {
    setGameState('GAME_OVER');
    saveUserStats();
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

  // Get display board (including ghost piece)
  const getDisplayBoard = useCallback(() => {
    const boardWithTetromino = updateBoardWithTetromino();

    // Add ghost piece
    if (gameState === 'PLAYING') {
      let ghostY = position.y;
      
      // Find the lowest valid position for the ghost
      while (!checkCollision(currentTetromino, { ...position, y: ghostY + 1 })) {
        ghostY += 1;
      }
      
      // Only add ghost if it's different from the actual piece
      if (ghostY !== position.y) {
        for (let y = 0; y < currentTetromino.shape.length; y++) {
          for (let x = 0; x < currentTetromino.shape[y].length; x++) {
            if (currentTetromino.shape[y][x]) {
              const boardY = ghostY + y;
              const boardX = position.x + x;
              if (boardY >= 0 && boardY < ROWS && boardX >= 0 && boardX < COLS) {
                // Don't overwrite the actual tetromino
                if (boardY < position.y || boardY >= position.y + currentTetromino.shape.length ||
                    boardX < position.x || boardX >= position.x + currentTetromino.shape[0].length ||
                    !currentTetromino.shape[boardY - position.y][boardX - position.x]) {
                  boardWithTetromino[boardY][boardX] = 'ghost';
                }
              }
            }
          }
        }
      }
    }
    
    return boardWithTetromino;
  }, [gameState, position, currentTetromino, updateBoardWithTetromino, checkCollision]);
  
  // Render next tetromino preview
  const renderNextTetrominoPiece = () => {
    return (
      <div className="grid grid-cols-4 grid-rows-4 h-16 w-16 mx-auto">
        {Array.from({ length: 4 }, (_, i) => (
          Array.from({ length: 4 }, (_, j) => {
            const isFilled = nextTetromino.shape[i]?.[j] === 1;
            return (
              <div 
                key={`next-${i}-${j}`} 
                className={`border border-gray-800 ${isFilled ? 'border-gray-600' : 'border-transparent'}`}
                style={{
                  backgroundColor: isFilled ? nextTetromino.color : 'transparent',
                  boxShadow: isFilled ? 'inset 0 0 5px rgba(255,255,255,0.5)' : 'none'
                }}
              />
            );
          })
        )).flat()}
      </div>
    );
  };
  
  // Render the instructions modal
  const renderInstructions = () => {
    return (
      <div className="bg-gray-800/80 p-4 rounded-lg text-gray-300 backdrop-blur-sm">
        <h3 className="text-lg font-bold text-center mb-4">Controls</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>Arrow Left:</div>
          <div>Move Left</div>
          <div>Arrow Right:</div>
          <div>Move Right</div>
          <div>Arrow Down:</div>
          <div>Move Down</div>
          <div>Arrow Up:</div>
          <div>Rotate</div>
          <div>Spacebar:</div>
          <div>Hard Drop</div>
          <div>P:</div>
          <div>Pause</div>
        </div>
      </div>
    );
  };
  
  return (
    <div 
      ref={gameContainerRef} 
      className={`min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 to-indigo-900 p-4 ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}
    >
      <div className="w-full max-w-4xl">
        <motion.h1 
          className="text-3xl md:text-4xl font-bold text-center mb-4"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <span className="bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text">
            Tetris
          </span>
        </motion.h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Game info sidebar - mobile (top) */}
          <div className="md:hidden bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 shadow-xl border border-indigo-500/20">
            <div className="flex justify-between mb-4">
              <div className="text-center">
                <p className="text-sm text-gray-400">Score</p>
                <p className="text-2xl font-bold text-white">{stats.score}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-400">Level</p>
                <p className="text-2xl font-bold text-white">{stats.level}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-400">Lines</p>
                <p className="text-2xl font-bold text-white">{stats.lines}</p>
              </div>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-400 mb-1">Next Piece</p>
              <div className="bg-gray-900/50 rounded-lg p-2">
                {renderNextTetrominoPiece()}
              </div>
            </div>

            {/* Difficulty selector - mobile */}
            {gameState === 'READY' && (
              <div className="mb-4">
                <p className="text-sm text-gray-400 mb-1">Difficulty</p>
                <div className="flex space-x-2">
                  {(['easy', 'medium', 'hard'] as const).map((d) => (
                    <button
                      key={d}
                      onClick={() => setDifficulty(d)}
                      className={`flex-1 px-2 py-1 rounded-md text-sm ${
                        difficulty === d
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-700 text-gray-300'
                      }`}
                    >
                      {d.charAt(0).toUpperCase() + d.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex justify-between gap-2">
              <button
                onClick={toggleFullscreen}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg transition-colors"
              >
                {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              </button>
              
              {gameState === 'PLAYING' && (
                <button
                  onClick={togglePause}
                  className="flex-1 bg-amber-600 hover:bg-amber-700 text-white py-2 px-4 rounded-lg transition-colors"
                >
                  Pause
                </button>
              )}
            </div>
          </div>
          
          {/* Game info sidebar - desktop (left) */}
          <div className="hidden md:flex md:flex-col bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 shadow-xl border border-indigo-500/20">
            <div className="flex flex-col space-y-6">
              <div>
                <p className="text-sm text-gray-400 mb-1">Score</p>
                <p className="text-2xl font-bold text-white">{stats.score}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-400 mb-1">High Score</p>
                <p className="text-xl font-bold text-white">{stats.highScore}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-400 mb-1">Level</p>
                <p className="text-2xl font-bold text-white">{stats.level}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-400 mb-1">Lines</p>
                <p className="text-xl font-bold text-white">{stats.lines}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-400 mb-1">Next Piece</p>
                <div className="bg-gray-900/50 rounded-lg p-2">
                  {renderNextTetrominoPiece()}
                </div>
              </div>

              {/* Difficulty selector - desktop */}
              {gameState === 'READY' && (
                <div>
                  <p className="text-sm text-gray-400 mb-1">Difficulty</p>
                  <div className="flex flex-col space-y-2">
                    {(['easy', 'medium', 'hard'] as const).map((d) => (
                      <button
                        key={d}
                        onClick={() => setDifficulty(d)}
                        className={`px-3 py-2 rounded-md ${
                          difficulty === d
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        {d.charAt(0).toUpperCase() + d.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex flex-col gap-2 mt-4">
                <button
                  onClick={toggleFullscreen}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg transition-colors"
                >
                  {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                </button>
                
                {gameState === 'PLAYING' && (
                  <button
                    onClick={togglePause}
                    className="bg-amber-600 hover:bg-amber-700 text-white py-2 px-4 rounded-lg transition-colors"
                  >
                    Pause
                  </button>
                )}
              </div>
            </div>
            
            <div className="mt-auto">
              {renderInstructions()}
            </div>
          </div>
          
          {/* Game board */}
          <div className="md:col-span-2 bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 shadow-xl border border-indigo-500/20">
            <div className="relative">
              {/* Game board container */}
              <div className="mx-auto rounded-lg overflow-hidden border-2 border-gray-700 bg-gray-900 aspect-[1/2] max-h-[600px]">
                <div className="h-full grid grid-rows-[repeat(20,minmax(0,1fr))]">
                  {getDisplayBoard().map((row, y) => (
                    <div key={y} className="grid grid-cols-[repeat(10,minmax(0,1fr))]">
                      {row.map((cell, x) => (
                        <div
                          key={`${y}-${x}`}
                          className={`border border-gray-800/50 ${cell === 'ghost' ? 'border-gray-600' : ''}`}
                          style={{
                            backgroundColor: cell === 'ghost' ? 'rgba(255,255,255,0.15)' : cell || 'transparent',
                            boxShadow: cell && cell !== 'ghost' ? 'inset 0 0 5px rgba(255,255,255,0.5)' : 'none'
                          }}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Mobile controls */}
              <div className="md:hidden mt-4">
                <div className="grid grid-cols-3 gap-2">
                  <button
                    className="bg-indigo-600/70 text-white p-4 rounded-lg active:bg-indigo-700"
                    onClick={() => movePlayer(-1)}
                  >
                    <span className="transform rotate-180">➡</span>
                  </button>
                  <button
                    className="bg-indigo-600/70 text-white p-4 rounded-lg active:bg-indigo-700"
                    onClick={drop}
                  >
                    ⬇
                  </button>
                  <button
                    className="bg-indigo-600/70 text-white p-4 rounded-lg active:bg-indigo-700"
                    onClick={() => movePlayer(1)}
                  >
                    ➡
                  </button>
                  <button
                    className="bg-indigo-600/70 text-white p-4 rounded-lg active:bg-indigo-700"
                    onClick={rotate}
                  >
                    🔄
                  </button>
                  <button
                    className="bg-purple-600/70 text-white p-4 rounded-lg active:bg-purple-700 col-span-2"
                    onClick={hardDrop}
                  >
                    Hard Drop
                  </button>
                </div>
              </div>
              
              {/* Overlays */}
              <AnimatePresence>
                {gameState === 'READY' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/80 backdrop-blur-sm rounded-lg"
                  >
                    <motion.div
                      initial={{ scale: 0.9 }}
                      animate={{ scale: 1 }}
                      className="text-center p-6"
                    >
                      <h2 className="text-2xl font-bold text-white mb-4">Ready to Play?</h2>
                      <p className="text-gray-300 mb-6">
                        Arrange falling blocks to create complete lines and score points!
                      </p>
                      <p className="text-gray-400 mb-2">Select difficulty above</p>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={startGame}
                        className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-8 py-3 rounded-lg font-medium shadow-lg"
                      >
                        Start Game
                      </motion.button>
                    </motion.div>
                  </motion.div>
                )}
                
                {gameState === 'PAUSED' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex items-center justify-center bg-gray-900/80 backdrop-blur-sm rounded-lg"
                  >
                    <div className="text-center p-6">
                      <h2 className="text-2xl font-bold text-white mb-4">Game Paused</h2>
                      <button
                        onClick={togglePause}
                        className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-6 py-2 rounded-lg font-medium shadow-lg"
                      >
                        Resume
                      </button>
                    </div>
                  </motion.div>
                )}
                
                {gameState === 'GAME_OVER' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex items-center justify-center bg-gray-900/80 backdrop-blur-sm rounded-lg"
                  >
                    <motion.div
                      initial={{ scale: 0.9 }}
                      animate={{ scale: 1 }}
                      className="text-center p-6 bg-gray-800/90 rounded-xl shadow-xl max-w-xs mx-auto"
                    >
                      <h2 className="text-2xl font-bold text-white mb-2">Game Over</h2>
                      <div className="mb-4">
                        <p className="text-gray-400">Score</p>
                        <p className="text-3xl font-bold text-white mb-2">{stats.score}</p>
                        
                        {stats.score === stats.highScore && stats.score > 0 && (
                          <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-gray-900 font-bold py-1 px-3 rounded-lg mb-4 inline-block">
                            New High Score!
                          </div>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-x-6 gap-y-2 mb-6 text-center">
                        <div>
                          <p className="text-gray-400 text-sm">Level</p>
                          <p className="text-lg font-bold text-white">{stats.level}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm">Lines</p>
                          <p className="text-lg font-bold text-white">{stats.lines}</p>
                        </div>
                      </div>
                      
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={startGame}
                        className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-6 py-2 rounded-lg font-medium shadow-lg"
                      >
                        Play Again
                      </motion.button>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          
          {/* Mobile instructions */}
          <div className="md:hidden mt-2">
            {renderInstructions()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tetris; 