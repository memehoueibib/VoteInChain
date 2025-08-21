import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  color: string;
  rotation: number;
  scale: number;
}

interface ConfettiEffectProps {
  trigger: boolean;
  onComplete?: () => void;
}

const ConfettiEffect: React.FC<ConfettiEffectProps> = ({ trigger, onComplete }) => {
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([]);

  const colors = ['#00d9ff', '#8b5cf6', '#f97316', '#10b981', '#ef4444', '#f59e0b'];

  useEffect(() => {
    if (trigger) {
      const pieces: ConfettiPiece[] = [];
      for (let i = 0; i < 50; i++) {
        pieces.push({
          id: i,
          x: Math.random() * window.innerWidth,
          y: -10,
          color: colors[Math.floor(Math.random() * colors.length)],
          rotation: Math.random() * 360,
          scale: 0.5 + Math.random() * 0.5
        });
      }
      setConfetti(pieces);

      const timer = setTimeout(() => {
        setConfetti([]);
        onComplete?.();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [trigger, onComplete]);

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      <AnimatePresence>
        {confetti.map((piece) => (
          <motion.div
            key={piece.id}
            className="absolute w-3 h-3 rounded-sm"
            style={{
              backgroundColor: piece.color,
              left: piece.x,
              scale: piece.scale
            }}
            initial={{
              y: piece.y,
              rotate: piece.rotation,
              opacity: 1
            }}
            animate={{
              y: window.innerHeight + 100,
              rotate: piece.rotation + 720,
              opacity: 0
            }}
            transition={{
              duration: 3,
              ease: 'easeOut'
            }}
            exit={{ opacity: 0 }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default ConfettiEffect;