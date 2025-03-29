// Chess.ts - Type definitions for the Chess game

export type ChessColor = 'white' | 'black';

export type ChessPiece = {
  type: 'pawn' | 'knight' | 'bishop' | 'rook' | 'queen' | 'king';
  color: ChessColor;
  hasMoved?: boolean;
};

export type ChessBoard = Array<Array<ChessPiece | null>>;

export interface TimeControl {
  minutes: number;
  increment: number; // Seconds to add after each move
}

export interface ChessLobby {
  id: string;
  hostId: string;
  guestId?: string;
  hostColor: ChessColor;
  guestColor: ChessColor;
  isPublic: boolean;
  allowChat: boolean;
  timeControl?: TimeControl;
  createdAt: number;
  status: 'waiting' | 'playing' | 'completed';
  moves: string[]; // Moves in algebraic notation
}

export interface ChessGame {
  id: string;
  lobbyId: string;
  hostId: string;
  guestId: string;
  currentTurn: ChessColor;
  board: ChessBoard;
  moves: string[]; // Moves in algebraic notation
  status: 'active' | 'checkmate' | 'stalemate' | 'draw' | 'resigned';
  winner?: ChessColor;
  startTime: number;
  timeControl?: TimeControl;
  hostTimeRemaining?: number;
  guestTimeRemaining?: number;
  lastMoveTime?: number;
  lastMoveFrom?: ChessSquare;
  lastMoveTo?: ChessSquare;
  inCheck?: ChessColor;
  chat?: ChatMessage[];
}

export interface ChatMessage {
  senderId: string;
  timestamp: number;
  message: string;
}

export interface ChessMessage {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: number;
}

export type ChessSquare = {
  row: number;
  col: number;
};

export type ChessMove = {
  from: ChessSquare;
  to: ChessSquare;
  promotion?: 'knight' | 'bishop' | 'rook' | 'queen';
  isCapture?: boolean;
  isCheck?: boolean;
  isCheckmate?: boolean;
  isCastle?: 'kingside' | 'queenside';
  isEnPassant?: boolean;
};

export interface MoveResult {
  valid: boolean;
  error?: string;
  move?: ChessMove;
  newBoard?: ChessBoard;
  inCheck?: ChessColor;
  isCheckmate?: boolean;
  isStalemate?: boolean;
  isDraw?: boolean;
} 