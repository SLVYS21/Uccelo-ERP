import { useEffect, useState } from 'react';

interface Options {
  duration?: number;
  decimals?: number;
}

export function useCountUp(target: number, { duration = 900, decimals = 0 }: Options = {}) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced || duration <= 0) {
      setCurrent(target);
      return;
    }
    const from = 0;
    const start = performance.now();
    let raf = 0;
    const frame = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(from + (target - from) * eased);
      if (progress < 1) raf = requestAnimationFrame(frame);
      else setCurrent(target);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  const display = current.toLocaleString('fr-FR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return { value: current, display };
}
