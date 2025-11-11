import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

// Chess piece symbols
const PIECES = {
  'K': '♔', 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙',
  'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟'
};

function ChessBoard({
  board,
  playerColor,
  currentTurn,
  gameOver,
  winner,
  lastMove,
  inCheck,
  onMove,
  onRestart,
  onQuit,
  gameCode,
  capturedPieces,
  showCaptureAnimation
}) {
  const [selectedSquare, setSelectedSquare] = useState(null);

  const isMyTurn = currentTurn === playerColor;

  const handleSquareClick = (row, col) => {
    if (gameOver || !isMyTurn) return;

    const piece = board[row][col];

    // Si une pièce est déjà sélectionnée
    if (selectedSquare) {
      // Si on clique sur la même case, désélectionner
      if (selectedSquare.row === row && selectedSquare.col === col) {
        setSelectedSquare(null);
        return;
      }

      // Essayer de déplacer la pièce
      const selectedPiece = board[selectedSquare.row][selectedSquare.col];

      // Vérifier que c'est bien notre pièce
      if (selectedPiece && isPieceOwnedByPlayer(selectedPiece)) {
        // Tenter le déplacement
        onMove(selectedSquare, { row, col });
        setSelectedSquare(null);
      } else {
        // Si on clique sur une autre pièce à nous, la sélectionner
        if (piece && isPieceOwnedByPlayer(piece)) {
          setSelectedSquare({ row, col });
        } else {
          setSelectedSquare(null);
        }
      }
    } else {
      // Sélectionner une pièce si c'est la nôtre
      if (piece && isPieceOwnedByPlayer(piece)) {
        setSelectedSquare({ row, col });
      }
    }
  };

  const isPieceOwnedByPlayer = (piece) => {
    if (!piece) return false;
    const isWhitePiece = piece === piece.toUpperCase();
    return (playerColor === 'white' && isWhitePiece) ||
           (playerColor === 'black' && !isWhitePiece);
  };

  const renderSquare = (row, col) => {
    const piece = board[row][col];
    const isLightSquare = (row + col) % 2 === 0;
    const isSelected = selectedSquare && selectedSquare.row === row && selectedSquare.col === col;
    const isLastMove = lastMove &&
      ((lastMove.from.row === row && lastMove.from.col === col) ||
       (lastMove.to.row === row && lastMove.to.col === col));
    const canBeClicked = isMyTurn && !gameOver;

    return (
      <motion.div
        key={`${row}-${col}`}
        onClick={() => handleSquareClick(row, col)}
        whileHover={canBeClicked ? { scale: 1.02 } : {}}
        className={`
          aspect-square flex items-center justify-center cursor-pointer relative
          ${isLightSquare ? 'square-light' : 'square-dark'}
          ${isSelected ? 'square-selected' : ''}
          ${isLastMove ? 'square-last-move' : ''}
          ${canBeClicked && !piece ? 'square-hover' : ''}
        `}
      >
        {piece && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className={`chess-piece ${piece === piece.toUpperCase() ? 'piece-white' : 'piece-black'}`}
          >
            {PIECES[piece]}
          </motion.span>
        )}
      </motion.div>
    );
  };

  const getStatusMessage = () => {
    if (gameOver) {
      if (winner === 'draw') {
        return 'Match Nul';
      } else if (winner === playerColor) {
        return 'Victoire';
      } else {
        return 'Défaite';
      }
    } else {
      if (inCheck && currentTurn === playerColor) {
        return 'Échec !';
      } else if (isMyTurn) {
        return 'Votre Tour';
      } else {
        return 'Tour de l\'Adversaire';
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="glass-luxury p-8 max-w-4xl w-full fade-in-elegant"
    >
      {/* Header */}
      <div className="mb-6 text-center">
        <div className="flex justify-between items-center mb-6">
          <div className="glass-luxury px-4 py-2 text-xs" style={{ color: '#CFAF6A' }}>
            <span className="opacity-70">Code : </span>
            <span className="font-bold tracking-wider">{gameCode}</span>
          </div>
          <div className="glass-luxury px-4 py-2 text-xs">
            <span className="opacity-70">Vous jouez : </span>
            <span className="text-2xl ml-2">{playerColor === 'white' ? '♔' : '♚'}</span>
          </div>
        </div>

        <h2
          className="text-3xl font-bold mb-2"
          style={{
            fontFamily: 'Playfair Display, serif',
            color: gameOver ? (winner === playerColor ? '#CFAF6A' : '#DADADA') : '#DADADA'
          }}
        >
          {getStatusMessage()}
        </h2>
        {inCheck && currentTurn === playerColor && !gameOver && (
          <p className="text-sm" style={{ color: '#CFAF6A' }}>
            Votre roi est en danger
          </p>
        )}
      </div>

      {/* Captured Pieces - Black */}
      <div className="mb-4">
        <p className="text-xs opacity-60 mb-2">Pièces noires capturées :</p>
        <div className="captured-pieces-container">
          {capturedPieces?.black.map((piece, index) => (
            <motion.span
              key={`black-${index}`}
              initial={{ scale: 0, rotate: 180 }}
              animate={{ scale: 1, rotate: 0 }}
              className="captured-piece"
            >
              {PIECES[piece]}
            </motion.span>
          ))}
          {(!capturedPieces?.black || capturedPieces.black.length === 0) && (
            <span className="text-xs opacity-40">Aucune</span>
          )}
        </div>
      </div>

      {/* Chess Board */}
      <div className="board-container mb-6 relative">
        {showCaptureAnimation && (
          <div className="capture-flash" />
        )}
        <div className="grid grid-cols-8 gap-0 overflow-hidden" style={{ borderRadius: '4px' }}>
          {board.map((rowData, row) => (
            rowData.map((_, col) => renderSquare(row, col))
          ))}
        </div>
      </div>

      {/* Captured Pieces - White */}
      <div className="mb-6">
        <p className="text-xs opacity-60 mb-2">Pièces blanches capturées :</p>
        <div className="captured-pieces-container">
          {capturedPieces?.white.map((piece, index) => (
            <motion.span
              key={`white-${index}`}
              initial={{ scale: 0, rotate: 180 }}
              animate={{ scale: 1, rotate: 0 }}
              className="captured-piece"
            >
              {PIECES[piece]}
            </motion.span>
          ))}
          {(!capturedPieces?.white || capturedPieces.white.length === 0) && (
            <span className="text-xs opacity-40">Aucune</span>
          )}
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-4 justify-center">
        <AnimatePresence>
          {gameOver && (
            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onClick={onRestart}
              className="btn-luxury btn-luxury-primary"
            >
              Rejouer
            </motion.button>
          )}
        </AnimatePresence>

        <motion.button
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={onQuit}
          className="btn-luxury"
        >
          Quitter
        </motion.button>
      </div>
    </motion.div>
  );
}

export default ChessBoard;
