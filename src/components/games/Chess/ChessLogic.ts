import { ChessBoard, ChessMove, MoveResult, ChessPiece } from './Chess';

class ChessLogic {
  /**
   * Gets valid moves for a piece
   */
  getValidMoves(board: ChessBoard, row: number, col: number): ChessMove[] {
    const piece = board[row][col];
    if (!piece) return [];
    
    const moves: ChessMove[] = [];
    
    switch (piece.type) {
      case 'pawn':
        this.getPawnMoves(board, row, col, piece, moves);
        break;
      case 'knight':
        this.getKnightMoves(board, row, col, piece, moves);
        break;
      case 'bishop':
        this.getBishopMoves(board, row, col, piece, moves);
        break;
      case 'rook':
        this.getRookMoves(board, row, col, piece, moves);
        break;
      case 'queen':
        this.getQueenMoves(board, row, col, piece, moves);
        break;
      case 'king':
        this.getKingMoves(board, row, col, piece, moves);
        break;
    }
    
    // Filter out moves that would leave the king in check
    return moves.filter(move => !this.wouldBeInCheck(board, move, piece.color));
  }
  
  /**
   * Makes a move on the board
   */
  makeMove(board: ChessBoard, move: ChessMove): MoveResult {
    const piece = board[move.from.row][move.from.col];
    if (!piece) {
      return { valid: false, error: 'No piece at the source position' };
    }
    
    // Clone the board to avoid mutations
    const newBoard: ChessBoard = JSON.parse(JSON.stringify(board));
    
    // Move the piece
    newBoard[move.to.row][move.to.col] = {
      ...piece,
      hasMoved: true
    };
    newBoard[move.from.row][move.from.col] = null;
    
    // Handle special moves
    if (move.isCastle) {
      this.handleCastle(newBoard, move);
    }
    
    if (move.isEnPassant) {
      this.handleEnPassant(newBoard, move);
    }
    
    if (move.promotion) {
      newBoard[move.to.row][move.to.col] = {
        type: move.promotion,
        color: piece.color,
        hasMoved: true
      };
    }
    
    // Check if opponent is in check
    const opponentColor = piece.color === 'white' ? 'black' : 'white';
    const inCheck = this.isInCheck(newBoard, opponentColor);
    
    // Check for checkmate or stalemate
    const isCheckmate = inCheck && this.isCheckmate(newBoard, opponentColor);
    const isStalemate = !inCheck && this.isStalemate(newBoard, opponentColor);
    
    // Check for draw conditions (e.g., insufficient material)
    const isDraw = this.isDrawByInsufficientMaterial(newBoard);
    
    return {
      valid: true,
      move,
      newBoard,
      inCheck: inCheck ? opponentColor : undefined,
      isCheckmate,
      isStalemate,
      isDraw
    };
  }
  
  /**
   * Converts a move to algebraic notation
   */
  moveToAlgebraic(move: ChessMove): string {
    const files = 'abcdefgh';
    const ranks = '87654321';
    
    const fromSquare = files[move.from.col] + ranks[move.from.row];
    const toSquare = files[move.to.col] + ranks[move.to.row];
    
    let notation = '';
    
    if (move.isCastle === 'kingside') {
      return 'O-O';
    }
    if (move.isCastle === 'queenside') {
      return 'O-O-O';
    }
    
    // Add piece letter (except for pawns)
    // This is a simplified version - full algebraic notation has more details
    notation += fromSquare + toSquare;
    
    if (move.promotion) {
      notation += '=' + move.promotion.charAt(0).toUpperCase();
    }
    
    if (move.isCheck) {
      notation += '+';
    }
    
    if (move.isCheckmate) {
      notation += '#';
    }
    
    return notation;
  }
  
  // Methods to check the state of the game
  
