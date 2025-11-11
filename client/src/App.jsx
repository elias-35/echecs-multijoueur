import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import HomePage from './components/HomePage';
import ChessBoard from './components/ChessBoard';
import WaitingRoom from './components/WaitingRoom';

// Automatically detect server URL
const getServerUrl = () => {
  const hostname = window.location.hostname;

  // If using Cloudflare Tunnel
  if (hostname.includes('trycloudflare.com')) {
    return 'https://protected-artistic-warranty-end.trycloudflare.com';
  }

  // If using localhost on different port
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:3001';
  }

  // Production: use environment variable
  if (import.meta.env.PROD && import.meta.env.VITE_SERVER_URL) {
    return import.meta.env.VITE_SERVER_URL;
  }

  // Local development
  return 'http://localhost:3001';
};

const socket = io(getServerUrl());

function App() {
  const [gameState, setGameState] = useState('home');
  const [gameCode, setGameCode] = useState('');
  const [playerColor, setPlayerColor] = useState('');
  const [board, setBoard] = useState([]);
  const [currentTurn, setCurrentTurn] = useState('white');
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);
  const [lastMove, setLastMove] = useState(null);
  const [inCheck, setInCheck] = useState(false);
  const [error, setError] = useState('');
  const [capturedPieces, setCapturedPieces] = useState({ white: [], black: [] });
  const [showCaptureAnimation, setShowCaptureAnimation] = useState(false);

  useEffect(() => {
    socket.on('game-created', ({ code, color }) => {
      setGameCode(code);
      setPlayerColor(color);
      setGameState('waiting');
      setError('');
    });

    socket.on('game-joined', ({ code, color }) => {
      setGameCode(code);
      setPlayerColor(color);
      setError('');
    });

    socket.on('game-start', ({ board, currentTurn }) => {
      setBoard(board);
      setCurrentTurn(currentTurn);
      setGameState('playing');
      setGameOver(false);
      setWinner(null);
      setLastMove(null);
      setInCheck(false);
    });

    socket.on('move-made', ({ board, currentTurn, lastMove, inCheck, capturedPieces, wasCaptured }) => {
      setBoard(board);
      setCurrentTurn(currentTurn);
      setLastMove(lastMove);
      setInCheck(inCheck);
      setCapturedPieces(capturedPieces);

      if (wasCaptured) {
        setShowCaptureAnimation(true);
        setTimeout(() => setShowCaptureAnimation(false), 600);
      }
    });

    socket.on('game-over', ({ board, winner }) => {
      setBoard(board);
      setGameOver(true);
      setWinner(winner);
    });

    socket.on('game-restarted', ({ board, currentTurn, capturedPieces }) => {
      setBoard(board);
      setCurrentTurn(currentTurn);
      setGameOver(false);
      setWinner(null);
      setLastMove(null);
      setInCheck(false);
      setCapturedPieces(capturedPieces);
    });

    socket.on('player-disconnected', () => {
      alert('L autre joueur s est deconnecte');
      resetGame();
    });

    socket.on('error', ({ message }) => {
      setError(message);
    });

    return () => {
      socket.off('game-created');
      socket.off('game-joined');
      socket.off('game-start');
      socket.off('move-made');
      socket.off('game-over');
      socket.off('game-restarted');
      socket.off('player-disconnected');
      socket.off('error');
    };
  }, []);

  const createGame = () => {
    socket.emit('create-game');
  };

  const joinGame = (code) => {
    socket.emit('join-game', code);
  };

  const makeMove = (from, to) => {
    socket.emit('make-move', { code: gameCode, from, to });
  };

  const restartGame = () => {
    socket.emit('restart-game', gameCode);
  };

  const resetGame = () => {
    setGameState('home');
    setGameCode('');
    setPlayerColor('');
    setBoard([]);
    setCurrentTurn('white');
    setGameOver(false);
    setWinner(null);
    setLastMove(null);
    setInCheck(false);
    setError('');
    setCapturedPieces({ white: [], black: [] });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {gameState === 'home' && (
        <HomePage onCreateGame={createGame} onJoinGame={joinGame} error={error} />
      )}

      {gameState === 'waiting' && (
        <WaitingRoom gameCode={gameCode} onCancel={resetGame} />
      )}

      {gameState === 'playing' && (
        <ChessBoard
          board={board}
          playerColor={playerColor}
          currentTurn={currentTurn}
          gameOver={gameOver}
          winner={winner}
          lastMove={lastMove}
          inCheck={inCheck}
          onMove={makeMove}
          onRestart={restartGame}
          onQuit={resetGame}
          gameCode={gameCode}
          capturedPieces={capturedPieces}
          showCaptureAnimation={showCaptureAnimation}
        />
      )}
    </div>
  );
}

export default App;
