import React from 'react';
import { motion } from 'framer-motion';
import { Users, Lightbulb } from 'lucide-react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

const Logo: React.FC<LogoProps> = ({ size = 'md', showText = true }) => {
  const iconSize = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8', 
    lg: 'h-12 w-12'
  };

  const textSize = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl'
  };

  return (
    <motion.div 
      className="flex items-center gap-3"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="relative">
        <motion.div
          className={`${iconSize[size]} gradient-hero rounded-lg p-2 shadow-medium`}
          whileHover={{ scale: 1.1, rotate: 5 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          <div className="relative">
            <Users className={`${iconSize[size]} text-white`} />
            <motion.div
              className="absolute -top-1 -right-1"
              animate={{ 
                scale: [1, 1.2, 1],
                rotate: [0, 10, 0]
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity, 
                repeatType: "reverse" 
              }}
            >
              <Lightbulb className="h-3 w-3 text-accent-soft" />
            </motion.div>
          </div>
        </motion.div>
      </div>
      
      {showText && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <h1 className={`${textSize[size]} font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent`}>
            MentorConnect
          </h1>
          <p className="text-xs text-muted-foreground -mt-1">
            Learn • Grow • Succeed
          </p>
        </motion.div>
      )}
    </motion.div>
  );
};

export default Logo;