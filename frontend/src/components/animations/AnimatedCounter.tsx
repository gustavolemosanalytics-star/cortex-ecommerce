import { useEffect, useRef, useState } from 'react';
import { motion, useSpring } from 'framer-motion';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  formatFn?: (value: number) => string;
  className?: string;
}

export function AnimatedCounter({
  value,
  duration = 2,
  formatFn = (v) => v.toLocaleString('pt-BR'),
  className = '',
}: AnimatedCounterProps) {
  const [isInView, setIsInView] = useState(false);
  const [displayValue, setDisplayValue] = useState('0');
  const ref = useRef<HTMLSpanElement>(null);

  const spring = useSpring(0, {
    duration: duration * 1000,
    bounce: 0,
  });

  useEffect(() => {
    const unsubscribe = spring.on('change', (latest) => {
      setDisplayValue(formatFn(Math.round(latest)));
    });
    return unsubscribe;
  }, [spring, formatFn]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isInView) {
          setIsInView(true);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [isInView]);

  useEffect(() => {
    if (isInView) {
      spring.set(value);
    }
  }, [isInView, value, spring]);

  return (
    <motion.span ref={ref} className={className}>
      {displayValue}
    </motion.span>
  );
}

// Currency counter with R$ prefix
interface CurrencyCounterProps {
  value: number;
  duration?: number;
  className?: string;
}

export function CurrencyCounter({
  value,
  duration = 2,
  className = '',
}: CurrencyCounterProps) {
  return (
    <span className={className}>
      R${' '}
      <AnimatedCounter
        value={value}
        duration={duration}
        formatFn={(v) =>
          v.toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })
        }
      />
    </span>
  );
}

// Percentage counter
interface PercentCounterProps {
  value: number;
  duration?: number;
  decimals?: number;
  className?: string;
}

export function PercentCounter({
  value,
  duration = 1.5,
  decimals = 1,
  className = '',
}: PercentCounterProps) {
  const [isInView, setIsInView] = useState(false);
  const [displayValue, setDisplayValue] = useState('0');
  const ref = useRef<HTMLSpanElement>(null);

  const spring = useSpring(0, {
    duration: duration * 1000,
    bounce: 0,
  });

  useEffect(() => {
    const unsubscribe = spring.on('change', (latest) => {
      setDisplayValue(latest.toFixed(decimals));
    });
    return unsubscribe;
  }, [spring, decimals]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isInView) {
          setIsInView(true);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [isInView]);

  useEffect(() => {
    if (isInView) {
      spring.set(value);
    }
  }, [isInView, value, spring]);

  return (
    <motion.span ref={ref} className={className}>
      {displayValue}%
    </motion.span>
  );
}
