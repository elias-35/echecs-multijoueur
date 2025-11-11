const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3001;

// Store active games
const games = new Map();

// Generate random 6-character game code
function generateGameCode() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
}

// Initialize chess board
function createInitialBoard() {
  return [
    ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
    ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
    ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
  ];
}

// Check if a piece is white (uppercase)
function isWhite(piece) {
  return piece === piece.toUpperCase();
}

// Get all possible moves for a piece
function getPossibleMoves(board, fromRow, fromCol) {
  const piece = board[fromRow][fromCol];
  if (!piece) return [];

  const moves = [];
  const isWhitePiece = isWhite(piece);
  const pieceType = piece.toLowerCase();

  // Helper function to add move if valid
  function addMove(row, col) {
    if (row < 0 || row > 7 || col < 0 || col > 7) return false;
    const targetPiece = board[row][col];
    if (!targetPiece) {
      moves.push({ row, col, capture: false });
      return true;
    }
    if (isWhite(targetPiece) !== isWhitePiece) {
      moves.push({ row, col, capture: true });
    }
    return false;
  }

  switch (pieceType) {
    case 'p': // Pawn
      const direction = isWhitePiece ? -1 : 1;
      const startRow = isWhitePiece ? 6 : 1;

      // Move forward
      if (!board[fromRow + direction][fromCol]) {
        moves.push({ row: fromRow + direction, col: fromCol, capture: false });
        // Double move from start
        if (fromRow === startRow && !board[fromRow + 2 * direction][fromCol]) {
          moves.push({ row: fromRow + 2 * direction, col: fromCol, capture: false });
        }
      }

      // Capture diagonally
      [-1, 1].forEach(dc => {
        const newRow = fromRow + direction;
        const newCol = fromCol + dc;
        if (newCol >= 0 && newCol <= 7 && board[newRow]?.[newCol]) {
          if (isWhite(board[newRow][newCol]) !== isWhitePiece) {
            moves.push({ row: newRow, col: newCol, capture: true });
          }
        }
      });
      break;

    case 'n': // Knight
      [
        [-2, -1], [-2, 1], [-1, -2], [-1, 2],
        [1, -2], [1, 2], [2, -1], [2, 1]
      ].forEach(([dr, dc]) => {
        addMove(fromRow + dr, fromCol + dc);
      });
      break;

    case 'b': // Bishop
      [[-1, -1], [-1, 1], [1, -1], [1, 1]].forEach(([dr, dc]) => {
        let r = fromRow + dr, c = fromCol + dc;
        while (r >= 0 && r <= 7 && c >= 0 && c <= 7) {
          if (!addMove(r, c)) break;
          r += dr;
          c += dc;
        }
      });
      break;

    case 'r': // Rook
      [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(([dr, dc]) => {
        let r = fromRow + dr, c = fromCol + dc;
        while (r >= 0 && r <= 7 && c >= 0 && c <= 7) {
          if (!addMove(r, c)) break;
          r += dr;
          c += dc;
        }
      });
      break;

    case 'q': // Queen (combines rook + bishop)
      [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1], [0, 1],
        [1, -1], [1, 0], [1, 1]
      ].forEach(([dr, dc]) => {
        let r = fromRow + dr, c = fromCol + dc;
        while (r >= 0 && r <= 7 && c >= 0 && c <= 7) {
          if (!addMove(r, c)) break;
          r += dr;
          c += dc;
        }
      });
      break;

    case 'k': // King
      [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1], [0, 1],
        [1, -1], [1, 0], [1, 1]
      ].forEach(([dr, dc]) => {
        addMove(fromRow + dr, fromCol + dc);
      });
      break;
  }

  return moves;
}

// Check if a move is valid
function isValidMove(board, from, to, currentPlayer) {
  const piece = board[from.row][from.col];
  if (!piece) return false;
  if ((currentPlayer === 'white' && !isWhite(piece)) ||
      (currentPlayer === 'black' && isWhite(piece))) return false;

  const possibleMoves = getPossibleMoves(board, from.row, from.col);
  return possibleMoves.some(move => move.row === to.row && move.col === to.col);
}

// Make a move
function makeMove(board, from, to) {
  const newBoard = board.map(row => [...row]);
  const piece = newBoard[from.row][from.col];
  newBoard[to.row][to.col] = piece;
  newBoard[from.row][from.col] = null;

  // Pawn promotion
  if (piece.toLowerCase() === 'p') {
    if ((isWhite(piece) && to.row === 0) || (!isWhite(piece) && to.row === 7)) {
      newBoard[to.row][to.col] = isWhite(piece) ? 'Q' : 'q';
    }
  }

  return newBoard;
}

// Check if king is in check
function isInCheck(board, isWhiteKing) {
  // Find king position
  let kingPos = null;
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.toLowerCase() === 'k' && isWhite(piece) === isWhiteKing) {
        kingPos = { row, col };
        break;
      }
    }
    if (kingPos) break;
  }

  if (!kingPos) return false;

  // Check if any enemy piece can capture the king
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && isWhite(piece) !== isWhiteKing) {
        const moves = getPossibleMoves(board, row, col);
        if (moves.some(move => move.row === kingPos.row && move.col === kingPos.col)) {
          return true;
        }
      }
    }
  }

  return false;
}

