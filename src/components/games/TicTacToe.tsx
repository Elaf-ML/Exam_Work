import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { doc, updateDoc, increment, getDoc, collection, addDoc, onSnapshot, query, where, getDocs, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';

type Player = 'X' | 'O' | null;
type BoardState = (Player)[];
type GameMode = 'local' | 'online' | 'ai' | 'lobby';
type AIDifficulty = 'easy' | 'medium' | 'hard';
type LobbyStatus = 'waiting' | 'playing';
type InviteStatus = 'pending' | 'accepted' | 'rejected';

// User type definition
type User = {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  online?: boolean;
  lastSeen?: any;
};

// Invite type definition
type Invite = {
  id?: string;
  from: string;
  fromName: string;
  to: string;
  toName: string;
  gameId?: string;
  status: InviteStatus;
  createdAt: any;
};

const initialBoard: BoardState = Array(9).fill(null);

const TicTacToe = () => {
  const [board, setBoard] = useState<BoardState>(initialBoard);
  const [isXNext, setIsXNext] = useState<boolean>(true);
  const [winner, setWinner] = useState<Player | 'draw' | null>(null);
  const [gameStats, setGameStats] = useState({ wins: 0, losses: 0, draws: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [gameMode, setGameMode] = useState<GameMode>('local');
  const [aiDifficulty, setAiDifficulty] = useState<AIDifficulty>('medium');
  const [inviteCode, setInviteCode] = useState<string>('');
  const [inputInviteCode, setInputInviteCode] = useState<string>('');
  const [isJoining, setIsJoining] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [gameId, setGameId] = useState<string>('');
  const [gameStatus, setGameStatus] = useState<string>('');
  const [opponent, setOpponent] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [_lastPing, setLastPing] = useState<number>(Date.now());
  const [usingLocalStorage, _setUsingLocalStorage] = useState<boolean>(false);
  const [aiThinking, setAiThinking] = useState<boolean>(false);
  
  // New state variables for lobby system
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
  const [pendingInvites, setPendingInvites] = useState<Invite[]>([]);
  const [sentInvites, setSentInvites] = useState<Invite[]>([]);
  const [_lobbyStatus, setLobbyStatus] = useState<LobbyStatus>('waiting');
  const [_lobbyId, setLobbyId] = useState<string>('');
  const [_lobbyOpponent, setLobbyOpponent] = useState<User | null>(null);
  const [isInviting, setIsInviting] = useState(false);
  
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const { currentUser } = useAuth();
  
  // Add invites listener
  useEffect(() => {
    if (!currentUser) return;
    
    // Set user as online
    updateUserOnlineStatus(true);
    
    // Clean up on unmount
    return () => {
      updateUserOnlineStatus(false);
    };
  }, [currentUser]);
  
  // Add function to update user online status
  const updateUserOnlineStatus = async (isOnline: boolean) => {
    if (!currentUser) return;
    
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        online: isOnline,
        lastSeen: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating online status:', error);
    }
  };
  
  // Add listener for online users
  useEffect(() => {
    if (gameMode !== 'lobby' || !currentUser) return;
    
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('online', '==', true));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const users: User[] = [];
      snapshot.forEach((doc) => {
        const userData = doc.data() as User;
        userData.uid = doc.id;
        
        // Don't include current user in the list
        if (userData.uid !== currentUser.uid) {
          users.push(userData);
        }
      });
      
      setOnlineUsers(users);
    });
    
    return () => {
      unsubscribe();
    };
  }, [gameMode, currentUser]);
  
  // Add listener for pending invites
  useEffect(() => {
    if (!currentUser) return;
    
    const invitesRef = collection(db, 'invites');
    const q = query(invitesRef, where('to', '==', currentUser.uid), where('status', '==', 'pending'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const invites: Invite[] = [];
      snapshot.forEach((doc) => {
        const inviteData = doc.data() as Invite;
        inviteData.id = doc.id;
        invites.push(inviteData);
      });
      
      setPendingInvites(invites);
    });
    
    return () => {
      unsubscribe();
    };
  }, [currentUser]);
  
  // Add listener for sent invites
  useEffect(() => {
    if (!currentUser) return;
    
    const invitesRef = collection(db, 'invites');
    const q = query(invitesRef, where('from', '==', currentUser.uid), where('status', '==', 'pending'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const invites: Invite[] = [];
      snapshot.forEach((doc) => {
        const inviteData = doc.data() as Invite;
        inviteData.id = doc.id;
        invites.push(inviteData);
      });
      
      setSentInvites(invites);
    });
    
    return () => {
      unsubscribe();
    };
  }, [currentUser]);
  
  // Add function to send invitation
  const sendInvitation = async (toUser: User) => {
    if (!currentUser) {
      setErrorMessage("You must be logged in to invite players");
      return;
    }
    
    setIsInviting(true);
    
    try {
      const inviteData: Invite = {
        from: currentUser.uid,
        fromName: currentUser.displayName || currentUser.email || 'Anonymous',
        to: toUser.uid,
        toName: toUser.displayName || toUser.email || 'Anonymous',
        status: 'pending',
        createdAt: serverTimestamp()
      };
      
      await addDoc(collection(db, 'invites'), inviteData);
      
    } catch (error) {
      console.error('Error sending invitation:', error);
      setErrorMessage('Failed to send invitation');
    } finally {
      setIsInviting(false);
    }
  };
  
  // Add function to respond to invitation
  const respondToInvitation = async (invite: Invite, accept: boolean) => {
    if (!invite.id) return;
    
    try {
      const inviteRef = doc(db, 'invites', invite.id);
      
      if (accept) {
        // Create a game
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        
        const gameRef = await addDoc(collection(db, 'games'), {
          board: initialBoard,
          isXNext: true,
          winner: null,
          host: invite.from,
          player2: invite.to,
          createdAt: serverTimestamp(),
          status: 'playing',
          inviteCode: code
        });
        
        // Update invite with game info
        await updateDoc(inviteRef, {
          status: 'accepted',
          gameId: gameRef.id
        });
        
        // Join the game
        setGameId(gameRef.id);
        setGameMode('online');
        setIsHost(false);
        setGameStatus('Game in progress');
        setInviteCode(code);
        
      } else {
        // Reject invite
        await updateDoc(inviteRef, {
          status: 'rejected'
        });
      }
    } catch (error) {
      console.error('Error responding to invitation:', error);
      setErrorMessage('Failed to respond to invitation');
    }
  };
  
  // Add listener for accepted invites
  useEffect(() => {
    if (!currentUser) return;
    
    const invitesRef = collection(db, 'invites');
    const q = query(
      invitesRef, 
      where('from', '==', currentUser.uid), 
      where('status', '==', 'accepted')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added' || change.type === 'modified') {
          const invite = change.doc.data() as Invite;
          invite.id = change.doc.id;
          
          if (invite.gameId) {
            // Join the game as host
            setGameId(invite.gameId);
            setGameMode('online');
            setIsHost(true);
            setGameStatus('Game in progress');
            
            // Clean up the invite after joining
            deleteDoc(doc(db, 'invites', invite.id));
          }
        }
      });
    });
    
    return () => {
      unsubscribe();
    };
  }, [currentUser]);
  
  // Add function to leave lobby and return to game selection
  const leaveLobby = () => {
    setGameMode('local');
    setLobbyId('');
    setLobbyOpponent(null);
    setLobbyStatus('waiting');
  };
  
  // Modify resetGame to return to lobby if in online mode
  const resetGame = () => {
    setBoard(initialBoard);
    setIsXNext(true);
    setWinner(null);
    
    if (gameMode === 'online') {
      // Return to lobby instead of local mode
      setGameMode('lobby');
      setInviteCode('');
      setInputInviteCode('');
      setGameId('');
      setIsHost(false);
      setGameStatus('');
      setOpponent('');
    }
  };

  // Add the lobby UI rendering function
  const renderLobby = () => {
    return (
      <div className="bg-dark-lighter p-4 rounded-lg max-h-[70vh] overflow-y-auto">
        <h2 className="text-lg font-bold text-primary mb-4">Online Players</h2>
        
        {onlineUsers.length === 0 ? (
          <p className="text-gray-400">No other players online right now</p>
        ) : (
          <div className="space-y-2">
            {onlineUsers.map((user) => (
              <div key={user.uid} className="flex justify-between items-center p-2 bg-dark rounded">
                <div className="flex items-center">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName} className="w-8 h-8 rounded-full mr-2" />
                  ) : (
                    <div className="w-8 h-8 bg-primary-dark rounded-full mr-2 flex items-center justify-center">
                      {(user.displayName || user.email || 'A').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="text-gray-200">{user.displayName || user.email}</span>
                </div>
                <button
                  onClick={() => sendInvitation(user)}
                  disabled={isInviting || sentInvites.some(invite => invite.to === user.uid)}
                  className="px-3 py-1 text-sm bg-primary text-white rounded disabled:opacity-50"
                >
                  {sentInvites.some(invite => invite.to === user.uid) ? 'Invited' : 'Invite'}
                </button>
              </div>
            ))}
          </div>
        )}
        
        {/* Pending invites section */}
        {pendingInvites.length > 0 && (
          <div className="mt-6">
            <h3 className="text-md font-semibold text-primary-light mb-2">Invitations</h3>
            <div className="space-y-2">
              {pendingInvites.map((invite) => (
                <div key={invite.id} className="p-3 bg-dark border border-primary/30 rounded">
                  <p className="text-sm text-gray-300 mb-2">
                    <span className="font-semibold">{invite.fromName}</span> invited you to play
                  </p>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => respondToInvitation(invite, true)}
                      className="px-3 py-1 text-sm bg-green-600 text-white rounded"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => respondToInvitation(invite, false)}
                      className="px-3 py-1 text-sm bg-red-600 text-white rounded"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Sent invites section */}
        {sentInvites.length > 0 && (
          <div className="mt-6">
            <h3 className="text-md font-semibold text-primary-light mb-2">Sent Invitations</h3>
            <div className="space-y-2">
              {sentInvites.map((invite) => (
                <div key={invite.id} className="p-2 bg-dark rounded flex justify-between items-center">
                  <p className="text-sm text-gray-300">
                    Waiting for <span className="font-semibold">{invite.toName}</span> to respond
                  </p>
                  <button
                    onClick={() => {
                      if (invite.id) {
                        deleteDoc(doc(db, 'invites', invite.id));
                      }
                    }}
                    className="text-xs text-red-400 hover:text-red-300"
                  >
                    Cancel
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-700">
          <span className="text-sm text-gray-400">
            Or join with an invite code:
          </span>
          <button
            onClick={() => setGameMode('online')}
            className="px-3 py-1 text-sm bg-dark-lighter text-gray-300 hover:bg-dark-light rounded"
          >
            Use Code
          </button>
        </div>
        
        <button
          onClick={leaveLobby}
          className="mt-6 w-full py-2 bg-dark-light text-gray-300 hover:bg-dark rounded"
        >
          Leave Lobby
        </button>
      </div>
    );
  };

  // Add back the toggleFullscreen function
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      gameContainerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Add back the generateInviteCode function
  const generateInviteCode = async () => {
    if (!currentUser) {
      setErrorMessage("You must be logged in to create a game");
      return;
    }
    
    setIsCreating(true);
    setErrorMessage('');
    
    try {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      const gameRef = await addDoc(collection(db, 'games'), {
        board: initialBoard,
        isXNext: true,
        winner: null,
        host: currentUser.uid,
        createdAt: serverTimestamp(),
        status: 'waiting',
        inviteCode: code
      });

      setInviteCode(code);
      setGameId(gameRef.id);
      setIsHost(true);
      setGameMode('online');
      setGameStatus('Waiting for opponent...');
      
    } catch (error: any) {
      console.error('Error generating invite code:', error);
      setErrorMessage('Failed to create game. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  // Add back the joinGame function
  const joinGame = async () => {
    if (!currentUser) {
      setErrorMessage("You must be logged in to join a game");
      return;
    }
    
    if (!inputInviteCode) {
      setErrorMessage("Please enter an invite code");
      return;
    }
    
    setIsJoining(true);
    setErrorMessage('');
    
    try {
      const gamesRef = collection(db, 'games');
      const gameQuery = query(gamesRef, where('inviteCode', '==', inputInviteCode), where('status', '==', 'waiting'));
      
      const gameSnapshot = await getDocs(gameQuery);
      
      if (gameSnapshot.empty) {
        setErrorMessage("Invalid invite code or game is no longer available.");
        return;
      }
      
      const gameDoc = gameSnapshot.docs[0];
      const gameData = gameDoc.data();
      
      if (gameData.host === currentUser.uid) {
        setErrorMessage("You cannot join your own game.");
        return;
      }
      
      await updateDoc(doc(db, 'games', gameDoc.id), {
        status: 'playing',
        player2: currentUser.uid,
        joinedAt: serverTimestamp()
      });
      
      setGameId(gameDoc.id);
      setGameMode('online');
      setIsHost(false);
      setGameStatus('Game in progress');
      
    } catch (error) {
      console.error('Error joining game:', error);
      setErrorMessage("An error occurred while joining the game.");
    } finally {
      setIsJoining(false);
    }
  };

  // Add back the getInviteUrl function
  const getInviteUrl = () => {
    const baseUrl = window.location.href.split('?')[0]; // Remove any existing query params
    return `${baseUrl}?invite=${inviteCode}`;
  };

  // Add useEffect to set up real-time game listener
  useEffect(() => {
    if (gameMode === 'online' && gameId) {
      const unsubscribe = onSnapshot(doc(db, 'games', gameId), (docSnapshot) => {
        if (docSnapshot.exists()) {
          const gameData = docSnapshot.data();
          setBoard(gameData.board);
          setWinner(gameData.winner);
          setIsXNext(gameData.isXNext);
  
          // Set game status based on state
          if (gameData.status === 'waiting') {
            setGameStatus('Waiting for opponent...');
          } else if (gameData.status === 'playing') {
            setGameStatus('Game in progress');
  
            // If we're the host, opponent is player2, otherwise it's host
            const opponentId = isHost ? gameData.player2 : gameData.host;
            
            // Fetch opponent's username from Firestore
            if (opponentId) {
              // First set a temporary value while we fetch
              setOpponent(`${opponentId.substring(0, 6)}...`);
              
              // Fetch the username from the users collection
              getDoc(doc(db, 'users', opponentId))
                .then((userDoc) => {
                  if (userDoc.exists()) {
                    const userData = userDoc.data();
                    // Use displayName if available, otherwise use email or uid
                    const username = userData.displayName || userData.email || opponentId.substring(0, 6);
                    setOpponent(username);
                  }
                })
                .catch(error => {
                  console.error("Error fetching opponent info:", error);
                });
            } else {
              setOpponent('Unknown');
            }
          } else if (gameData.status === 'finished') {
            setGameStatus('Game finished');
          }
          
          setLastPing(Date.now());
          setIsConnected(true);
        } else {
          setGameStatus('Game not found');
          setIsConnected(false);
        }
      });
      
      return () => {
        unsubscribe();
      };
    }
  }, [gameId, gameMode, isHost]);

  // Add back the renderConnectionStatus function
  const renderConnectionStatus = () => {
    return (
      <div className="flex items-center">
        <div className={`w-3 h-3 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
        <span className="text-sm text-gray-300">
          {isConnected ? 'Connected' : 'Disconnected'}
        </span>
      </div>
    );
  };

  // Add back the handle click function
  const handleClick = async (index: number) => {
    // Don't allow moves if:
    // 1. There's already a winner
    // 2. The square is already filled
    // 3. In online mode, it's not the player's turn
    // 4. In AI mode, it's not the player's turn or AI is thinking
    if (winner || board[index]) return;
    
    if (gameMode === 'online') {
      // In online mode, host plays as X, guest plays as O
      if ((isHost && !isXNext) || (!isHost && isXNext)) {
        return;
      }
    } else if (gameMode === 'ai' && (!isXNext || aiThinking)) {
      return;
    }

    const newBoard = [...board];
    newBoard[index] = isXNext ? 'X' : 'O';
    
    // Check for winner or draw before updating Firebase
    const gameWinner = calculateWinner(newBoard);
    const isDraw = !newBoard.includes(null) && !gameWinner;
    
    // Update local state immediately
    setBoard(newBoard);
    setIsXNext(!isXNext);
    
    if (gameWinner) {
      setWinner(gameWinner);
    } else if (isDraw) {
      setWinner('draw');
    }

    if (gameMode === 'online') {
      try {
        // Combine all updates into a single write operation
        const updateData: any = {
          board: newBoard,
          isXNext: !isXNext
        };
        
        if (gameWinner) {
          updateData.winner = gameWinner;
          updateData.status = 'finished';
        } else if (isDraw) {
          updateData.winner = 'draw';
          updateData.status = 'finished';
        }
        
        await updateDoc(doc(db, 'games', gameId), updateData);
        
        // Only update stats after Firebase update succeeds
        if (gameWinner || isDraw) {
          updateStats(gameWinner || 'draw');
        }
      } catch (error) {
        console.error('Error updating game:', error);
        setErrorMessage('Failed to update game. Please try again.');
      }
    } else {
      // In local or AI mode, update stats immediately
      if (gameWinner) {
        updateStats(gameWinner);
      } else if (isDraw) {
        updateStats('draw');
      }
    }
  };

  // Add back the updateStats function
  const updateStats = async (result: Player | 'draw') => {
    if (!currentUser) return;
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      if (result === 'X') {
        await updateDoc(userRef, {
          'games.tictactoe.wins': increment(1)
        });
        setGameStats(prev => ({ ...prev, wins: prev.wins + 1 }));
      } else if (result === 'O') {
        await updateDoc(userRef, {
          'games.tictactoe.losses': increment(1)
        });
        setGameStats(prev => ({ ...prev, losses: prev.losses + 1 }));
      } else if (result === 'draw') {
        await updateDoc(userRef, {
          'games.tictactoe.draws': increment(1)
        });
        setGameStats(prev => ({ ...prev, draws: prev.draws + 1 }));
      }
    } catch (error) {
      console.error('Error updating stats:', error);
    }
  };

  // Add back the calculateWinner function
  const calculateWinner = (squares: BoardState): Player => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
      [0, 4, 8], [2, 4, 6]             // Diagonals
    ];
    
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }
    return null;
  };

  // Add back the renderSquare function
  const renderSquare = (index: number) => {
    // Determine if the square should be disabled
    const isDisabled = 
      !!winner || 
      (gameMode === 'online' && ((isHost && !isXNext) || (!isHost && isXNext))) ||
      (gameMode === 'ai' && !isXNext);
    
    // Special animation for AI "thinking" state
    const isAiThinking = gameMode === 'ai' && !isXNext && !board[index] && aiThinking;
    
    return (
      <motion.button
        whileHover={{ scale: board[index] ? 1 : 1.1 }}
        whileTap={{ scale: board[index] ? 1 : 0.9 }}
        className={`w-full aspect-square bg-dark-lighter border border-primary-dark/30 text-4xl md:text-5xl font-bold flex items-center justify-center ${
          board[index] === 'X' ? 'text-primary' : 'text-primary-light'
        } ${isDisabled && !board[index] ? 'cursor-not-allowed opacity-50' : ''} ${
          isAiThinking ? 'ai-thinking' : ''
        }`}
        onClick={() => handleClick(index)}
        disabled={isDisabled || !!board[index]}
      >
        {board[index]}
        {isAiThinking && (
          <motion.div 
            className="absolute w-4 h-4 bg-primary-light rounded-full"
            animate={{ scale: [0.5, 1.2, 0.5], opacity: [0.3, 1, 0.3] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          />
        )}
      </motion.button>
    );
  };

  // Add back the useEffect for loading user stats
  useEffect(() => {
    if (currentUser) {
      loadUserStats();
    }
  }, [currentUser]);

  // Add the loadUserStats function
  const loadUserStats = async () => {
    if (!currentUser) return;
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.games && userData.games.tictactoe) {
          setGameStats(userData.games.tictactoe);
        }
      }
    } catch (error) {
      console.error('Error loading user stats:', error);
    }
  };

  // Add AI move logic - key function to fix the stuck issue
  useEffect(() => {
    // Only make AI moves when: 
    // 1. Game mode is AI
    // 2. It's O's turn (AI is always O)
    // 3. There's no winner yet
    if (gameMode === 'ai' && !isXNext && !winner) {
      // Set thinking state and add a short delay for user experience
      setAiThinking(true);
      
      // Use a timeout to both show the thinking animation and ensure the AI makes a move
      const thinkingTimeout = setTimeout(() => {
        try {
          // Get the best move based on difficulty
          const moveIndex = getAIMove();
          
          if (moveIndex !== -1) {
            // Make the move
            const newBoard = [...board];
            newBoard[moveIndex] = 'O';
            setBoard(newBoard);
            setIsXNext(true);
            
            // Check for winner
            const gameWinner = calculateWinner(newBoard);
            if (gameWinner) {
              setWinner(gameWinner);
              updateStats(gameWinner);
            } else if (!newBoard.includes(null)) {
              setWinner('draw');
              updateStats('draw');
            }
          }
        } catch (error) {
          console.error("Error in AI move logic:", error);
        } finally {
          // Always clear the thinking state
          setAiThinking(false);
        }
      }, 700); // Short delay for better UX
      
      // Safety timeout to ensure thinking state gets cleared if something goes wrong
      const safetyTimeout = setTimeout(() => {
        if (aiThinking) {
          console.log("AI thinking timeout triggered, forcing state reset");
          setAiThinking(false);
        }
      }, 2000);
      
      return () => {
        clearTimeout(thinkingTimeout);
        clearTimeout(safetyTimeout);
      };
    }
  }, [gameMode, isXNext, winner, board]);
  
  // AI move selection function
  const getAIMove = (): number => {
    switch (aiDifficulty) {
      case 'easy':
        return getRandomMove();
      case 'medium':
        return Math.random() > 0.5 ? getBestMove() : getRandomMove();
      case 'hard':
        return getBestMove();
      default:
        return getRandomMove();
    }
  };
  
  // Get a random valid move
  const getRandomMove = (): number => {
    const availableMoves = board
      .map((square, index) => square === null ? index : -1)
      .filter(index => index !== -1);
      
    if (availableMoves.length === 0) return -1;
    
    return availableMoves[Math.floor(Math.random() * availableMoves.length)];
  };
  
  // Get the best move using a simplified strategy
  const getBestMove = (): number => {
    // First check if AI can win in one move
    const winMove = findWinningMove('O');
    if (winMove !== -1) return winMove;
    
    // Then check if player can win and block
    const blockMove = findWinningMove('X');
    if (blockMove !== -1) return blockMove;
    
    // Take center if available
    if (board[4] === null) return 4;
    
    // Take corners if available
    const corners = [0, 2, 6, 8];
    const availableCorners = corners.filter(index => board[index] === null);
    if (availableCorners.length > 0) {
      return availableCorners[Math.floor(Math.random() * availableCorners.length)];
    }
    
    // Take any available move
    return getRandomMove();
  };
  
  // Find a winning move for the given player
  const findWinningMove = (player: 'X' | 'O'): number => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
      [0, 4, 8], [2, 4, 6]             // Diagonals
    ];
    
    for (const [a, b, c] of lines) {
      // Check if player has two in a row and the third is empty
      if (board[a] === player && board[b] === player && board[c] === null) return c;
      if (board[a] === player && board[c] === player && board[b] === null) return b;
      if (board[b] === player && board[c] === player && board[a] === null) return a;
    }
    
    return -1;
  };

  return (
    <div 
      ref={gameContainerRef}
      className={`min-h-screen flex flex-col items-center justify-center p-4 md:p-6 transition-all duration-300 ${
        isFullscreen ? 'fixed inset-0 bg-dark z-50' : ''
      }`}
    >
      <div className="w-full max-w-md space-y-6">
        {errorMessage && (
          <div className="bg-red-900/30 border border-red-500 p-3 rounded-lg text-red-300">
            {errorMessage}
            <button 
              className="ml-2 text-red-300 hover:text-red-100"
              onClick={() => setErrorMessage('')}
              aria-label="Dismiss error"
            >
              ✕
            </button>
          </div>
        )}
      
        {usingLocalStorage && (
          <div className="bg-yellow-900/30 border border-yellow-500 p-3 rounded-lg text-yellow-300">
            <p>Firebase quota exceeded. Using local storage mode.</p>
            <p className="text-xs mt-1">
              Note: In this mode, games only work on the same device or browser.
            </p>
          </div>
        )}
        
        {/* Show lobby if in lobby mode */}
        {gameMode === 'lobby' && renderLobby()}
      
        {gameMode === 'online' && gameId && (
          <div className="bg-dark-lighter p-3 rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-gray-400">Status: </span>
                <span className="text-primary-light">{gameStatus}</span>
              </div>
              {renderConnectionStatus()}
            </div>
            <div className="mt-2 flex justify-between items-center">
              <div>
                <span className="text-gray-400">You are: </span>
                <span className={`font-bold ${isHost ? 'text-primary' : 'text-primary-light'}`}>
                  {isHost ? 'X' : 'O'}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Turn: </span>
                <span className={`font-bold ${
                  (isHost && isXNext) || (!isHost && !isXNext) ? 'text-green-500' : 'text-red-500'
                }`}>
                  {(isHost && isXNext) || (!isHost && !isXNext) ? 'Your turn' : 'Opponent\'s turn'}
                </span>
              </div>
            </div>
            {opponent && (
              <div className="mt-2">
                <span className="text-gray-400">Playing against: </span>
                <span className="font-semibold text-primary-light">{opponent}</span>
              </div>
            )}
          </div>
        )}
        
        {gameMode === 'ai' && (
          <div className="bg-dark-lighter p-3 rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-gray-400">Mode: </span>
                <span className="text-primary-light">Playing against AI ({aiDifficulty})</span>
              </div>
              <div>
                <span className="text-gray-400">You are: </span>
                <span className="font-bold text-primary">X</span>
              </div>
            </div>
            <div className="mt-2 flex items-center">
              <span className="text-gray-400 mr-2">Status: </span>
              {aiThinking && !isXNext && !winner ? (
                <span className="text-yellow-400 flex items-center">
                  AI is thinking
                  <motion.span
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="ml-1"
                  >
                    ...
                  </motion.span>
                </span>
              ) : (
                <span className={`font-bold ${isXNext ? 'text-green-500' : 'text-red-500'}`}>
                  {isXNext ? 'Your turn' : 'AI\'s turn'}
                </span>
              )}
            </div>
          </div>
        )}

        {gameMode !== 'lobby' && (
          <>
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <span className="text-xl text-gray-300">Next:</span>
                <span className={`text-2xl font-bold ${isXNext ? 'text-primary' : 'text-primary-light'}`}>
                  {isXNext ? 'X' : 'O'}
                </span>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={toggleFullscreen}
                  className="p-2 rounded-lg bg-dark-lighter hover:bg-dark-light transition-colors"
                  aria-label="Toggle fullscreen"
                >
                  {isFullscreen ? '⤓' : '⤢'}
                </button>
                <button
                  onClick={resetGame}
                  className="p-2 rounded-lg bg-dark-lighter hover:bg-dark-light transition-colors"
                  aria-label="Reset game"
                >
                  ↺
                </button>
              </div>
            </div>

            {/* Game mode selection */}
            {!gameId && gameMode !== ('lobby' as GameMode) && (
              <div className="flex justify-center space-x-2">
                <button
                  onClick={() => {
                    setGameMode('local');
                    resetGame();
                  }}
                  className={`px-3 py-1 rounded ${
                    gameMode === 'local' 
                      ? 'bg-primary text-white' 
                      : 'bg-dark-lighter text-gray-300 hover:bg-dark-light'
                  }`}
                >
                  Local
                </button>
                <button
                  onClick={() => {
                    setGameMode('ai');
                    resetGame();
                  }}
                  className={`px-3 py-1 rounded ${
                    gameMode === 'ai' 
                      ? 'bg-primary text-white' 
                      : 'bg-dark-lighter text-gray-300 hover:bg-dark-light'
                  }`}
                >
                  vs AI
                </button>
                <button
                  onClick={() => {
                    setGameMode('lobby');
                    resetGame();
                    setErrorMessage('');
                  }}
                  className={`px-3 py-1 rounded ${
                    gameMode === ('lobby' as GameMode)
                      ? 'bg-primary text-white' 
                      : 'bg-dark-lighter text-gray-300 hover:bg-dark-light'
                  }`}
                >
                  Multiplayer
                </button>
              </div>
            )}

            {/* AI difficulty selection */}
            {gameMode === 'ai' && (
              <div className="flex flex-col space-y-2">
                <div className="text-center text-gray-300 text-sm">Difficulty:</div>
                <div className="flex justify-center space-x-2">
                  <button
                    onClick={() => setAiDifficulty('easy')}
                    className={`px-3 py-1 rounded text-sm ${
                      aiDifficulty === 'easy' 
                        ? 'bg-green-600 text-white' 
                        : 'bg-dark-lighter text-gray-300 hover:bg-dark-light'
                    }`}
                  >
                    Easy
                  </button>
                  <button
                    onClick={() => setAiDifficulty('medium')}
                    className={`px-3 py-1 rounded text-sm ${
                      aiDifficulty === 'medium' 
                        ? 'bg-yellow-600 text-white' 
                        : 'bg-dark-lighter text-gray-300 hover:bg-dark-light'
                    }`}
                  >
                    Medium
                  </button>
                  <button
                    onClick={() => setAiDifficulty('hard')}
                    className={`px-3 py-1 rounded text-sm ${
                      aiDifficulty === 'hard' 
                        ? 'bg-red-600 text-white' 
                        : 'bg-dark-lighter text-gray-300 hover:bg-dark-light'
                    }`}
                  >
                    Hard
                  </button>
                </div>
              </div>
            )}

            {gameMode === 'local' && (
              <div className="text-center text-gray-400 text-sm">
                Play on the same device, taking turns
              </div>
            )}

            {gameMode === 'online' && !gameId && (
              <div className="flex flex-col space-y-4">
                <button
                  onClick={() => setGameMode('lobby')}
                  className="btn-primary px-4 py-2"
                >
                  Back to Lobby
                </button>
                <button
                  onClick={generateInviteCode}
                  className="btn-primary px-4 py-2"
                  disabled={isCreating}
                >
                  {isCreating ? 'Creating...' : 'Create Game with Code'}
                </button>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={inputInviteCode}
                    onChange={(e) => setInputInviteCode(e.target.value.toUpperCase())}
                    placeholder="Enter invite code"
                    className="flex-1 px-4 py-2 bg-dark-lighter rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    disabled={isJoining}
                  />
                  <button
                    onClick={joinGame}
                    disabled={isJoining || !inputInviteCode}
                    className="btn-primary px-4 py-2 disabled:opacity-50"
                  >
                    {isJoining ? 'Joining...' : 'Join'}
                  </button>
                </div>
              </div>
            )}

            {inviteCode && (
              <div className="bg-dark-lighter p-4 rounded-lg text-center">
                <p className="text-gray-300 mb-2">Share this code with your friend:</p>
                <div className="text-2xl font-bold text-primary bg-dark p-2 rounded flex items-center justify-center space-x-2">
                  <span>{inviteCode}</span>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(inviteCode);
                        alert('Invite code copied to clipboard!');
                      }}
                      className="text-sm bg-primary text-white px-2 py-1 rounded hover:bg-primary-dark"
                    >
                      Copy Code
                    </button>
                    <button 
                      onClick={() => {
                        const url = getInviteUrl();
                        navigator.clipboard.writeText(url);
                        alert('Invite link copied to clipboard!');
                      }}
                      className="text-sm bg-primary text-white px-2 py-1 rounded hover:bg-primary-dark"
                    >
                      Copy Link
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-2 aspect-square">
              {board.map((_, index) => (
                <div key={index} className="aspect-square">
                  {renderSquare(index)}
                </div>
              ))}
            </div>

            {currentUser && (
              <div className="flex justify-center space-x-4 text-sm text-gray-400">
                <span>Wins: {gameStats.wins}</span>
                <span>Losses: {gameStats.losses}</span>
                <span>Draws: {gameStats.draws}</span>
              </div>
            )}
          </>
        )}
      </div>

      <AnimatePresence>
        {winner && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 flex items-center justify-center bg-black/80 z-50"
          >
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="bg-dark p-8 rounded-lg text-center"
            >
              <h2 className="text-4xl font-bold mb-4">
                {winner === 'draw' ? "It's a Draw!" : (
                  gameMode === 'ai' && winner === 'O' 
                    ? "AI Wins!" 
                    : `Player ${winner} Wins!`
                )}
              </h2>
              <div className="flex space-x-3">
                <button
                  onClick={resetGame}
                  className="btn-primary px-6 py-2 text-lg"
                >
                  Return to Lobby
                </button>
                <button
                  onClick={() => {
                    // Reset game state but stay in game mode
                    setBoard(initialBoard);
                    setIsXNext(true);
                    setWinner(null);
                  }}
                  className="bg-dark-lighter hover:bg-dark-light text-white px-6 py-2 text-lg rounded"
                >
                  Play Again
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TicTacToe; 