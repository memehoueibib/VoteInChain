import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface CounterAnimationProps {
  end: number;
  duration?: number;
  className?: string;
}

const CounterAnimation: React.FC<CounterAnimationProps> = ({ 
  end, 
  duration = 2, 
  className = '' 
}) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    // Vérifier que end est un nombre valide
    const targetValue = typeof end === 'number' && !isNaN(end) ? end : 0;
    
    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      
      setCount(Math.floor(progress * targetValue));
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [end, duration]);

  return (
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={className}
    >
      {count}
    </motion.span>
  );
};

export default CounterAnimation;