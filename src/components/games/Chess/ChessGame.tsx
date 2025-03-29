import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { db, auth } from '../../../services/firebase';
import { doc, setDoc, getDoc, updateDoc, onSnapshot, arrayUnion, serverTimestamp, deleteDoc } from 'firebase/firestore';
import {
  ChessColor, ChessLobby, ChessGame as IChessGame, ChessBoard, ChessPiece, ChessMove
} from './Chess';
import ChessLogic from './ChessLogic';
import { generateRandomId } from '../../../utils/helpers';
import toast from 'react-hot-toast';

// Initial chess board setup
const initialBoard: ChessBoard = [
  [
    { type: 'rook', color: 'black' },
    { type: 'knight', color: 'black' },
    { type: 'bishop', color: 'black' },
    { type: 'queen', color: 'black' },
    { type: 'king', color: 'black' },
    { type: 'bishop', color: 'black' },
    { type: 'knight', color: 'black' },
    { type: 'rook', color: 'black' }
  ],
  [
    { type: 'pawn', color: 'black' },
    { type: 'pawn', color: 'black' },
    { type: 'pawn', color: 'black' },
    { type: 'pawn', color: 'black' },
    { type: 'pawn', color: 'black' },
    { type: 'pawn', color: 'black' },
    { type: 'pawn', color: 'black' },
    { type: 'pawn', color: 'black' }
  ],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [
    { type: 'pawn', color: 'white' },
    { type: 'pawn', color: 'white' },
    { type: 'pawn', color: 'white' },
    { type: 'pawn', color: 'white' },
    { type: 'pawn', color: 'white' },
    { type: 'pawn', color: 'white' },
    { type: 'pawn', color: 'white' },
    { type: 'pawn', color: 'white' }
  ],
  [
    { type: 'rook', color: 'white' },
    { type: 'knight', color: 'white' },
    { type: 'bishop', color: 'white' },
    { type: 'queen', color: 'white' },
    { type: 'king', color: 'white' },
    { type: 'bishop', color: 'white' },
    { type: 'knight', color: 'white' },
    { type: 'rook', color: 'white' }
  ]
];

interface ChessGameProps {
  onExit: () => void;
}

// Add this interface to represent captured pieces
interface CapturedPieces {
  white: ChessPiece[];
  black: ChessPiece[];
}

