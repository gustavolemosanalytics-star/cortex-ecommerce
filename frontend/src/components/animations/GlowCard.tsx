import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

interface GlowCardProps {
  children: ReactNode;
  className?: string;
  glowColor?: string;
  hoverScale?: number;
}

export function GlowCard({
  children,
  className = '',
  glowColor = 'rgba(99, 102, 241, 0.4)',
  hoverScale = 1.02,
}: GlowCardProps) {
  return (
    <motion.div
      className={clsx(
        'relative rounded-xl bg-dark-800 border border-dark-700 overflow-hidden',
        className
      )}
      whileHover={{
        scale: hoverScale,
        boxShadow: `0 0 30px ${glowColor}`,
      }}
      transition={{ duration: 0.3 }}
    >
      {/* Gradient border effect */}
      <div className="absolute inset-0 rounded-xl opacity-0 hover:opacity-100 transition-opacity duration-300">
        <div
          className="absolute inset-0 rounded-xl"
          style={{
            background: `linear-gradient(135deg, ${glowColor}, transparent, ${glowColor})`,
            padding: '1px',
            WebkitMask:
              'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
          }}
        />
      </div>
      {children}
    </motion.div>
  );
}

// Card with animated gradient border
interface GradientBorderCardProps {
  children: ReactNode;
  className?: string;
}

export function GradientBorderCard({
  children,
  className = '',
}: GradientBorderCardProps) {
  return (
    <div className={clsx('relative p-[1px] rounded-xl overflow-hidden', className)}>
      {/* Animated gradient background */}
      <motion.div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(90deg, #6366f1, #8b5cf6, #ec4899, #8b5cf6, #6366f1)',
          backgroundSize: '200% 100%',
        }}
        animate={{
          backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
      {/* Content */}
      <div className="relative bg-dark-800 rounded-xl">{children}</div>
    </div>
  );
}

// Pulsing glow effect card
interface PulseGlowCardProps {
  children: ReactNode;
  className?: string;
  color?: string;
}

export function PulseGlowCard({
  children,
  className = '',
  color = '#6366f1',
}: PulseGlowCardProps) {
  return (
    <motion.div
      className={clsx(
        'relative rounded-xl bg-dark-800 border border-dark-700',
        className
      )}
      animate={{
        boxShadow: [
          `0 0 20px ${color}30`,
          `0 0 40px ${color}50`,
          `0 0 20px ${color}30`,
        ],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      {children}
    </motion.div>
  );
}
