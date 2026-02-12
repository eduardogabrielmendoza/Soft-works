import type { AnimationConfig, AnimationType, EasingType } from './types';
import type { Variant, Transition } from 'framer-motion';

// Convert AnimationType to framer-motion variants
export function getAnimationVariants(type: AnimationType): { initial: Variant; animate: Variant } {
  const map: Record<AnimationType, { initial: Variant; animate: Variant }> = {
    none: { initial: {}, animate: {} },
    fadeIn: { initial: { opacity: 0 }, animate: { opacity: 1 } },
    fadeInUp: { initial: { opacity: 0, y: 30 }, animate: { opacity: 1, y: 0 } },
    fadeInDown: { initial: { opacity: 0, y: -30 }, animate: { opacity: 1, y: 0 } },
    fadeInLeft: { initial: { opacity: 0, x: -30 }, animate: { opacity: 1, x: 0 } },
    fadeInRight: { initial: { opacity: 0, x: 30 }, animate: { opacity: 1, x: 0 } },
    slideUp: { initial: { y: 60 }, animate: { y: 0 } },
    slideDown: { initial: { y: -60 }, animate: { y: 0 } },
    slideLeft: { initial: { x: -60 }, animate: { x: 0 } },
    slideRight: { initial: { x: 60 }, animate: { x: 0 } },
    scaleIn: { initial: { opacity: 0, scale: 0.8 }, animate: { opacity: 1, scale: 1 } },
    scaleUp: { initial: { opacity: 0, scale: 0.5 }, animate: { opacity: 1, scale: 1 } },
    scaleDown: { initial: { opacity: 0, scale: 1.3 }, animate: { opacity: 1, scale: 1 } },
    blurIn: { initial: { opacity: 0, filter: 'blur(10px)' }, animate: { opacity: 1, filter: 'blur(0px)' } },
    rotateIn: { initial: { opacity: 0, rotate: -15 }, animate: { opacity: 1, rotate: 0 } },
    bounceIn: { initial: { opacity: 0, scale: 0.3 }, animate: { opacity: 1, scale: 1 } },
    flipX: { initial: { opacity: 0, rotateX: 90 }, animate: { opacity: 1, rotateX: 0 } },
    flipY: { initial: { opacity: 0, rotateY: 90 }, animate: { opacity: 1, rotateY: 0 } },
  };
  return map[type] || map.none;
}

// Convert EasingType to framer-motion transition
export function getTransition(config: AnimationConfig): Transition {
  const base: Transition = {
    duration: config.duration,
    delay: config.delay,
  };

  const easingMap: Record<EasingType, Partial<Transition>> = {
    easeInOut: { ease: 'easeInOut' },
    easeIn: { ease: 'easeIn' },
    easeOut: { ease: 'easeOut' },
    spring: { type: 'spring', stiffness: 200, damping: 20 },
    bounce: { type: 'spring', stiffness: 300, damping: 10 },
    linear: { ease: 'linear' },
  };

  return { ...base, ...easingMap[config.easing] };
}

// Generate a unique ID
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

// Deep clone helper
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}