  /**
   * Checks if a specific square is under attack by any opponent piece
   * This is a specialized function that doesn't cause recursion with king moves
   */
  isSquareUnderAttack(board: ChessBoard, row: number, col: number, byColor: 'white' | 'black'): boolean {
    // Check attacks from pawns
    const pawnDirection = byColor === 'white' ? 1 : -1;
    if (row - pawnDirection >= 0 && row - pawnDirection < 8) {
      // Check left diagonal
      if (col - 1 >= 0) {
        const piece = board[row - pawnDirection][col - 1];
        if (piece && piece.type === 'pawn' && piece.color === byColor) {
          return true;
        }
      }
      // Check right diagonal
      if (col + 1 < 8) {
        const piece = board[row - pawnDirection][col + 1];
        if (piece && piece.type === 'pawn' && piece.color === byColor) {
          return true;
        }
      }
    }
    
    // Check attacks from knights
    const knightMoves = [
      [-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]
    ];
    for (const [dr, dc] of knightMoves) {
      const newRow = row + dr;
      const newCol = col + dc;
      if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
        const piece = board[newRow][newCol];
        if (piece && piece.type === 'knight' && piece.color === byColor) {
          return true;
        }
      }
    }
    
    // Check attacks from bishops, rooks, and queens (linear attacks)
    const directions = [
      [-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]
    ];
    for (const [dr, dc] of directions) {
      let newRow = row + dr;
      let newCol = col + dc;
      while (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
        const piece = board[newRow][newCol];
        if (piece) {
          if (piece.color === byColor) {
            // Check for correct piece types based on direction
            const isDiagonal = dr !== 0 && dc !== 0;
            const isOrthogonal = dr === 0 || dc === 0;
            if ((isDiagonal && (piece.type === 'bishop' || piece.type === 'queen')) ||
                (isOrthogonal && (piece.type === 'rook' || piece.type === 'queen'))) {
              return true;
            }
          }
          // Stop checking in this direction if we hit any piece
          break;
        }
        newRow += dr;
        newCol += dc;
      }
    }
    
