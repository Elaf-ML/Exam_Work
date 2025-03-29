import React from 'react';
import { ChessColor } from './Chess';

interface ChessLobbyProps {
  onClose: () => void;
  onCreateLobby: (isPublic: boolean, timeControl?: { minutes: number, increment: number }, chatEnabled?: boolean) => Promise<string | null>;
  onJoinLobby: (lobbyId: string) => Promise<boolean>;
  lobbyCode: string;
  setLobbyCode: (code: string) => void;
  selectedColor: ChessColor;
  setSelectedColor: (color: ChessColor) => void;
  isLoading: boolean;
}

const ChessLobby: React.FC<ChessLobbyProps> = ({
  onClose,
  onCreateLobby,
  onJoinLobby,
  lobbyCode,
  setLobbyCode,
  selectedColor,
  setSelectedColor,
  isLoading
}) => {
  const [isPublic, setIsPublic] = React.useState(false);
  const [chatEnabled, setChatEnabled] = React.useState(true);
  const [useTimer, setUseTimer] = React.useState(false);
  const [minutes, setMinutes] = React.useState(10);
  const [increment, setIncrement] = React.useState(0);
  const [tab, setTab] = React.useState<'create' | 'join'>('create');

  const handleCreateLobby = async () => {
    if (isLoading) return;
    
    const timeControl = useTimer ? { minutes, increment } : undefined;
    await onCreateLobby(isPublic, timeControl, chatEnabled);
  };

  const handleJoinLobby = async () => {
    if (isLoading || !lobbyCode.trim()) return;
    await onJoinLobby(lobbyCode.trim());
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-indigo-300">Chess Lobby</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700 mb-6">
          <button
            className={`py-2 px-4 ${tab === 'create' 
              ? 'text-indigo-300 border-b-2 border-indigo-300 font-medium' 
              : 'text-gray-400 hover:text-gray-200'}`}
            onClick={() => setTab('create')}
          >
            Create Game
          </button>
          <button
            className={`py-2 px-4 ${tab === 'join' 
              ? 'text-indigo-300 border-b-2 border-indigo-300 font-medium' 
              : 'text-gray-400 hover:text-gray-200'}`}
            onClick={() => setTab('join')}
          >
            Join Game
          </button>
        </div>

        {/* Create Game Tab */}
        {tab === 'create' && (
          <div className="space-y-4">
            {/* Color Selection */}
            <div>
              <label className="block text-gray-300 mb-2">Choose Your Color</label>
              <div className="flex space-x-4">
                <button
                  className={`w-1/2 p-3 rounded-lg flex items-center justify-center ${
                    selectedColor === 'white'
                      ? 'bg-white text-gray-900 font-medium'
                      : 'bg-gray-700 text-white hover:bg-gray-600'
                  }`}
                  onClick={() => setSelectedColor('white')}
                >
                  <span className="mr-2">♙</span> White
                </button>
                <button
                  className={`w-1/2 p-3 rounded-lg flex items-center justify-center ${
                    selectedColor === 'black'
                      ? 'bg-gray-900 text-white font-medium border border-gray-700'
                      : 'bg-gray-700 text-white hover:bg-gray-600'
                  }`}
                  onClick={() => setSelectedColor('black')}
                >
                  <span className="mr-2">♟</span> Black
                </button>
              </div>
            </div>

            {/* Game Options */}
            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="public-lobby"
                  checked={isPublic}
                  onChange={() => setIsPublic(!isPublic)}
                  className="mr-2 h-4 w-4"
                />
                <label htmlFor="public-lobby" className="text-gray-300">Public Lobby (Anyone can join)</label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="chat-enabled"
                  checked={chatEnabled}
                  onChange={() => setChatEnabled(!chatEnabled)}
                  className="mr-2 h-4 w-4"
                />
                <label htmlFor="chat-enabled" className="text-gray-300">Enable Chat</label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="use-timer"
                  checked={useTimer}
                  onChange={() => setUseTimer(!useTimer)}
                  className="mr-2 h-4 w-4"
                />
                <label htmlFor="use-timer" className="text-gray-300">Use Chess Clock</label>
              </div>
              
              {useTimer && (
                <div className="grid grid-cols-2 gap-4 mt-2 pl-6">
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">Minutes per side</label>
                    <select
                      value={minutes}
                      onChange={(e) => setMinutes(Number(e.target.value))}
                      className="w-full bg-gray-700 text-white px-3 py-2 rounded"
                    >
                      {[1, 3, 5, 10, 15, 30, 60].map(min => (
                        <option key={min} value={min}>{min} min</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">Increment (sec)</label>
                    <select
                      value={increment}
                      onChange={(e) => setIncrement(Number(e.target.value))}
                      className="w-full bg-gray-700 text-white px-3 py-2 rounded"
                    >
                      {[0, 1, 2, 3, 5, 10, 15, 30].map(inc => (
                        <option key={inc} value={inc}>{inc} sec</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleCreateLobby}
              disabled={isLoading}
              className="w-full px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium mt-4"
            >
              {isLoading ? 'Creating...' : 'Create Game'}
            </button>
          </div>
        )}

        {/* Join Game Tab */}
        {tab === 'join' && (
          <div className="space-y-4">
            <div>
              <label className="block text-gray-300 mb-2">Enter Lobby ID</label>
              <input
                type="text"
                value={lobbyCode}
                onChange={(e) => setLobbyCode(e.target.value)}
                placeholder="Enter Lobby ID"
                className="w-full bg-gray-700 text-white px-3 py-2 rounded"
              />
            </div>

            <div>
              <label className="block text-gray-300 mb-2">Preferred Color</label>
              <div className="flex space-x-4 mb-6">
                <button
                  className={`w-1/2 p-3 rounded-lg flex items-center justify-center ${
                    selectedColor === 'white'
                      ? 'bg-white text-gray-900 font-medium'
                      : 'bg-gray-700 text-white hover:bg-gray-600'
                  }`}
                  onClick={() => setSelectedColor('white')}
                >
                  <span className="mr-2">♙</span> White
                </button>
                <button
                  className={`w-1/2 p-3 rounded-lg flex items-center justify-center ${
                    selectedColor === 'black'
                      ? 'bg-gray-900 text-white font-medium border border-gray-700'
                      : 'bg-gray-700 text-white hover:bg-gray-600'
                  }`}
                  onClick={() => setSelectedColor('black')}
                >
                  <span className="mr-2">♟</span> Black
                </button>
              </div>
              <p className="text-gray-400 text-sm mt-1">
                Note: If the host already chose your preferred color, you'll be assigned the opposite color.
              </p>
            </div>

            <button
              onClick={handleJoinLobby}
              disabled={isLoading || !lobbyCode.trim()}
              className={`w-full px-4 py-3 text-white rounded-lg font-medium mt-4 ${
                isLoading || !lobbyCode.trim() 
                  ? 'bg-gray-600 cursor-not-allowed' 
                  : 'bg-indigo-600 hover:bg-indigo-500'
              }`}
            >
              {isLoading ? 'Joining...' : 'Join Game'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChessLobby; 