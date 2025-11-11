import { motion } from 'framer-motion';
import { useState } from 'react';

function WaitingRoom({ gameCode, onCancel }) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(gameCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="glass-luxury p-12 max-w-md w-full fade-in-elegant"
    >
      <div className="text-center">
        <motion.h2
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-3xl font-bold mb-6"
          style={{
            color: '#DADADA',
            fontFamily: 'Playfair Display, serif'
          }}
        >
          En Attente...
        </motion.h2>

        <div className="mb-8 flex justify-center gap-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full"
              style={{
                background: '#CFAF6A',
                boxShadow: '0 0 10px rgba(207, 175, 106, 0.5)'
              }}
              animate={{
                y: [0, -10, 0],
                opacity: [0.4, 1, 0.4],
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <p className="text-sm mb-4 opacity-70" style={{ color: '#DADADA' }}>
            Partagez ce code avec votre adversaire
          </p>

          <motion.div
            onClick={copyToClipboard}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="cursor-pointer p-6 rounded-xl transition-all"
            style={{
              background: 'rgba(207, 175, 106, 0.1)',
              border: '2px solid #CFAF6A',
              boxShadow: copied
                ? '0 0 20px rgba(207, 175, 106, 0.4)'
                : '0 0 10px rgba(207, 175, 106, 0.2)'
            }}
          >
            <motion.p
              animate={{
                scale: copied ? [1, 1.05, 1] : 1,
              }}
              className="text-5xl font-bold tracking-[0.3em] mb-3"
              style={{
                color: '#CFAF6A',
                fontFamily: 'Lato, sans-serif',
                fontWeight: 700
              }}
            >
              {gameCode}
            </motion.p>
            <motion.p
              animate={{
                opacity: copied ? 1 : 0.6
              }}
              className="text-xs"
              style={{ color: '#DADADA' }}
            >
              {copied ? '✓ Copié !' : 'Cliquez pour copier'}
            </motion.p>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mb-6 p-4 rounded-lg"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(207, 175, 106, 0.3)'
          }}
        >
          <p className="text-sm" style={{ color: '#DADADA' }}>
            Vous jouez les <span className="text-2xl font-bold ml-1" style={{ color: '#CFAF6A' }}>Blancs ♔</span>
          </p>
        </motion.div>

        <motion.button
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onCancel}
          className="btn-luxury w-full"
        >
          Annuler
        </motion.button>
      </div>
    </motion.div>
  );
}

export default WaitingRoom;