const ChessGame: React.FC<ChessGameProps> = ({ onExit }) => {
  const [searchParams] = useSearchParams();
  const userId = auth.currentUser?.uid || 'anonymous';
  
  // Game state
  const [showLobby, setShowLobby] = useState(false);
  const [showWaitingRoom, setShowWaitingRoom] = useState(false);
  const [lobby, setLobby] = useState<ChessLobby | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [selectedColor, setSelectedColor] = useState<ChessColor>('white');
  const [isLoading, setIsLoading] = useState(false);
  const [gameState, setGameState] = useState<IChessGame | null>(null);
  const [selectedPiece, setSelectedPiece] = useState<{row: number, col: number} | null>(null);
  const [validMoves, setValidMoves] = useState<ChessMove[]>([]);
  const [inviteUrl, setInviteUrl] = useState('');
  const [roomIdInput, setRoomIdInput] = useState('');
  const [capturedPieces, setCapturedPieces] = useState<CapturedPieces>({ white: [], black: [] });
  const [turnTimer, setTurnTimer] = useState<number>(15);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [showJoinTab, setShowJoinTab] = useState(false);

  const chessLogic = useRef(new ChessLogic());
  const lobbyUnsubscribe = useRef<(() => void) | null>(null);
  const gameUnsubscribe = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Check if we're joining a game
    const lobbyId = searchParams.get('lobbyId');
    if (lobbyId) {
      joinLobby(lobbyId);
    }

    return () => {
      if (lobbyUnsubscribe.current) {
        lobbyUnsubscribe.current();
      }
      if (gameUnsubscribe.current) {
        gameUnsubscribe.current();
      }
    };
  }, []);

  // Add timer effect
  useEffect(() => {
    if (!gameState || gameState.status !== 'active' || !isTimerRunning) {
      return;
    }
    
    // Get player color
    const playerColor = isHost ? lobby?.hostColor : lobby?.guestColor;
    const isPlayerTurn = gameState.currentTurn === playerColor;
    
    let timerId: NodeJS.Timeout;
    
    if (turnTimer > 0) {
      timerId = setTimeout(() => {
        setTurnTimer(prev => prev - 1);
      }, 1000);
    } else {
      // Time's up - switch turns
      if (isPlayerTurn && gameState.status === 'active') {
        handleTimeExpired();
      }
    }
    
    return () => {
      if (timerId) clearTimeout(timerId);
    };
  }, [turnTimer, isTimerRunning, gameState?.currentTurn, gameState?.status]);
  
  // Start the timer when the turn changes
  useEffect(() => {
    if (gameState?.status === 'active') {
      setTurnTimer(15); // Reset to 15 seconds
      setIsTimerRunning(true);
    } else {
      setIsTimerRunning(false);
    }
  }, [gameState?.currentTurn, gameState?.status]);
  
  // Handle timer expiration
  const handleTimeExpired = async () => {
    if (!gameState || !lobby) return;
    
    const currentColor = gameState.currentTurn;
    const nextColor = currentColor === 'white' ? 'black' : 'white';
    
    toast.error(`Time's up! ${currentColor}'s turn is over.`);
    
    try {
      // Create the update data
      const updateData: any = {
        currentTurn: nextColor,
        lastMoveTime: Date.now(),
        updatedAt: serverTimestamp()
      };
      
      // Update Firestore
      await updateDoc(doc(db, "chessGames", lobby.id), updateData);
      
      // Update local state
      setGameState(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          currentTurn: nextColor
        };
      });
      
      // Play a sound for timer expiration
      const timeoutSound = new Audio('/sounds/chess-timeout.mp3');
      timeoutSound.play().catch(err => console.error('Failed to play sound:', err));
      
    } catch (error) {
      console.error("Error updating turn after timeout:", error);
    }
  };

  const openLobby = () => {
    setShowLobby(true);
  };

  const createLobby = async (isPublic: boolean, allowChat: boolean, timeControl?: { minutes: number, increment: number }) => {
    if (!auth.currentUser) {
      toast.error('Please sign in to create a game');
      return null;
    }
    
    setIsLoading(true);
    
    try {
      // Generate a 6-character room ID
      const lobbyId = generateRandomId(6);
      const hostColor: ChessColor = selectedColor;
      const guestColor: ChessColor = hostColor === 'white' ? 'black' : 'white';
      
      // Create the lobby object
      const lobbyData: any = {
        id: lobbyId,
        hostId: userId,
        hostColor,
        guestColor,
        isPublic,
        allowChat,
        createdAt: serverTimestamp(),
        status: 'waiting',
        moves: []
      };
      
      // Add time control if provided
      if (timeControl) {
        lobbyData.timeControl = timeControl;
      }
      
      // Show loading toast
      const loadingToastId = toast.loading('Creating game...');
      
      // Save to Firestore
      await setDoc(doc(db, 'chessLobbies', lobbyId), lobbyData);
      
      // Update local state with converted timestamp for local use
      const localLobbyData = {
        ...lobbyData,
        createdAt: Date.now() // Use local timestamp for the UI
      };
      setLobby(localLobbyData as ChessLobby);
      setIsHost(true);
      setShowLobby(false);
      setShowWaitingRoom(true);
      
      // Generate invite URL
      const baseUrl = window.location.origin;
      setInviteUrl(`${baseUrl}/games/chess?lobbyId=${lobbyId}`);
      
      // Listen for lobby updates
      listenToLobby(lobbyId);
      
      // Dismiss loading toast and show success
      toast.dismiss(loadingToastId);
      toast.success('Game created successfully!');
      
      return lobbyId;
    } catch (error) {
      console.error('Error creating lobby:', error);
      toast.error('Failed to create game. Please try again.');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const joinLobby = async (lobbyId: string) => {
    setIsLoading(true);
    try {
      const lobbyDoc = await getDoc(doc(db, 'chessLobbies', lobbyId));
      
      if (!lobbyDoc.exists()) {
        console.error('Lobby does not exist');
        return false;
      }
      
      const lobbyData = lobbyDoc.data() as ChessLobby;
      
      if (lobbyData.status !== 'waiting') {
        console.error('Game already started or completed');
        return false;
      }
      
      if (lobbyData.hostId === userId) {
        // User is the host rejoining
        setLobby(lobbyData);
        setIsHost(true);
        setSelectedColor(lobbyData.hostColor);
      } else if (!lobbyData.guestId) {
        // User is joining as guest
        const updatedLobby = {
          ...lobbyData,
          guestId: userId
        };
        
        await updateDoc(doc(db, 'chessLobbies', lobbyId), { guestId: userId });
        
        setLobby(updatedLobby);
        setIsHost(false);
        setSelectedColor(lobbyData.guestColor);
      } else if (lobbyData.guestId === userId) {
        // User is the guest rejoining
        setLobby(lobbyData);
        setIsHost(false);
        setSelectedColor(lobbyData.guestColor);
      } else {
        console.error('Lobby is full');
        return false;
      }
      
      const baseUrl = window.location.origin;
      setInviteUrl(`${baseUrl}/games/chess?lobbyId=${lobbyId}`);
      
      setShowWaitingRoom(true);
      
      // Listen for lobby updates
      listenToLobby(lobbyId);
      return true;
    } catch (error) {
      console.error('Error joining lobby:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const listenToLobby = (lobbyId: string) => {
    if (lobbyUnsubscribe.current) {
      lobbyUnsubscribe.current();
    }
    
    const unsubscribe = onSnapshot(doc(db, 'chessLobbies', lobbyId), (doc) => {
      if (doc.exists()) {
        const lobbyData = doc.data() as ChessLobby;
        setLobby(lobbyData);
        
        // If lobby status changed to 'playing', start the game
        if (lobbyData.status === 'playing' && !gameState) {
          startGame(lobbyData);
        }
      } else {
        console.log('Lobby no longer exists');
        leaveLobby();
      }
    });
    
    lobbyUnsubscribe.current = unsubscribe;
  };

  const leaveLobby = async () => {
    try {
      if (lobby) {
        if (isHost) {
          // Host is leaving, delete the lobby
          await deleteDoc(doc(db, 'chessLobbies', lobby.id))
            .catch(error => {
              console.error('Error deleting lobby:', error);
              toast.error('Failed to leave game. Please try again.');
            });
        } else if (lobby.guestId === userId) {
          // Guest is leaving, update the lobby to remove guest
          await updateDoc(doc(db, 'chessLobbies', lobby.id), { 
            guestId: null 
          });
        }
      }
      
      // Reset local state regardless of any errors
      setLobby(null);
      setIsHost(false);
      setShowLobby(false);
      setShowWaitingRoom(false);
      setInviteUrl('');
      
      // Stop listening to the lobby
      if (lobbyUnsubscribe.current) {
        lobbyUnsubscribe.current();
        lobbyUnsubscribe.current = null;
      }
      
      toast.success('Left the game room');
    } catch (error) {
      console.error('Error leaving lobby:', error);
      toast.error('Error leaving lobby. Some resources may not have been cleaned up.');
      
      // Still reset the UI state even if there was an error
      setLobby(null);
      setShowWaitingRoom(false);
    }
  };



  const startGame = async (lobbyData: ChessLobby) => {
    if (!lobbyData || !lobbyData.id) return;
    
    setIsLoading(true);
    toast.loading('Starting game...', { id: 'starting-game' });
    
    try {
      // Update lobby status to 'playing'
      if (isHost) {
        await updateDoc(doc(db, 'chessLobbies', lobbyData.id), {
          status: 'playing',
          gameStartedAt: serverTimestamp()
        });
      }
      
      // Create the initial game state
      const gameId = lobbyData.id;
      
      // Convert the board to Firestore-friendly format (flattened object)
      const boardForFirestore: Record<string, any> = {};
      
      // Only store non-null pieces to save space
      for (let row = 0; row < initialBoard.length; row++) {
        for (let col = 0; col < initialBoard[row].length; col++) {
          const piece = initialBoard[row][col];
          if (piece) {
            boardForFirestore[`${row}_${col}`] = {
              type: piece.type,
              color: piece.color,
              hasMoved: false
            };
          }
        }
      }
      
      // Initial game data
      const gameData = {
        id: gameId,
        lobbyId: lobbyData.id,
        hostId: lobbyData.hostId,
        guestId: lobbyData.guestId || null,
        currentTurn: 'white',
        board: boardForFirestore, // Use flattened board
        moves: [],
        status: 'active',
        startTime: Date.now(),
        timeControl: lobbyData.timeControl || null,
        hostTimeRemaining: lobbyData.timeControl ? lobbyData.timeControl.minutes * 60 * 1000 : null,
        guestTimeRemaining: lobbyData.timeControl ? lobbyData.timeControl.minutes * 60 * 1000 : null,
        lastMoveTime: Date.now()
      };
      
      // Save to Firestore
      await setDoc(doc(db, 'chessGames', gameId), gameData);
      
      // Start listening for game updates
      listenToGame(gameId);
      
      // Start watching the game
      setShowWaitingRoom(false);
      
      // Create local game state with the 2D board (not the flattened version)
      const localGameState: IChessGame = {
        id: gameId,
        lobbyId: lobbyData.id,
        hostId: lobbyData.hostId,
        guestId: lobbyData.guestId || '',
        currentTurn: 'white',
        board: initialBoard, // Use 2D array board
        moves: [],
        status: 'active',
        startTime: Date.now(),
        timeControl: lobbyData.timeControl,
        hostTimeRemaining: lobbyData.timeControl ? lobbyData.timeControl.minutes * 60 * 1000 : undefined,
        guestTimeRemaining: lobbyData.timeControl ? lobbyData.timeControl.minutes * 60 * 1000 : undefined,
        lastMoveTime: Date.now()
      };
      
      setGameState(localGameState);
      
      // Show success message
      toast.success('Game started!', { id: 'starting-game' });
      
      // Play game start sound
      const gameStartAudio = new Audio('/sounds/Chess-Game-Start.mp3');
      gameStartAudio.play().catch(err => console.error('Failed to play game start sound:', err));
      
    } catch (error) {
      console.error('Error starting game:', error);
      toast.error('Failed to start game. Please try again.', { id: 'starting-game' });
    } finally {
      setIsLoading(false);
    }
  };

  // Add this function to convert the flattened board from Firestore back to a 2D array
  const deserializeBoard = (boardData: Record<string, any>): ChessBoard => {
    // Initialize an empty 8x8 board
    const board: ChessBoard = Array(8).fill(null).map(() => Array(8).fill(null));
    
    // Fill the board with pieces from the flattened format
    for (const key in boardData) {
      const [row, col] = key.split('_').map(Number);
      const piece = boardData[key];
      if (row >= 0 && row < 8 && col >= 0 && col < 8) {
        board[row][col] = piece;
      }
    }
    
    return board;
  };

  // Now modify the function that handles game updates to use this deserializer
  const listenToGame = (gameId: string) => {
    if (gameUnsubscribe.current) {
      gameUnsubscribe.current();
    }
    
    const unsubscribe = onSnapshot(doc(db, 'chessGames', gameId), (doc) => {
      if (doc.exists()) {
        const gameData = doc.data();
        
        // Handle the flattened board structure from Firestore
        let boardFromFirestore: ChessBoard;
        if (gameData.board && typeof gameData.board === 'object' && !Array.isArray(gameData.board)) {
          // Convert the flattened board format back to a 2D array
          boardFromFirestore = deserializeBoard(gameData.board);
        } else {
          // Fallback to initial board if we can't parse the board data
          boardFromFirestore = initialBoard;
        }
        
        // Create the game state object with the deserialized board
        const game: IChessGame = {
          id: gameId,
          lobbyId: lobby?.id || gameId,
          hostId: lobby?.hostId || '',
          guestId: lobby?.guestId || '',
          board: boardFromFirestore,
          currentTurn: gameData.currentTurn || 'white',
          status: gameData.status || 'active',
          moves: gameData.moves || [],
          startTime: gameData.startTime || Date.now(),
          lastMoveTime: gameData.lastMoveTime || Date.now(),
          inCheck: gameData.inCheck,
          winner: gameData.winner,
          lastMoveFrom: gameData.lastMoveFrom,
          lastMoveTo: gameData.lastMoveTo,
          timeControl: gameData.timeControl,
          hostTimeRemaining: gameData.hostTimeRemaining,
          guestTimeRemaining: gameData.guestTimeRemaining,
          chat: gameData.chat || []
        };
        
        setGameState(game);
      } else {
        console.log('Game no longer exists');
        setGameState(null);
      }
    });
    
    gameUnsubscribe.current = unsubscribe;
  };

  const handleSquareClick = (row: number, col: number) => {
    if (!gameState || !lobby) return;
    
    // Determine player's color
    const playerColor = isHost ? lobby.hostColor : lobby.guestColor;
    console.log(`[Chess] Player color: ${playerColor}, Current turn: ${gameState.currentTurn}`);
    
    // Check if it's player's turn
    if (gameState.currentTurn !== playerColor) {
      console.log(`[Chess] Not your turn! Current turn: ${gameState.currentTurn}, Your color: ${playerColor}`);
      toast.error("It's not your turn!");
      return;
    }
    
    const clickedPiece = gameState.board[row][col];
    console.log(`[Chess] Clicked on square [${row},${col}]`);
    console.log(`[Chess] Clicked piece:`, clickedPiece);
    console.log(`[Chess] Currently selected:`, selectedPiece);
    
    // If a piece is already selected
    if (selectedPiece) {
      console.log(`[Chess] Piece already selected at [${selectedPiece.row},${selectedPiece.col}]`);
      
      // Check if clicking on the same piece (deselect)
      if (selectedPiece.row === row && selectedPiece.col === col) {
        console.log(`[Chess] Deselecting piece`);
        setSelectedPiece(null);
        setValidMoves([]);
        return;
      }
      
      // Check if the clicked square is a valid move
      const moveToMake = validMoves.find(
        move => move.to.row === row && move.to.col === col
      );
      
      if (moveToMake) {
        console.log(`[Chess] Making move:`, moveToMake);
        makeMove(moveToMake);
      } else {
        // If clicked on another piece of same color, select that piece instead
        if (clickedPiece && clickedPiece.color === playerColor) {
          console.log(`[Chess] Selecting different piece of same color`);
          selectPiece(row, col);
        } else {
          console.log(`[Chess] Invalid move, deselecting`);
          setSelectedPiece(null);
          setValidMoves([]);
        }
      }
    } else {
      // No piece is selected yet
      
      // Check if clicked on player's piece
      if (clickedPiece && clickedPiece.color === playerColor) {
        console.log(`[Chess] Selecting piece`);
        selectPiece(row, col);
      } else {
        console.log(`[Chess] No valid piece selected`);
      }
    }
  };
  
  const selectPiece = (row: number, col: number) => {
    if (!gameState || !chessLogic.current) return;
    
    // Get valid moves for this piece
    const moves = chessLogic.current.getValidMoves(gameState.board, row, col);
    console.log(`[Chess] Found ${moves.length} valid moves for piece at [${row},${col}]`);
    
    if (moves.length > 0) {
      setSelectedPiece({ row, col });
      setValidMoves(moves);
    } else {
      toast.error('This piece has no valid moves');
      setSelectedPiece(null);
      setValidMoves([]);
    }
  };
  
  const makeMove = async (move: ChessMove) => {
    if (!gameState || !lobby || !chessLogic.current) return;
    
    const piece = gameState.board[move.from.row][move.from.col];
    if (!piece) {
      console.error('[Chess] No piece at the source position');
      toast.error('Invalid move: No piece at the source position');
      return;
    }
    
    console.log(`[Chess] Making move with piece:`, piece);
    
    // Check if valid move again
    const validMoves = chessLogic.current.getValidMoves(gameState.board, move.from.row, move.from.col);
    const isValidMove = validMoves.some(
      validMove => validMove.to.row === move.to.row && validMove.to.col === move.to.col
    );
    
    if (!isValidMove) {
      console.error(`[Chess] Invalid move detected!`);
      toast.error('Invalid move');
      setSelectedPiece(null);
      setValidMoves([]);
      return;
    }
    
    // Check if capturing a piece
    const targetPiece = gameState.board[move.to.row][move.to.col];
    if (targetPiece) {
      console.log(`[Chess] Capturing piece:`, targetPiece);
      
      // Update captured pieces
      setCapturedPieces(prev => {
        const capturingColor = piece.color === 'white' ? 'white' : 'black';
        return {
          ...prev,
          [capturingColor]: [...prev[capturingColor], targetPiece]
        };
      });
    }
    
    // Make the move using chess logic
    const result = chessLogic.current.makeMove(gameState.board, move);
    console.log(`[Chess] Move result:`, result);
    
    if (!result.valid) {
      console.error(`[Chess] Invalid move result: ${result.error}`);
      toast.error(result.error || 'Invalid move');
      return;
    }
    
    // Create algebraic notation for the move
    const notation = chessLogic.current.moveToAlgebraic(move);
    
    // Update board locally before Firestore updates to prevent lag
    const newBoard = result.newBoard;
    const nextTurn = piece.color === 'white' ? 'black' : 'white';
    
    // Determine player's color for messages
    const playerColor = isHost ? lobby.hostColor : lobby.guestColor;
    
    setGameState(prev => {
      if (!prev) return prev;
      
      // Add move to history
      const moveNumber = Math.floor(prev.moves.length / 2) + 1;
      const isWhiteMove = prev.moves.length % 2 === 0;
      const moveText = isWhiteMove ? `${moveNumber}. ${notation}` : `${moveNumber}... ${notation}`;
      
      return {
        ...prev,
        board: newBoard || prev.board, // Fallback to prev.board if newBoard is undefined
        currentTurn: nextTurn,
        moves: [...prev.moves, moveText],
        status: result.isCheckmate ? 'checkmate' : 
                result.isStalemate ? 'stalemate' : 
                result.isDraw ? 'draw' : 'active',
        winner: result.isCheckmate ? piece.color : undefined,
        inCheck: result.inCheck,
        lastMoveFrom: move.from,
        lastMoveTo: move.to
      };
    });
    
    // Convert board to a Firestore-friendly format
    // Instead of using nested arrays, create an object where keys are coordinates
    const boardForFirestore: Record<string, any> = {};
    
    // Only store non-null pieces to save space
    if (newBoard) {
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          const piece = newBoard[row][col];
          if (piece) {
            boardForFirestore[`${row}_${col}`] = {
              type: piece.type,
              color: piece.color,
              hasMoved: piece.hasMoved || false
            };
          }
        }
      }
    }
    
    // Update Firestore
    try {
      // Create a formatted move for the moves array
      const moveNumber = Math.floor(gameState.moves.length / 2) + 1;
      const formattedMove = piece.color === 'white' 
        ? `${moveNumber}. ${notation}` 
        : `${moveNumber}... ${notation}`;
      
      // Build the update object
      const updateData: any = {
        board: boardForFirestore, // Send flattened board
        currentTurn: nextTurn,
        moves: arrayUnion(formattedMove),
        status: result.isCheckmate ? 'checkmate' : 
                result.isStalemate ? 'stalemate' : 
                result.isDraw ? 'draw' : 'active',
        lastMoveFrom: move.from,
        lastMoveTo: move.to,
        updatedAt: serverTimestamp()
      };
      
      // Only add the winner field if there's a checkmate
      if (result.isCheckmate) {
        updateData.winner = piece.color;
      }
      
      // Only add the inCheck field if a player is in check
      if (result.inCheck) {
        updateData.inCheck = result.inCheck;
      }
      
      await updateDoc(doc(db, "chessGames", lobby.id), updateData);
      
      // Clear selection
      setSelectedPiece(null);
      setValidMoves([]);
      
      // Play move sound
      const moveAudio = new Audio('/sounds/chess-move.mp3');
      moveAudio.play().catch(err => console.error('Failed to play sound:', err));
      
      if (result.isCheckmate) {
        // Play victory/defeat sound
        const gameOverAudio = new Audio('/sounds/chess-game-over.mp3');
        gameOverAudio.play().catch(err => console.error('Failed to play sound:', err));
        
        toast.success(`Checkmate! ${piece.color === playerColor ? 'You won!' : 'You lost!'}`);
      } else if (result.isStalemate || result.isDraw) {
        toast.success('Game ended in a draw');
      } else if (result.inCheck) {
        // Play check sound
        const checkAudio = new Audio('/sounds/chess-check.mp3');
        checkAudio.play().catch(err => console.error('Failed to play sound:', err));
        
        toast.error(`${result.inCheck === playerColor ? 'You are' : 'Opponent is'} in check!`);
      }
      
    } catch (error) {
      console.error("Error updating game:", error);
      toast.error("Failed to update game. Please try again.");
    }
  };

  const resignGame = async () => {
    if (!gameState || !lobby) return;
    
    if (window.confirm('Are you sure you want to resign?')) {
      try {
        const playerColor = isHost ? lobby.hostColor : lobby.guestColor;
        const winnerColor = playerColor === 'white' ? 'black' : 'white';
        
        await updateDoc(doc(db, "chessGames", lobby.id), {
          status: 'resigned',
          winner: winnerColor,
          updatedAt: serverTimestamp()
        });
        
        toast.success(`You resigned. ${winnerColor === 'white' ? 'White' : 'Black'} wins.`);
        
        // Play game over sound
        const gameOverAudio = new Audio('/sounds/chess-game-over.mp3');
        gameOverAudio.play().catch(err => console.error('Failed to play sound:', err));
        
        // Update local state
        setGameState(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            status: 'resigned',
            winner: winnerColor
          };
        });
      } catch (error) {
        console.error("Error resigning game:", error);
        toast.error("Failed to resign. Please try again.");
      }
    }
  };

  const renderBoard = () => {
    if (!gameState) return null;
    
    const playerColor = isHost ? lobby?.hostColor : lobby?.guestColor;
    const flipBoard = playerColor === 'black';
    
    let rows = Array.from({ length: 8 }, (_, i) => i);
    let cols = Array.from({ length: 8 }, (_, i) => i);
    
    if (flipBoard) {
      rows = rows.reverse();
      cols = cols.reverse();
    }
    
    // Add board coordinates (letters and numbers)
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];
    
    return (
      <div className="relative flex flex-col md:flex-row w-full max-w-[1200px] mx-auto">
        {/* Captured pieces - black pieces captured by white */}
        <div className="w-full md:w-24 lg:w-32 flex flex-row md:flex-col items-center mb-2 md:mb-0 md:mr-4">
          <div className="bg-gray-800 text-white text-center p-1 md:p-2 mb-0 md:mb-2 rounded w-1/3 md:w-full">
            Captured
          </div>
          <div className="bg-gray-700 rounded p-2 flex flex-wrap justify-center gap-1 min-h-[80px] md:min-h-[250px] w-2/3 md:w-full">
            {capturedPieces.white.map((piece, index) => (
              <div key={`white-captured-${index}`} className="text-2xl md:text-3xl">
                {getPieceSymbol(piece.type)}
              </div>
            ))}
          </div>
        </div>
        
        <div className="grid grid-cols-9 grid-rows-10 gap-0 w-full max-w-full overflow-x-auto border border-gray-900">
          {/* Top coordinates (files) */}
          <div className="bg-gray-800 h-6 md:h-8 border-0 border-r border-b border-gray-900"></div>
          {files.map((file, index) => (
            <div 
              key={`top-${file}`} 
              className="flex items-center justify-center h-6 md:h-8 text-gray-300 text-xs md:text-sm font-medium bg-gray-800 border-0 border-r border-b border-gray-900 p-0"
            >
              {flipBoard ? files[7-index] : file}
            </div>
          ))}
          
          {/* Board with side coordinates */}
          {rows.map((row, rowIndex) => (
            <React.Fragment key={rowIndex}>
              {/* Rank coordinate */}
              <div className="flex items-center justify-center w-6 md:w-8 text-gray-300 text-xs md:text-sm font-medium bg-gray-800 border-0 border-r border-b border-gray-900 p-0">
                {flipBoard ? ranks[7-rowIndex] : ranks[rowIndex]}
              </div>
              
              {/* Chess squares */}
              {cols.map(col => {
                const actualRow = flipBoard ? 7 - row : row;
                const actualCol = flipBoard ? 7 - col : col;
                const piece = gameState.board[actualRow][actualCol];
                const isSelected = selectedPiece && selectedPiece.row === actualRow && selectedPiece.col === actualCol;
                const isValidMove = validMoves.some(move => move.to.row === actualRow && move.to.col === actualCol);
                const isLightSquare = (row + col) % 2 === 0;
                const isPreviousMove = gameState.moves.length > 0 && 
                  ((gameState.lastMoveFrom?.row === actualRow && gameState.lastMoveFrom?.col === actualCol) ||
                   (gameState.lastMoveTo?.row === actualRow && gameState.lastMoveTo?.col === actualCol));
                
                // Check if this is the player's piece and it's their turn
                const isPlayerPiece = piece && piece.color === playerColor && gameState.currentTurn === playerColor;
                
                return (
                  <div 
                    key={`${row}-${col}`}
                    className={`relative flex items-center justify-center 
                      h-8 w-8 xs:h-9 xs:w-9 sm:h-11 sm:w-11 md:h-14 md:w-14 lg:h-16 lg:w-16
                      ${isLightSquare ? 'bg-amber-200' : 'bg-amber-800'} 
                      ${isSelected ? 'bg-blue-400' : ''} 
                      ${isPreviousMove ? 'ring-2 ring-yellow-400 ring-inset' : ''} 
                      ${isPlayerPiece ? 'cursor-pointer' : ''}
                      ${isValidMove ? 'cursor-pointer' : ''}
                      border-0 border-r border-b border-gray-900 p-0
                      hover:opacity-90 transition-opacity duration-200`}
                    onClick={() => handleSquareClick(actualRow, actualCol)}
                    title={piece ? `${piece.color} ${piece.type}` : isValidMove ? 'Valid move' : ''}
                  >
                    {piece && (
                      <div 
                        className={`text-base xs:text-xl sm:text-2xl md:text-4xl lg:text-5xl drop-shadow-md ${piece.color === 'white' ? 'text-white' : 'text-black'}
                          ${isPlayerPiece && gameState.currentTurn === playerColor ? 'animate-pulse' : ''}`}
                      >
                        {getPieceSymbol(piece.type)}
                      </div>
                    )}
                    
                    {/* Highlight for valid moves */}
                    {isValidMove && (
                      <div className={`absolute inset-0 ${
                        piece ? 'border-2 sm:border-4 border-green-500/70 bg-green-400/20 rounded-full' : 'flex items-center justify-center'
                      }`}>
                        {!piece && <div className="w-2 h-2 sm:w-3 sm:h-3 md:w-4 md:h-4 bg-green-500/70 rounded-full"></div>}
                      </div>
                    )}
                    
                    {/* Current turn indicator */}
                    {piece && piece.color === gameState.currentTurn && (
                      <div className="absolute -top-1 -right-1 w-1.5 h-1.5 sm:w-2 sm:h-2 md:w-3 md:h-3 bg-blue-500 rounded-full shadow-md"></div>
                    )}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
          
          {/* Bottom coordinates */}
          <div className="bg-gray-800 h-6 md:h-8 border-0 border-r border-gray-900 p-0"></div>
          {files.map((file, index) => (
            <div 
              key={`bottom-${file}`} 
              className="flex items-center justify-center h-6 md:h-8 text-gray-300 text-xs md:text-sm font-medium bg-gray-800 border-0 border-r border-gray-900 p-0"
            >
              {flipBoard ? files[7-index] : file}
            </div>
          ))}
        </div>
        
        {/* Captured pieces - white pieces captured by black */}
        <div className="w-full md:w-24 lg:w-32 flex flex-row md:flex-col items-center mt-2 md:mt-0 md:ml-4">
          <div className="bg-gray-800 text-white text-center p-1 md:p-2 mb-0 md:mb-2 rounded w-1/3 md:w-full order-1 md:order-none">
            Captured
          </div>
          <div className="bg-gray-700 rounded p-2 flex flex-wrap justify-center gap-1 min-h-[80px] md:min-h-[250px] w-2/3 md:w-full">
            {capturedPieces.black.map((piece, index) => (
              <div key={`black-captured-${index}`} className="text-2xl md:text-3xl">
                {getPieceSymbol(piece.type)}
              </div>
            ))}
          </div>
        </div>
        
        {/* Game status overlay */}
        {gameState.status !== 'active' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10">
            <div className="bg-gray-800 rounded-lg p-6 text-center shadow-xl">
              {gameState.status === 'checkmate' && (
                <>
                  <div className="text-5xl mb-4">{gameState.winner === 'white' ? '♔' : '♚'}</div>
                  <h3 className="text-3xl font-bold text-white mb-2">
                    Checkmate!
                  </h3>
                  <p className="text-xl text-red-500 mb-4">
                    The {gameState.winner} king has fallen!
                  </p>
                  <p className="text-lg text-white mb-4">
                    {gameState.winner === playerColor ? 'Victory is yours!' : 'Your king has been defeated!'}
                  </p>
                </>
              )}
              {gameState.status === 'stalemate' && (
                <h3 className="text-2xl font-bold text-white mb-2">Stalemate!</h3>
              )}
              {gameState.status === 'draw' && (
                <h3 className="text-2xl font-bold text-white mb-2">Draw!</h3>
              )}
              {gameState.status === 'resigned' && (
                <h3 className="text-2xl font-bold text-white mb-2">
                  {gameState.winner === playerColor ? 'You won!' : 'Opponent resigned!'}
                </h3>
              )}
              <button
                onClick={onExit}
                className="mt-4 px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg"
              >
                Return to Game Hub
              </button>
            </div>
          </div>
        )}
        
        {/* Turn indicator when it's not player's turn */}
        {gameState.status === 'active' && gameState.currentTurn !== playerColor && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 z-5 pointer-events-none">
            <div className="bg-gray-800/90 rounded-lg p-4 shadow-xl">
              <p className="text-xl font-semibold text-white">Waiting for opponent...</p>
            </div>
          </div>
        )}
        
        {/* Check indicator */}
        {gameState.inCheck && (
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg z-10">
            {gameState.inCheck === playerColor ? 'You are in check!' : 'Opponent is in check!'}
          </div>
        )}
      </div>
    );
  };




  const handleJoinRoom = () => {
    if (roomIdInput.trim()) {
      joinLobby(roomIdInput.trim());
    }
  };

  const handleStartGame = () => {
    if (lobby && isHost) {
      startGame(lobby);
    }
  };

  const MoveHistoryPanel = () => {
    if (!gameState) return null;
    
    return (
      <div className="bg-gray-800 rounded-lg p-4 mt-4 min-w-64 max-h-80 overflow-auto shadow-lg">
        <h3 className="text-xl font-semibold text-white mb-2 border-b border-gray-700 pb-2">Move History</h3>
        <div className="text-sm text-gray-300 space-y-1 font-mono">
          {gameState.moves.length === 0 ? (
            <p className="text-gray-500 italic">No moves yet</p>
          ) : (
            <div className="grid grid-cols-2 gap-1">
              {gameState.moves.map((move, index) => (
                <div 
                  key={index} 
                  className={`p-1 ${
                    index === gameState.moves.length - 1 ? 'bg-blue-900/40 rounded' : ''
                  }`}
                >
                  {move}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col w-full max-w-7xl mx-auto p-2 sm:p-4 md:p-6 min-h-[calc(100vh-64px)]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
        <h1 className="text-2xl sm:text-3xl text-primary font-bold">Chess</h1>
        
        <div className="flex flex-wrap gap-2 self-stretch sm:self-auto justify-end">
          <button 
            onClick={openLobby}
            className="px-3 py-2 text-sm sm:px-4 sm:py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md transition-colors duration-200 shadow-md"
            disabled={!!gameState}
          >
            New Game
          </button>
          
          {gameState && gameState.status === 'active' && (
            <button 
              onClick={resignGame}
              className="px-3 py-2 text-sm sm:px-4 sm:py-2 bg-red-600 hover:bg-red-500 text-white rounded-md transition-colors duration-200 shadow-md"
            >
              Resign
            </button>
          )}
          
          <button 
            onClick={onExit}
            className="px-3 py-2 text-sm sm:px-4 sm:py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors duration-200 shadow-md"
          >
            Back to Games
          </button>
        </div>
      </div>
      
      {gameState ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 w-full">
          <div className="lg:col-span-2">{renderBoard()}</div>
          <div className="bg-gray-800/50 rounded-lg p-3 sm:p-4 shadow-lg h-auto lg:h-full">
            <h2 className="text-xl text-primary mb-2 border-b border-gray-700 pb-2">Game Info</h2>
            
            {/* Timer */}
            {gameState.status === 'active' && (
              <div className="mb-4 bg-gray-900/50 rounded-lg p-3">
                <p className="text-gray-300 text-sm mb-1">Turn</p>
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full ${gameState.currentTurn === 'white' ? 'bg-white' : 'bg-black'} shadow-md`}></div>
                  <span className="text-white font-medium capitalize">{gameState.currentTurn}'s turn</span>
                  <div className="ml-auto bg-gray-700 px-2 py-1 rounded text-sm font-mono">
                    {turnTimer}s
                  </div>
                </div>
              </div>
            )}
            
            {/* Status */}
            <div className="mb-4">
              <p className="text-gray-300 text-sm mb-1">Status</p>
              <div className={`rounded-full px-3 py-1 inline-block text-sm ${
                gameState.status === 'active' 
                  ? 'bg-green-500/20 text-green-400' 
                  : 'bg-red-500/20 text-red-400'
              }`}>
                {gameState.status === 'active' ? 'In Progress' : 'Game Over'}
              </div>
              {gameState.inCheck && (
                <div className="rounded-full px-3 py-1 inline-block text-sm bg-orange-500/20 text-orange-400 ml-2">
                  Check
                </div>
              )}
            </div>
            
            <MoveHistoryPanel />
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center min-h-[400px] bg-gray-800/30 rounded-lg p-6">
          <div className="text-6xl mb-6">♚</div>
          <h2 className="text-2xl font-bold text-primary mb-4">Ready for a Chess Match?</h2>
          <p className="text-gray-300 mb-6 text-center max-w-md">Challenge an opponent to a strategic battle of wits. Create a new game to begin.</p>
          <button 
            onClick={openLobby}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors duration-200 shadow-md"
          >
            New Game
          </button>
        </div>
      )}
      
      {/* Lobby overlay */}
      {showLobby && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-4 sm:p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold text-primary mb-4">Chess Game</h2>
            
            <div className="mb-4">
              <div className="flex border-b border-gray-600 mb-4">
                <button 
                  className={`px-4 py-2 ${!showJoinTab ? 'border-b-2 border-indigo-500 text-white' : 'text-gray-400'}`}
                  onClick={() => setShowJoinTab(false)}
                >
                  Create Game
                </button>
                <button 
                  className={`px-4 py-2 ${showJoinTab ? 'border-b-2 border-indigo-500 text-white' : 'text-gray-400'}`}
                  onClick={() => setShowJoinTab(true)}
                >
                  Join Game
                </button>
              </div>
              
              {showJoinTab ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-gray-300 mb-2">Enter Room Code</label>
                    <div className="flex">
                      <input
                        type="text"
                        value={roomIdInput}
                        onChange={(e) => setRoomIdInput(e.target.value)}
                        placeholder="Enter 6-character code"
                        className="flex-1 bg-gray-700 text-white px-3 py-2 rounded-l border border-gray-600 focus:border-indigo-500 focus:outline-none"
                        maxLength={6}
                      />
                      <button
                        onClick={handleJoinRoom}
                        disabled={roomIdInput.trim().length < 6 || isLoading}
                        className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-600 text-white px-4 py-2 rounded-r"
                      >
                        {isLoading ? 'Joining...' : 'Join'}
                      </button>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Enter the 6-character room code shared by the host</p>
                  </div>
                  
                  <button
                    onClick={() => setShowLobby(false)}
                    className="w-full bg-gray-700 hover:bg-gray-600 text-white py-3 px-4 rounded-lg mt-4"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-gray-300 mb-2">Choose your color</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setSelectedColor('white')}
                        className={`p-3 rounded-lg border-2 ${
                          selectedColor === 'white' 
                            ? 'border-yellow-400 bg-gray-700' 
                            : 'border-gray-600 hover:border-gray-500'
                        }`}
                      >
                        <div className="flex items-center justify-center">
                          <div className="w-8 h-8 rounded-full bg-white"></div>
                          <span className="ml-2 text-white">White</span>
                        </div>
                      </button>
                      
                      <button
                        onClick={() => setSelectedColor('black')}
                        className={`p-3 rounded-lg border-2 ${
                          selectedColor === 'black' 
                            ? 'border-yellow-400 bg-gray-700' 
                            : 'border-gray-600 hover:border-gray-500'
                        }`}
                      >
                        <div className="flex items-center justify-center">
                          <div className="w-8 h-8 rounded-full bg-black"></div>
                          <span className="ml-2 text-white">Black</span>
                        </div>
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2 mt-6">
                    <button
                      onClick={() => createLobby(true, true)}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-lg"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Creating...' : 'Create Game'}
                    </button>
                    
                    <button
                      onClick={() => setShowLobby(false)}
                      className="bg-gray-700 hover:bg-gray-600 text-white py-3 px-4 rounded-lg"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Waiting Room overlay */}
      {showWaitingRoom && lobby && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-4 sm:p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold text-primary mb-4">Waiting for Opponent</h2>
            
            <div className="space-y-4">
              <div className="bg-gray-700 p-4 rounded-lg">
                <p className="text-gray-300 mb-2">Share this invite link or code with your opponent:</p>
                
                <div className="mb-4">
                  <div className="flex">
                    <input 
                      type="text"
                      value={inviteUrl}
                      readOnly
                      className="flex-1 bg-gray-900 text-gray-200 px-3 py-2 rounded-l font-mono text-sm truncate"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(inviteUrl);
                        toast.success('Invite link copied!');
                      }}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 rounded-r"
                    >
                      Copy
                    </button>
                  </div>
                </div>
                
                <div className="bg-gray-800 p-3 rounded text-center mb-4">
                  <p className="text-gray-400 text-xs mb-1">Room Code</p>
                  <div className="flex items-center justify-center">
                    <p className="text-lg text-white font-mono">{lobby.id}</p>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(lobby.id);
                        toast.success('Room code copied!');
                      }}
                      className="ml-2 text-gray-400 hover:text-white"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M8 2a1 1 0 000 2h2a1 1 0 100-2H8z" />
                        <path d="M3 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v6h-4.586l1.293-1.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L10.414 13H15v3a2 2 0 01-2 2H5a2 2 0 01-2-2V5zM15 11h2a1 1 0 110 2h-2v-2z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-2">
                {isHost && (
                  <button
                    onClick={handleStartGame}
                    className="flex-1 bg-green-600 hover:bg-green-500 text-white py-3 rounded-lg"
                    disabled={isLoading || !lobby.guestId}
                  >
                    {!lobby.guestId ? 'Waiting for opponent...' : 'Start Game'}
                  </button>
                )}
                
                <button
                  onClick={leaveLobby}
                  className="bg-red-600 hover:bg-red-500 text-white py-3 px-4 rounded-lg"
                  disabled={isLoading}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function to get chess piece symbols
function getPieceSymbol(type: string): string {
  switch (type) {
    case 'king': return '♔';
    case 'queen': return '♕';
    case 'rook': return '♖';
    case 'bishop': return '♗';
    case 'knight': return '♘';
    case 'pawn': return '♙';
    default: return '';
  }
}

export default ChessGame; 