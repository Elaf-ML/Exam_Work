import React from 'react';
import { ChessLobby, ChessColor } from './Chess';

interface WaitingRoomProps {
  lobby: ChessLobby;
  isHost: boolean;
  inviteUrl: string;
  onStartGame: () => void;
  onLeaveLobby: () => void;
  onCopyInvite: () => void;
  onCopyLobbyId: () => void;
  selectedColor: ChessColor;
  setSelectedColor: (color: ChessColor) => void;
  isLoading: boolean;
}

const WaitingRoom: React.FC<WaitingRoomProps> = ({
  lobby,
  isHost,
  inviteUrl,
  onStartGame,
  onLeaveLobby,
  onCopyInvite,
  onCopyLobbyId,
  setSelectedColor,
  isLoading
}) => {

  
  const guestJoined = Boolean(lobby.guestId);
  const canStartGame = isHost && guestJoined;
  
  const timeFormat = lobby.timeControl 
    ? `${lobby.timeControl.minutes} min${lobby.timeControl.increment > 0 ? ' + ' + lobby.timeControl.increment + ' sec' : ''}`
    : 'No time limit';

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-xl p-6 max-w-lg w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-indigo-300">
            {isHost ? 'Your Chess Room' : 'Waiting Room'}
          </h2>
          <button
            onClick={onLeaveLobby}
            className="text-gray-400 hover:text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Room Information */}
        <div className="bg-gray-700 p-4 rounded-lg mb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3">
            <div className="flex items-center mb-2 sm:mb-0">
              <span className="text-gray-300 mr-2">Room ID:</span>
              <span className="text-white font-medium">{lobby.id}</span>
            </div>
            <button
              onClick={onCopyLobbyId}
              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-sm"
            >
              Copy ID
            </button>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div className="flex items-center mb-2 sm:mb-0">
              <span className="text-gray-300 mr-2">Room Type:</span>
              <span className="text-white font-medium">
                {lobby.isPublic ? 'Public' : 'Private'}
              </span>
            </div>
            {lobby.timeControl && (
              <div className="flex items-center">
                <span className="text-gray-300 mr-2">Time Control:</span>
                <span className="text-white font-medium">{timeFormat}</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Invite Link */}
        {isHost && !guestJoined && (
          <div className="bg-gray-700 p-4 rounded-lg mb-4">
            <p className="text-white mb-2">Invite your friend to play:</p>
            <div className="flex">
              <input
                type="text"
                value={inviteUrl}
                readOnly
                className="bg-gray-900 text-gray-300 px-3 py-2 rounded-l flex-grow truncate"
              />
              <button
                onClick={onCopyInvite}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 rounded-r whitespace-nowrap"
              >
                Copy
              </button>
            </div>
          </div>
        )}

        {/* Players */}
        <div className="bg-gray-700 p-4 rounded-lg mb-4">
          <h3 className="text-lg font-semibold text-white mb-3">Players</h3>
          
          {/* Host (You) */}
          <div className="flex items-center justify-between bg-gray-800 p-3 rounded mb-3">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold mr-3">
                {isHost ? 'Y' : 'H'}
              </div>
              <div>
                <p className="text-white font-medium">
                  {isHost ? 'You (Host)' : 'Host'}
                </p>
                <div className="flex items-center">
                  <span className="text-gray-400 text-sm mr-2">Playing as:</span>
                  <span className={`text-sm font-medium ${lobby.hostColor === 'white' ? 'text-white' : 'text-gray-300'}`}>
                    {lobby.hostColor === 'white' ? '♙ White' : '♟ Black'}
                  </span>
                </div>
              </div>
            </div>
            <div className="px-3 py-1 bg-green-600 text-white rounded-full text-xs">
              Ready
            </div>
          </div>
          
          {/* Guest */}
          {guestJoined ? (
            <div className="flex items-center justify-between bg-gray-800 p-3 rounded">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold mr-3">
                  {!isHost ? 'Y' : 'G'}
                </div>
                <div>
                  <p className="text-white font-medium">
                    {!isHost ? 'You (Guest)' : 'Guest'}
                  </p>
                  <div className="flex items-center">
                    <span className="text-gray-400 text-sm mr-2">Playing as:</span>
                    <span className={`text-sm font-medium ${lobby.guestColor === 'white' ? 'text-white' : 'text-gray-300'}`}>
                      {lobby.guestColor === 'white' ? '♙ White' : '♟ Black'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="px-3 py-1 bg-green-600 text-white rounded-full text-xs">
                Ready
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between bg-gray-800 p-3 rounded">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-white font-bold mr-3">
                  ?
                </div>
                <div className="flex items-center">
                  <p className="text-gray-400">Waiting for opponent...</p>
                  <div className="ml-2 flex">
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce mx-1" style={{ animationDelay: '300ms' }}></div>
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '600ms' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Color Selection (host only) */}
        {isHost && (
          <div className="bg-gray-700 p-4 rounded-lg mb-4">
            <h3 className="text-lg font-semibold text-white mb-3">Your Color</h3>
            <div className="flex space-x-4">
              <button
                className={`w-1/2 p-3 rounded-lg flex items-center justify-center ${
                  lobby.hostColor === 'white'
                    ? 'bg-white text-gray-900 font-medium'
                    : 'bg-gray-800 text-white hover:bg-gray-600'
                }`}
                onClick={() => setSelectedColor('white')}
                disabled={guestJoined && lobby.guestColor === 'white'}
              >
                <span className="mr-2">♙</span> White
              </button>
              <button
                className={`w-1/2 p-3 rounded-lg flex items-center justify-center ${
                  lobby.hostColor === 'black'
                    ? 'bg-gray-900 text-white font-medium border border-gray-700'
                    : 'bg-gray-800 text-white hover:bg-gray-600'
                }`}
                onClick={() => setSelectedColor('black')}
                disabled={guestJoined && lobby.guestColor === 'black'}
              >
                <span className="mr-2">♟</span> Black
              </button>
            </div>
          </div>
        )}

        {/* Host Controls */}
        {isHost && (
          <div className="flex space-x-3">
            <button
              onClick={onStartGame}
              disabled={!canStartGame || isLoading}
              className={`flex-1 px-4 py-3 rounded-lg font-medium ${
                canStartGame && !isLoading
                  ? 'bg-green-600 hover:bg-green-500 text-white'
                  : 'bg-gray-600 text-gray-300 cursor-not-allowed'
              }`}
            >
              {isLoading ? 'Starting...' : 'Start Game'}
            </button>
            <button
              onClick={onLeaveLobby}
              disabled={isLoading}
              className="px-4 py-3 bg-red-600 hover:bg-red-500 text-white rounded-lg font-medium"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Guest Controls */}
        {!isHost && (
          <div className="flex">
            <button
              onClick={onLeaveLobby}
              disabled={isLoading}
              className="w-full px-4 py-3 bg-red-600 hover:bg-red-500 text-white rounded-lg font-medium"
            >
              Leave Room
            </button>
          </div>
        )}

        {/* Waiting message for guest */}
        {!isHost && guestJoined && (
          <div className="mt-3 text-center text-gray-300">
            Waiting for host to start the game...
          </div>
        )}
      </div>
    </div>
  );
};

export default WaitingRoom; 