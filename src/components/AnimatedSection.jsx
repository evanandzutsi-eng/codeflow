import { motion } from 'framer-motion';

/**
 * Reusable animated wrapper — elements animate in when they scroll into view.
 * Supports fade-up, fade-down, fade-left, fade-right, scale, and custom variants.
 */
const variants = {
  'fade-up': {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0 },
  },
  'fade-down': {
    hidden: { opacity: 0, y: -40 },
    visible: { opacity: 1, y: 0 },
  },
  'fade-left': {
    hidden: { opacity: 0, x: -40 },
    visible: { opacity: 1, x: 0 },
  },
  'fade-right': {
    hidden: { opacity: 0, x: 40 },
    visible: { opacity: 1, x: 0 },
  },
  'scale': {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1 },
  },
  'fade': {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  },
};

export default function AnimatedSection({
  children,
  animation = 'fade-up',
  delay = 0,
  duration = 0.6,
  className = '',
  once = true,
}) {
  return (
    <motion.div
      variants={variants[animation] || variants['fade-up']}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: '-50px' }}
      transition={{
        duration,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Staggered children animation — each child animates in sequence.
 */
export function StaggerContainer({ children, stagger = 0.1, className = '' }) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-50px' }}
      variants={{
        visible: {
          transition: { staggerChildren: stagger },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className = '' }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 30 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