// Check for checkmate or stalemate
function checkGameOver(board, currentPlayer) {
  const isWhitePlayer = currentPlayer === 'white';

  // Check if current player has any valid moves
  for (let fromRow = 0; fromRow < 8; fromRow++) {
    for (let fromCol = 0; fromCol < 8; fromCol++) {
      const piece = board[fromRow][fromCol];
      if (piece && isWhite(piece) === isWhitePlayer) {
        const moves = getPossibleMoves(board, fromRow, fromCol);
        for (const move of moves) {
          // Try the move
          const testBoard = makeMove(board, { row: fromRow, col: fromCol }, move);
          if (!isInCheck(testBoard, isWhitePlayer)) {
            return { gameOver: false };
          }
        }
      }
    }
  }

  // No valid moves
  if (isInCheck(board, isWhitePlayer)) {
    return { gameOver: true, winner: currentPlayer === 'white' ? 'black' : 'white', reason: 'checkmate' };
  } else {
    return { gameOver: true, winner: 'draw', reason: 'stalemate' };
  }
}

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Create a new game
  socket.on('create-game', () => {
    let code;
    do {
      code = generateGameCode();
    } while (games.has(code));

    const game = {
      code,
      players: {
        white: socket.id,
        black: null
      },
      board: createInitialBoard(),
      currentTurn: 'white',
      gameOver: false,
      winner: null,
      moveHistory: [],
      capturedPieces: {
        white: [], // Pièces blanches capturées
        black: []  // Pièces noires capturées
      }
    };

    games.set(code, game);
    socket.join(code);

    socket.emit('game-created', {
      code,
      color: 'white'
    });

    console.log(`Game created: ${code}`);
  });

  // Join an existing game
  socket.on('join-game', (code) => {
    const game = games.get(code);

    if (!game) {
      socket.emit('error', { message: 'Partie introuvable' });
      return;
    }

    if (game.players.black) {
      socket.emit('error', { message: 'Partie déjà complète' });
      return;
    }

    game.players.black = socket.id;
    socket.join(code);

    socket.emit('game-joined', {
      code,
      color: 'black'
    });

    // Notify both players that the game is starting
    io.to(code).emit('game-start', {
      board: game.board,
      currentTurn: game.currentTurn
    });

    console.log(`Player joined game: ${code}`);
  });

  // Make a move
  socket.on('make-move', ({ code, from, to }) => {
    const game = games.get(code);

    if (!game) {
      socket.emit('error', { message: 'Partie introuvable' });
      return;
    }

    const playerColor = game.players.white === socket.id ? 'white' : 'black';

    if (playerColor !== game.currentTurn) {
      socket.emit('error', { message: 'Ce n\'est pas votre tour' });
      return;
    }

    if (!isValidMove(game.board, from, to, playerColor)) {
      socket.emit('error', { message: 'Mouvement invalide' });
      return;
    }

    // Check if capturing a piece
    const capturedPiece = game.board[to.row][to.col];
    let wasCaptured = false;

    if (capturedPiece) {
      wasCaptured = true;
      // Add to captured pieces
      if (isWhite(capturedPiece)) {
        game.capturedPieces.white.push(capturedPiece);
      } else {
        game.capturedPieces.black.push(capturedPiece);
      }
    }

    // Make the move
    game.board = makeMove(game.board, from, to);
    game.moveHistory.push({ from, to, piece: game.board[to.row][to.col], captured: wasCaptured });

    // Check if move puts own king in check (invalid)
    if (isInCheck(game.board, playerColor === 'white')) {
      socket.emit('error', { message: 'Vous ne pouvez pas vous mettre en échec' });
      return;
    }

    // Switch turn
    game.currentTurn = game.currentTurn === 'white' ? 'black' : 'white';

    // Check for game over
    const gameOverResult = checkGameOver(game.board, game.currentTurn);
    if (gameOverResult.gameOver) {
      game.gameOver = true;
      game.winner = gameOverResult.winner;

      io.to(code).emit('game-over', {
        board: game.board,
        winner: gameOverResult.winner,
        reason: gameOverResult.reason
      });
    } else {
      // Check if opponent is in check
      const inCheck = isInCheck(game.board, game.currentTurn === 'white');

      io.to(code).emit('move-made', {
        board: game.board,
        currentTurn: game.currentTurn,
        lastMove: { from, to },
        inCheck,
        capturedPieces: game.capturedPieces,
        wasCaptured
      });
    }
  });

  // Restart game
  socket.on('restart-game', (code) => {
    const game = games.get(code);
    if (!game) return;

    game.board = createInitialBoard();
    game.currentTurn = 'white';
    game.gameOver = false;
    game.winner = null;
    game.moveHistory = [];
    game.capturedPieces = { white: [], black: [] };

    io.to(code).emit('game-restarted', {
      board: game.board,
      currentTurn: game.currentTurn,
      capturedPieces: game.capturedPieces
    });
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);

    // Find and clean up games
    for (const [code, game] of games.entries()) {
      if (game.players.white === socket.id || game.players.black === socket.id) {
        io.to(code).emit('player-disconnected');
        games.delete(code);
      }
    }
  });
});

server.listen(PORT, () => {
  console.log(`Chess server running on port ${PORT}`);
});
