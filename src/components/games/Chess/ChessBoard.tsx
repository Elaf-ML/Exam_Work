import React, { useState, useEffect, useRef } from 'react';
import { ChessLobby, ChessMessage, ChessColor, ChessBoard as ChessBoardType } from './Chess';
import ChessLogic from './ChessLogic';

interface ChessBoardProps {
  lobby: ChessLobby;
  isHost: boolean;
  playerColor: ChessColor;
  onLeaveGame: () => void;
  onSendMessage: (message: string) => void;
  messages: ChessMessage[];
}

const ChessBoard: React.FC<ChessBoardProps> = ({
  lobby,
  isHost,
  playerColor,
  onLeaveGame,
  onSendMessage,
  messages
}) => {
  const [board, setBoard] = useState<ChessBoardType>([]);
  const [selectedSquare, setSelectedSquare] = useState<{ row: number, col: number } | null>(null);
  const [validMoves, setValidMoves] = useState<{ row: number, col: number }[]>([]);
  const [message, setMessage] = useState('');
  const chessLogic = useRef(new ChessLogic());
  const boardRef = useRef<HTMLDivElement>(null);

  // Initialize the board
  useEffect(() => {
    // This would typically come from the server in a real implementation
    const initialBoard: ChessBoardType = [
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
    
    setBoard(initialBoard);
  }, []);

  const handleSquareClick = (row: number, col: number) => {
    if (selectedSquare) {
      // If a square is already selected, try to make a move
      const piece = board[selectedSquare.row][selectedSquare.col];
      
      if (piece && piece.color === playerColor) {
        // Check if this is a valid move
        const isValidMove = validMoves.some(
          move => move.row === row && move.col === col
        );
        
        if (isValidMove) {
          // Make the move
          console.log(`Moving from (${selectedSquare.row},${selectedSquare.col}) to (${row},${col})`);
          // In a real implementation, this would update the game state on the server
        }
      }
      
      setSelectedSquare(null);
      setValidMoves([]);
    } else {
      // If no square is selected, select this one if it has a piece of the player's color
      const piece = board[row][col];
      
      if (piece && piece.color === playerColor) {
        setSelectedSquare({ row, col });
        // Get valid moves for this piece
        const moves = chessLogic.current.getValidMoves(board, row, col);
        setValidMoves(moves.map(move => move.to));
      }
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  // Determine if the board should be flipped (black pieces at bottom)
  const flipBoard = playerColor === 'black';

  return (
    <div className="flex flex-col md:flex-row gap-4">
      {/* Chess Board */}
      <div className="flex-1">
        <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-indigo-300">
              {isHost ? 'Your Game' : 'Chess Match'}
            </h3>
            <button
              onClick={onLeaveGame}
              className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded"
            >
              Leave Game
            </button>
          </div>
          
          {/* Board */}
          <div ref={boardRef} className="relative aspect-square w-full max-w-[600px] mx-auto">
            <div className="grid grid-cols-8 gap-0 border-2 border-gray-700 w-full h-full">
              {board.length > 0 && Array.from({ length: 8 }, (_, rowIdx) => {
                const row = flipBoard ? 7 - rowIdx : rowIdx;
                
                return Array.from({ length: 8 }, (_, colIdx) => {
                  const col = flipBoard ? 7 - colIdx : colIdx;
                  const piece = board[row][col];
                  const isLight = (row + col) % 2 === 0;
                  const isSelected = selectedSquare?.row === row && selectedSquare?.col === col;
                  const isValidMove = validMoves.some(move => move.row === row && move.col === col);
                  
                  return (
                    <div
                      key={`${row}-${col}`}
                      className={`relative flex items-center justify-center
                        ${isLight ? 'bg-amber-100' : 'bg-amber-800'}
                        ${isSelected ? 'bg-blue-400' : ''}
                        ${isValidMove ? 'bg-green-300' : ''}
                      `}
                      onClick={() => handleSquareClick(row, col)}
                    >
                      {piece && (
                        <div className={`text-4xl ${piece.color === 'white' ? 'text-white' : 'text-black'}`}>
                          {getPieceSymbol(piece.type)}
                        </div>
                      )}
                    </div>
                  );
                });
              })}
            </div>
          </div>
        </div>
      </div>
      
      {/* Chat */}
      {lobby.allowChat && (
        <div className="w-full md:w-80">
          <div className="bg-gray-800 p-4 rounded-lg shadow-lg h-full">
            <h3 className="text-xl font-semibold text-indigo-300 mb-4">Game Chat</h3>
            
            <div className="h-60 overflow-y-auto mb-4 bg-gray-900 rounded p-3">
              {messages.length === 0 ? (
                <div className="text-gray-500 text-center py-4">No messages yet</div>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className="mb-2">
                    <span className="font-medium text-indigo-300">{msg.senderName}: </span>
                    <span className="text-gray-300">{msg.message}</span>
                  </div>
                ))
              )}
            </div>
            
            <form onSubmit={handleSendMessage} className="flex">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-gray-700 text-white px-3 py-2 rounded-l"
              />
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-r"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function to get chess piece symbols
function getPieceSymbol(type: string): string {
  switch (type) {
    case 'king': return '♚';
    case 'queen': return '♛';
    case 'rook': return '♜';
    case 'bishop': return '♝';
    case 'knight': return '♞';
    case 'pawn': return '♟';
    default: return '';
  }
}

export default ChessBoard; 