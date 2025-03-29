import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { db } from '../../../firebase/config';
import { doc, updateDoc, getDoc, setDoc, onSnapshot, collection, query, where } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { useLocation, useSearchParams } from 'react-router-dom';
import ChessBoard from './ChessBoard';
import ChessLobby from './ChessLobby';
import WaitingRoom from './WaitingRoom';

// Types
export type ChessColor = 'white' | 'black';
export type GameStatus = 'waiting' | 'playing' | 'completed';
export type GameResult = 'checkmate' | 'stalemate' | 'draw' | 'resignation' | null;

export interface ChessLobby {
  id: string;
  hostId: string;
  guestId?: string;
  createdAt: number;
  status: GameStatus;
  isPublic: boolean;
  timeControl?: {
    minutes: number;
    increment: number;
  };
  hostColor: ChessColor;
  guestColor: ChessColor;
  winner?: 'host' | 'guest';
  gameResult?: GameResult;
  allowChat: boolean;
  moves: string[]; // List of moves in algebraic notation
}

export interface ChessMessage {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: number;
}

const Chess = () => {
  // Auth and routing
  const { currentUser } = useAuth();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  
  // Game state
  const [isLoading, setIsLoading] = useState(false);
  const [showLobby, setShowLobby] = useState(false);
  const [showWaitingRoom, setShowWaitingRoom] = useState(false);
  const [gameLobby, setGameLobby] = useState<ChessLobby | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [lobbyCode, setLobbyCode] = useState('');
  const [inviteUrl, setInviteUrl] = useState('');
  const [selectedColor, setSelectedColor] = useState<ChessColor>('white');
  const [gameStarted, setGameStarted] = useState(false);
  const [messages, setMessages] = useState<ChessMessage[]>([]);

  // Check for lobby ID in URL on component mount
  useEffect(() => {
    const lobbyId = searchParams.get('lobbyId');
    if (lobbyId) {
      joinLobbyAsGuest(lobbyId);
    }
  }, [searchParams]);

  // Create a new chess lobby
  const createLobby = async (isPublic: boolean = false, timeControl?: { minutes: number, increment: number }, chatEnabled: boolean = true): Promise<string | null> => {
    if (!currentUser) {
      toast.error("You need to be logged in to create a chess game");
      return null;
    }
    
    try {
      setIsLoading(true);
      
      // Generate a random lobby ID
      const lobbyId = Math.random().toString(36).substring(2, 10);
      
      // Create the lobby data
      const lobbyData: ChessLobby = {
        id: lobbyId,
        hostId: currentUser.uid,
        createdAt: Date.now(),
        status: 'waiting',
        isPublic,
        timeControl,
        hostColor: selectedColor,
        guestColor: selectedColor === 'white' ? 'black' : 'white',
        allowChat: chatEnabled,
        moves: []
      };
      
      // Save to Firestore
      await setDoc(doc(db, 'chessLobbies', lobbyId), lobbyData);
      
      // Update local state
      setGameLobby(lobbyData);
      setIsHost(true);
      setShowLobby(false);
      setShowWaitingRoom(true);
      
      // Create invite URL
      const baseUrl = window.location.origin + window.location.pathname;
      const invite = `${baseUrl}?lobbyId=${lobbyId}`;
      setInviteUrl(invite);
      
      toast.success(`Chess lobby created! Your lobby code is: ${lobbyId}`);
      
      return lobbyId;
    } catch (error) {
      console.error('Error creating chess lobby:', error);
      toast.error('Failed to create chess lobby');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Join a lobby as guest
  const joinLobbyAsGuest = async (lobbyId: string) => {
    if (!currentUser) {
      toast.error('You need to be logged in to join a chess game');
      return false;
    }
    
    try {
      setIsLoading(true);
      
      // Check if lobby exists
      const lobbyRef = doc(db, 'chessLobbies', lobbyId);
      const lobbySnap = await getDoc(lobbyRef);
      
      if (!lobbySnap.exists()) {
        toast.error('Lobby not found or has expired');
        setIsLoading(false);
        return false;
      }
      
      const lobbyData = lobbySnap.data() as ChessLobby;
      
      // Check if lobby is available
      if (lobbyData.status !== 'waiting') {
        toast.error('This game has already started or completed');
        setIsLoading(false);
        return false;
      }
      
      // Check if joining own lobby
      if (lobbyData.hostId === currentUser.uid) {
        // If it's your own lobby, just show the waiting room
        setGameLobby(lobbyData);
        setIsHost(true);
        setShowLobby(false);
        setShowWaitingRoom(true);
        setIsLoading(false);
        return true;
      }
      
      // Choose opposite color if host has already selected
      let guestColor: ChessColor | undefined = selectedColor;
      if (lobbyData.hostColor === selectedColor) {
        guestColor = lobbyData.hostColor === 'white' ? 'black' : 'white';
        toast.success(`Host already selected ${lobbyData.hostColor}. You've been assigned ${guestColor}.`);
      }
      
      // Join the lobby
      await updateDoc(lobbyRef, { 
        guestId: currentUser.uid,
        guestColor 
      });
      
      // Update local state
      setGameLobby({...lobbyData, guestId: currentUser.uid, guestColor});
      setIsHost(false);
      setSelectedColor(guestColor || 'black');
      setShowLobby(false);
      setShowWaitingRoom(true);
      
      // Create invite URL
      const baseUrl = window.location.origin + window.location.pathname;
      const invite = `${baseUrl}?lobbyId=${lobbyId}`;
      setInviteUrl(invite);
      
      toast.success('Successfully joined chess lobby');
      return true;
    } catch (error) {
      console.error('Error joining lobby:', error);
      toast.error('Failed to join chess lobby');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Start the chess game
  const startGame = async () => {
    if (!gameLobby || !isHost) return;
    
    try {
      setIsLoading(true);
      
      // Update lobby status
      await updateDoc(doc(db, 'chessLobbies', gameLobby.id), {
        status: 'playing'
      });
      
      setGameStarted(true);
      setShowWaitingRoom(false);
      
      toast.success('Game started!');
    } catch (error) {
      console.error('Error starting game:', error);
      toast.error('Failed to start the game');
    } finally {
      setIsLoading(false);
    }
  };

  // Listen for lobby updates
  useEffect(() => {
    if (!gameLobby?.id) return;
    
    const unsubscribe = onSnapshot(doc(db, 'chessLobbies', gameLobby.id), (snapshot) => {
      if (snapshot.exists()) {
        const lobbyData = snapshot.data() as ChessLobby;
        setGameLobby(lobbyData);
        
        // Handle game status changes
        if (lobbyData.status === 'playing' && !gameStarted) {
          setGameStarted(true);
          setShowWaitingRoom(false);
        }
        
        // Handle game results
        if (lobbyData.status === 'completed' && lobbyData.gameResult) {
          handleGameEnd(lobbyData.gameResult, lobbyData.winner);
        }
      }
    });
    
    return () => unsubscribe();
  }, [gameLobby?.id, gameStarted]);

  // Listen for chat messages
  useEffect(() => {
    if (!gameLobby?.id || !gameLobby.allowChat) return;
    
    const unsubscribe = onSnapshot(
      query(collection(db, 'chessMessages'), where('lobbyId', '==', gameLobby.id)),
      (snapshot) => {
        const newMessages: ChessMessage[] = [];
        snapshot.forEach(doc => {
          newMessages.push({ id: doc.id, ...doc.data() } as ChessMessage);
        });
        
        // Sort messages by timestamp
        newMessages.sort((a, b) => a.timestamp - b.timestamp);
        setMessages(newMessages);
      }
    );
    
    return () => unsubscribe();
  }, [gameLobby?.id, gameLobby?.allowChat]);

  // Send a chat message
  const sendMessage = async (message: string) => {
    if (!currentUser || !gameLobby?.id || !message.trim()) return;
    
    try {
      const messageId = Math.random().toString(36).substring(2, 15);
      const messageData: ChessMessage & { lobbyId: string } = {
        id: messageId,
        lobbyId: gameLobby.id,
        senderId: currentUser.uid,
        senderName: currentUser.displayName || 'Anonymous',
        message: message.trim(),
        timestamp: Date.now()
      };
      
      await setDoc(doc(db, 'chessMessages', messageId), messageData);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  // Handle game end
  const handleGameEnd = (result: GameResult, winner?: 'host' | 'guest') => {
    let resultMessage = '';
    
    switch (result) {
      case 'checkmate':
        resultMessage = winner 
          ? `Game over by checkmate. ${winner === (isHost ? 'host' : 'guest') ? 'You won!' : 'You lost!'}`
          : 'Game over by checkmate.';
        break;
      case 'stalemate':
        resultMessage = 'Game over by stalemate. It\'s a draw!';
        break;
      case 'draw':
        resultMessage = 'Game over. Players agreed to a draw.';
        break;
      case 'resignation':
        resultMessage = winner 
          ? `Game over. ${winner === (isHost ? 'host' : 'guest') ? 'You won!' : 'Opponent resigned.'}`
          : 'Game over by resignation.';
        break;
      default:
        resultMessage = 'Game over.';
    }
    
    toast.success(resultMessage);
  };

  // Open lobby screen
  const openLobby = () => {
    setShowLobby(true);
  };

  // Leave current game/lobby
  const leaveLobby = async () => {
    if (!gameLobby?.id) return;
    
    try {
      setIsLoading(true);
      
      // If the game is in progress, this counts as resignation
      if (gameLobby.status === 'playing') {
        await updateDoc(doc(db, 'chessLobbies', gameLobby.id), {
          status: 'completed',
          gameResult: 'resignation',
          winner: isHost ? 'guest' : 'host'
        });
      } else {
        // If game hasn't started, just mark it as completed
        await updateDoc(doc(db, 'chessLobbies', gameLobby.id), {
          status: 'completed'
        });
      }
      
      // Reset state
      setGameLobby(null);
      setShowWaitingRoom(false);
      setShowLobby(false);
      setGameStarted(false);
      
      toast.success('You have left the game.');
    } catch (error) {
      console.error('Error leaving lobby:', error);
      toast.error('Failed to leave lobby');
    } finally {
      setIsLoading(false);
    }
  };

  // Copy invite link or lobby ID
  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteUrl)
      .then(() => toast.success('Invite link copied to clipboard!'))
      .catch(() => toast.error('Failed to copy invite link'));
  };

  const copyLobbyId = () => {
    if (!gameLobby?.id) return;
    
    navigator.clipboard.writeText(gameLobby.id)
      .then(() => toast.success('Lobby ID copied to clipboard!'))
      .catch(() => toast.error('Failed to copy Lobby ID'));
  };

  // Main render
  return (
    <div className="chess-container relative p-4 md:p-6 bg-gray-900 min-h-screen flex flex-col justify-center items-center">
      <div className="w-full max-w-4xl">
        <div className="bg-gray-800 shadow-lg rounded-xl overflow-hidden">
          <div className="p-4 md:p-6">
            <div className="mb-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-indigo-300">Chess</h2>
              <div className="flex space-x-2">
                <button
                  onClick={openLobby}
                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-sm"
                >
                  Play Online
                </button>
              </div>
            </div>
          </div>

          {/* Main Game Area */}
          <div className="game-wrapper relative">
            {!gameStarted && !showLobby && !showWaitingRoom && (
              <div className="flex flex-col items-center justify-center p-8">
                <h3 className="text-2xl text-white mb-6">Welcome to Chess</h3>
                <button
                  onClick={openLobby}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium mb-4"
                >
                  Play Online
                </button>
                <div className="flex space-x-4">
                  <div className="w-full max-w-md bg-gray-800 p-4 rounded-lg mt-4">
                    <h4 className="text-xl font-semibold text-gray-200 mb-3">Join with Lobby ID</h4>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={lobbyCode}
                        onChange={(e) => setLobbyCode(e.target.value)}
                        placeholder="Enter Lobby ID"
                        className="flex-1 bg-gray-700 text-gray-200 px-3 py-2 rounded-l"
                      />
                      <button
                        onClick={() => joinLobbyAsGuest(lobbyCode)}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-r"
                      >
                        Join
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Game Board (shown when game is active) */}
            {gameStarted && gameLobby && (
              <ChessBoard 
                lobby={gameLobby}
                isHost={isHost}
                playerColor={isHost ? gameLobby.hostColor || 'white' : gameLobby.guestColor || 'black'}
                onLeaveGame={leaveLobby}
                onSendMessage={sendMessage}
                messages={messages}
              />
            )}
          </div>
        </div>
      </div>

      {/* Chess Lobby */}
      {showLobby && (
        <ChessLobby
          onClose={() => setShowLobby(false)}
          onCreateLobby={createLobby}
          onJoinLobby={joinLobbyAsGuest}
          lobbyCode={lobbyCode}
          setLobbyCode={setLobbyCode}
          selectedColor={selectedColor}
          setSelectedColor={setSelectedColor}
          isLoading={isLoading}
        />
      )}

      {/* Waiting Room */}
      {showWaitingRoom && gameLobby && (
        <WaitingRoom
          lobby={gameLobby}
          isHost={isHost}
          inviteUrl={inviteUrl}
          onStartGame={startGame}
          onLeaveLobby={leaveLobby}
          onCopyInvite={copyInviteLink}
          onCopyLobbyId={copyLobbyId}
          selectedColor={selectedColor}
          setSelectedColor={setSelectedColor}
          isLoading={isLoading}
        />
      )}
    </div>
  );
};

export default Chess; 