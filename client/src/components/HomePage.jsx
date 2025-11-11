import { useState } from 'react';
import { motion } from 'framer-motion';

function HomePage({ onCreateGame, onJoinGame, error }) {
  const [gameCode, setGameCode] = useState('');
  const [showJoinInput, setShowJoinInput] = useState(false);

  const handleJoinGame = (e) => {
    e.preventDefault();
    if (gameCode.trim().length === 6) {
      onJoinGame(gameCode.toUpperCase());
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="glass-luxury p-12 max-w-md w-full fade-in-elegant"
    >
      <div className="text-center">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <h1
            className="text-5xl md:text-6xl font-bold mb-4"
            style={{
              fontFamily: 'Playfair Display, serif',
              color: '#DADADA'
            }}
          >
            Échecs Royaux
          </h1>
          <motion.div
            className="h-0.5 w-24 mx-auto mb-8"
            style={{ backgroundColor: '#CFAF6A' }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          />
          <p className="text-lg mb-8 opacity-70" style={{ color: '#DADADA' }}>
            Partie en Ligne
          </p>
        </motion.div>

        {error && (
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="mb-6 p-4 rounded-lg"
            style={{
              background: 'rgba(207, 175, 106, 0.1)',
              border: '1px solid #CFAF6A',
              color: '#DADADA'
            }}
          >
            <span className="text-sm">{error}</span>
          </motion.div>
        )}

        <div className="space-y-4 mb-8">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onCreateGame}
            className="btn-luxury btn-luxury-primary w-full text-lg py-4"
          >
            Créer une Partie
          </motion.button>

          {!showJoinInput ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowJoinInput(true)}
              className="btn-luxury w-full text-lg py-4"
            >
              Rejoindre une Partie
            </motion.button>
          ) : (
            <motion.form
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              transition={{ duration: 0.3 }}
              onSubmit={handleJoinGame}
              className="space-y-3"
            >
              <input
                type="text"
                value={gameCode}
                onChange={(e) => setGameCode(e.target.value.toUpperCase())}
                placeholder="CODE"
                maxLength={6}
                className="w-full px-6 py-4 rounded-lg text-center text-2xl font-bold tracking-[0.3em] uppercase outline-none transition-all"
                style={{
                  background: 'rgba(207, 175, 106, 0.05)',
                  border: '2px solid #CFAF6A',
                  color: '#CFAF6A',
                  fontFamily: 'Lato, sans-serif'
                }}
                autoFocus
              />
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={gameCode.length !== 6}
                  className="btn-luxury btn-luxury-primary flex-1 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Valider
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => {
                    setShowJoinInput(false);
                    setGameCode('');
                  }}
                  className="btn-luxury flex-1"
                >
                  Annuler
                </motion.button>
              </div>
            </motion.form>
          )}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-sm opacity-50"
          style={{ color: '#DADADA' }}
        >
          <p>Créez ou rejoignez une partie</p>
          <p className="mt-1">avec un code à 6 caractères</p>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default HomePage;