    // Check attacks from king (1 square in any direction)
    for (const [dr, dc] of directions) {
      const newRow = row + dr;
      const newCol = col + dc;
      if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
        const piece = board[newRow][newCol];
        if (piece && piece.type === 'king' && piece.color === byColor) {
          return true;
        }
      }
    }
    
    return false;
  }
  
  /**
   * Checks if a king is in check
   */
  isInCheck(board: ChessBoard, color: 'white' | 'black'): boolean {
    // Find the king position
    let kingRow = -1;
    let kingCol = -1;
    
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece && piece.type === 'king' && piece.color === color) {
          kingRow = r;
          kingCol = c;
          break;
        }
      }
      if (kingRow !== -1) break;
    }
    
    // If king not found, something is wrong
    if (kingRow === -1 || kingCol === -1) {
      return false;
    }
    
    // Check if the king's position is under attack
    const opponentColor = color === 'white' ? 'black' : 'white';
    return this.isSquareUnderAttack(board, kingRow, kingCol, opponentColor);
  }
  
  /**
   * Checks if making a move would leave the king in check
   */
  wouldBeInCheck(board: ChessBoard, move: ChessMove, color: 'white' | 'black'): boolean {
    // Create a copy of the board
    const testBoard: ChessBoard = JSON.parse(JSON.stringify(board));
    
    // Make the move on the test board
    const piece = testBoard[move.from.row][move.from.col];
    testBoard[move.to.row][move.to.col] = piece;
    testBoard[move.from.row][move.from.col] = null;
    
    // Special handling for castling - move the rook too
    if (move.isCastle) {
      if (move.isCastle === 'kingside') {
        // Move the kingside rook
        const rookRow = color === 'white' ? 7 : 0;
        testBoard[rookRow][5] = testBoard[rookRow][7];
        testBoard[rookRow][7] = null;
      } else if (move.isCastle === 'queenside') {
        // Move the queenside rook
        const rookRow = color === 'white' ? 7 : 0;
        testBoard[rookRow][3] = testBoard[rookRow][0];
        testBoard[rookRow][0] = null;
      }
    }
    
    // Special handling for en passant - remove the captured pawn
    if (move.isEnPassant) {
      const capturedRow = move.from.row;
      const capturedCol = move.to.col;
      testBoard[capturedRow][capturedCol] = null;
    }
    
    // Check if the king is in check after the move
    return this.isInCheck(testBoard, color);
  }
  
  /**
   * Checks if a player is in checkmate
   */
  isCheckmate(board: ChessBoard, color: 'white' | 'black'): boolean {
    // If the king is not in check, it can't be checkmate
    if (!this.isInCheck(board, color)) {
      return false;
    }
    
    // Check if any move can get the king out of check
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece && piece.color === color) {
          const moves = this.getValidMoves(board, r, c);
          if (moves.length > 0) {
            return false;
          }
        }
      }
    }
    
    return true;
  }
  
  /**
   * Checks if a player is in stalemate
   */
  isStalemate(board: ChessBoard, color: 'white' | 'black'): boolean {
    // If the king is in check, it's not stalemate
    if (this.isInCheck(board, color)) {
      return false;
    }
    
    // Check if any piece can make a legal move
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece && piece.color === color) {
          const moves = this.getValidMoves(board, r, c);
          if (moves.length > 0) {
            return false;
          }
        }
      }
    }
    
    return true;
  }
  
  /**
   * Checks if the game is a draw due to insufficient material
   */
  isDrawByInsufficientMaterial(board: ChessBoard): boolean {
    let whitePieces: ChessPiece[] = [];
    let blackPieces: ChessPiece[] = [];
    
    // Count all pieces
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece) {
          if (piece.color === 'white') {
            whitePieces.push(piece);
          } else {
            blackPieces.push(piece);
          }
        }
      }
    }
    
    // King vs King
    if (whitePieces.length === 1 && blackPieces.length === 1) {
      return true;
    }
    
    // King + Bishop/Knight vs King
    if ((whitePieces.length === 2 && blackPieces.length === 1) ||
        (whitePieces.length === 1 && blackPieces.length === 2)) {
      const morePieces = whitePieces.length > blackPieces.length ? whitePieces : blackPieces;
      const secondPiece = morePieces.find(p => p.type !== 'king');
      
      return secondPiece?.type === 'bishop' || secondPiece?.type === 'knight';
    }
    
    // King + Bishop vs King + Bishop (same colored squares)
    if (whitePieces.length === 2 && blackPieces.length === 2) {
      const whiteBishop = whitePieces.find(p => p.type === 'bishop');
      const blackBishop = blackPieces.find(p => p.type === 'bishop');
      
      if (whiteBishop && blackBishop) {
        // This is a simplification - in a full implementation, we would check 
        // if both bishops are on same-colored squares
        return true;
      }
    }
    
    return false;
  }
  
  // Helper methods for piece moves
  
  getPawnMoves(board: ChessBoard, row: number, col: number, piece: ChessPiece, moves: ChessMove[]): void {
    const direction = piece.color === 'white' ? -1 : 1;
    const startRow = piece.color === 'white' ? 6 : 1;
    
    // Move forward one square
    if (row + direction >= 0 && row + direction < 8 && !board[row + direction][col]) {
      moves.push({
        from: { row, col },
        to: { row: row + direction, col }
      });
      
      // Move forward two squares from starting position
      if (row === startRow && !board[row + 2 * direction][col]) {
        moves.push({
          from: { row, col },
          to: { row: row + 2 * direction, col }
        });
      }
    }
    
    // Capture diagonally
    for (let dc of [-1, 1]) {
      if (col + dc >= 0 && col + dc < 8) {
        const newRow = row + direction;
        const target = board[newRow]?.[col + dc];
        
        if (target && target.color !== piece.color) {
          moves.push({
            from: { row, col },
            to: { row: newRow, col: col + dc },
            isCapture: true
          });
        }
        
        // En passant - this is a simplification, a full implementation would need to track the previous move
        // The check for row === 3 or row === 4 ensures we're on the correct rank for en passant
        if ((piece.color === 'white' && row === 3) || (piece.color === 'black' && row === 4)) {
          // En passant logic would go here
        }
      }
    }
    
    // Check for promotion
    const promotionRow = piece.color === 'white' ? 0 : 7;
    moves.forEach(move => {
      if (move.to.row === promotionRow) {
        move.promotion = 'queen'; // Default to queen promotion
      }
    });
  }
  
  getKnightMoves(board: ChessBoard, row: number, col: number, piece: ChessPiece, moves: ChessMove[]): void {
    const knightMoves = [
      { dr: -2, dc: -1 }, { dr: -2, dc: 1 },
      { dr: -1, dc: -2 }, { dr: -1, dc: 2 },
      { dr: 1, dc: -2 }, { dr: 1, dc: 2 },
      { dr: 2, dc: -1 }, { dr: 2, dc: 1 }
    ];
    
    for (const { dr, dc } of knightMoves) {
      const newRow = row + dr;
      const newCol = col + dc;
      
      if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
        const target = board[newRow][newCol];
        
        if (!target || target.color !== piece.color) {
          moves.push({
            from: { row, col },
            to: { row: newRow, col: newCol },
            isCapture: !!target
          });
        }
      }
    }
  }
  
  getBishopMoves(board: ChessBoard, row: number, col: number, piece: ChessPiece, moves: ChessMove[]): void {
    const directions = [
      { dr: -1, dc: -1 }, { dr: -1, dc: 1 },
      { dr: 1, dc: -1 }, { dr: 1, dc: 1 }
    ];
    
    this.getSlidingMoves(board, row, col, piece, moves, directions);
  }
  
  getRookMoves(board: ChessBoard, row: number, col: number, piece: ChessPiece, moves: ChessMove[]): void {
    const directions = [
      { dr: -1, dc: 0 }, { dr: 1, dc: 0 },
      { dr: 0, dc: -1 }, { dr: 0, dc: 1 }
    ];
    
    this.getSlidingMoves(board, row, col, piece, moves, directions);
  }
  
  getQueenMoves(board: ChessBoard, row: number, col: number, piece: ChessPiece, moves: ChessMove[]): void {
    const directions = [
      { dr: -1, dc: -1 }, { dr: -1, dc: 0 }, { dr: -1, dc: 1 },
      { dr: 0, dc: -1 }, { dr: 0, dc: 1 },
      { dr: 1, dc: -1 }, { dr: 1, dc: 0 }, { dr: 1, dc: 1 }
    ];
    
    this.getSlidingMoves(board, row, col, piece, moves, directions);
  }
  
  /**
   * Gets moves for a king
   */
  getKingMoves(board: ChessBoard, row: number, col: number, piece: ChessPiece, moves: ChessMove[]): void {
    const directions = [
      [-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]
    ];
    
    // Regular king moves
    for (const [dr, dc] of directions) {
      const newRow = row + dr;
      const newCol = col + dc;
      
      if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
        const targetPiece = board[newRow][newCol];
        
        // Empty square or can capture opponent piece
        if (!targetPiece || targetPiece.color !== piece.color) {
          const move: ChessMove = {
            from: { row, col },
            to: { row: newRow, col: newCol }
          };
          
          // Only add the move if it doesn't leave the king in check
          // Use a direct check here instead of calling wouldBeInCheck to avoid recursion
          const testBoard = JSON.parse(JSON.stringify(board));
          testBoard[newRow][newCol] = { ...piece };
          testBoard[row][col] = null;
          
          const isCheckAfterMove = this.isSquareUnderAttack(
            testBoard, 
            newRow, 
            newCol, 
            piece.color === 'white' ? 'black' : 'white'
          );
          
          if (!isCheckAfterMove) {
            moves.push(move);
          }
        }
      }
    }
    
    // Castling
    if (!piece.hasMoved && !this.isInCheck(board, piece.color)) {
      const rookRow = row;
      const kingCol = 4; // King's initial column
      
      // Kingside castling
      if (col === kingCol) {
        const rookCol = 7;
        const rook = board[rookRow][rookCol];
        
        if (rook && rook.type === 'rook' && rook.color === piece.color && !rook.hasMoved) {
          let canCastle = true;
          
          // Check if the path between king and rook is clear
          for (let c = col + 1; c < rookCol; c++) {
            if (board[rookRow][c] !== null) {
              canCastle = false;
              break;
            }
            
            // Also check if the square the king would move through is under attack
            if (c <= col + 2) { // Only need to check the squares the king moves through
              const testBoard = JSON.parse(JSON.stringify(board));
              testBoard[rookRow][c] = { ...piece };
              testBoard[row][col] = null;
              
              if (this.isSquareUnderAttack(
                testBoard, 
                rookRow, 
                c, 
                piece.color === 'white' ? 'black' : 'white'
              )) {
                canCastle = false;
                break;
              }
            }
          }
          
          if (canCastle) {
            moves.push({
              from: { row, col },
              to: { row, col: col + 2 },
              isCastle: 'kingside'
            });
          }
        }
      }
      
      // Queenside castling
      if (col === kingCol) {
        const rookCol = 0;
        const rook = board[rookRow][rookCol];
        
        if (rook && rook.type === 'rook' && rook.color === piece.color && !rook.hasMoved) {
          let canCastle = true;
          
          // Check if the path between king and rook is clear
          for (let c = col - 1; c > rookCol; c--) {
            if (board[rookRow][c] !== null) {
              canCastle = false;
              break;
            }
            
            // Also check if the square the king would move through is under attack
            if (c >= col - 2) { // Only need to check the squares the king moves through
              const testBoard = JSON.parse(JSON.stringify(board));
              testBoard[rookRow][c] = { ...piece };
              testBoard[row][col] = null;
              
              if (this.isSquareUnderAttack(
                testBoard, 
                rookRow, 
                c, 
                piece.color === 'white' ? 'black' : 'white'
              )) {
                canCastle = false;
                break;
              }
            }
          }
          
          if (canCastle) {
            moves.push({
              from: { row, col },
              to: { row, col: col - 2 },
              isCastle: 'queenside'
            });
          }
        }
      }
    }
  }
  
  // Helper for sliding pieces (bishop, rook, queen)
  getSlidingMoves(
    board: ChessBoard, 
    row: number, 
    col: number, 
    piece: ChessPiece, 
    moves: ChessMove[], 
    directions: { dr: number, dc: number }[]
  ): void {
    for (const { dr, dc } of directions) {
      let newRow = row + dr;
      let newCol = col + dc;
      
      while (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
        const target = board[newRow][newCol];
        
        if (!target) {
          moves.push({
            from: { row, col },
            to: { row: newRow, col: newCol }
          });
        } else {
          if (target.color !== piece.color) {
            moves.push({
              from: { row, col },
              to: { row: newRow, col: newCol },
              isCapture: true
            });
          }
          break; // Stop searching in this direction after encountering a piece
        }
        
        newRow += dr;
        newCol += dc;
      }
    }
  }
  
  // Helper to determine if castling is possible
  canCastle(board: ChessBoard, row: number, col: number, side: number, color: 'white' | 'black'): boolean {
    const rookCol = side === 0 ? 7 : 0; // Kingside or queenside
    const rook = board[row][rookCol];
    
    if (!rook || rook.type !== 'rook' || rook.hasMoved) {
      return false;
    }
    
    // Check if squares between king and rook are empty
    const direction = rookCol > col ? 1 : -1;
    for (let c = col + direction; c !== rookCol; c += direction) {
      if (board[row][c]) {
        return false;
      }
    }
    
    // Check if king passes through check
    const testCol = side === 0 ? col + 1 : col - 1;
    if (this.wouldBeInCheck(board, { from: { row, col }, to: { row, col: testCol } }, color)) {
      return false;
    }
    
    return true;
  }
  
  // Handle special moves
  handleCastle(board: ChessBoard, move: ChessMove): void {
    const row = move.from.row;
    const rookCol = move.isCastle === 'kingside' ? 7 : 0;
    const newRookCol = move.isCastle === 'kingside' ? move.to.col - 1 : move.to.col + 1;
    
    // Move the rook
    const rook = board[row][rookCol];
    board[row][newRookCol] = { ...rook!, hasMoved: true };
    board[row][rookCol] = null;
  }
  
  handleEnPassant(board: ChessBoard, move: ChessMove): void {
    const capturedRow = move.from.row;
    board[capturedRow][move.to.col] = null;
  }
  
  /**
   * Gets basic moves for a piece without checking if they leave the king in check
   */
  getBasicMoves(board: ChessBoard, row: number, col: number, piece: ChessPiece): ChessMove[] {
    const moves: ChessMove[] = [];
    
    switch (piece.type) {
      case 'pawn':
        this.getPawnBasicMoves(board, row, col, piece, moves);
        break;
      case 'knight':
        this.getKnightMoves(board, row, col, piece, moves);
        break;
      case 'bishop':
        this.getBishopMoves(board, row, col, piece, moves);
        break;
      case 'rook':
        this.getRookMoves(board, row, col, piece, moves);
        break;
      case 'queen':
        this.getQueenMoves(board, row, col, piece, moves);
        break;
      case 'king':
        // For king moves, we use a simplified version for checking attacks
        this.getKingBasicMoves(board, row, col, piece, moves);
        break;
    }
    
    return moves;
  }
  
  /**
   * Gets basic moves for a pawn without checking if they leave the king in check
   */
  getPawnBasicMoves(board: ChessBoard, row: number, col: number, piece: ChessPiece, moves: ChessMove[]): void {
    const direction = piece.color === 'white' ? -1 : 1;
    const startingRow = piece.color === 'white' ? 6 : 1;
    
    // Forward move
    if (row + direction >= 0 && row + direction < 8) {
      if (!board[row + direction][col]) {
        moves.push({
          from: { row, col },
          to: { row: row + direction, col }
        });
        
        // Double forward move from starting position
        if (row === startingRow && !board[row + 2 * direction][col]) {
          moves.push({
            from: { row, col },
            to: { row: row + 2 * direction, col }
          });
        }
      }
      
      // Captures
      for (const dcol of [-1, 1]) {
        if (col + dcol >= 0 && col + dcol < 8) {
          const target = board[row + direction][col + dcol];
          if (target && target.color !== piece.color) {
            moves.push({
              from: { row, col },
              to: { row: row + direction, col: col + dcol },
              isCapture: true
            });
          }
          
          // En passant capture
          // Logic for en passant would go here
        }
      }
    }
  }
  
  /**
   * Gets simplified king moves for checking attacks
   * This doesn't consider castling or check restrictions, only basic movement
   */
  getKingBasicMoves(board: ChessBoard, row: number, col: number, piece: ChessPiece, moves: ChessMove[]): void {
    const directions = [
      [-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]
    ];
    
    for (const [dr, dc] of directions) {
      const newRow = row + dr;
      const newCol = col + dc;
      
      if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
        const targetPiece = board[newRow][newCol];
        
        // Empty square or can capture opponent piece
        if (!targetPiece || targetPiece.color !== piece.color) {
          moves.push({
            from: { row, col },
            to: { row: newRow, col: newCol }
          });
        }
      }
    }
    // No castling logic here - that's handled in getKingMoves
  }
}

export default ChessLogic; 