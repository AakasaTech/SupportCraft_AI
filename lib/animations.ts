import type { Variants, Transition } from "framer-motion";

/* ── Transitions ─────────────────────────────────────── */
export const easeStandard: Transition = { type: "tween", ease: [0.4, 0, 0.2, 1] };
export const easeDecelerate: Transition = { type: "tween", ease: [0, 0, 0.2, 1] };
export const easeSpring: Transition = { type: "spring", stiffness: 400, damping: 30 };
export const easeSpringGentle: Transition = { type: "spring", stiffness: 280, damping: 28 };

export const durationFast = 0.12;
export const durationNormal = 0.20;
export const durationSlow = 0.30;
export const durationSlower = 0.50;

/* ── Atomic variants ─────────────────────────────────── */
export const fadeIn: Variants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: durationNormal, ...easeDecelerate } },
  exit:    { opacity: 0, transition: { duration: durationFast,   ...easeStandard } },
};

export const fadeInFast: Variants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: durationFast, ...easeDecelerate } },
  exit:    { opacity: 0, transition: { duration: 0.08,         ...easeStandard } },
};

export const slideUp: Variants = {
  hidden:  { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: durationNormal, ...easeDecelerate } },
  exit:    { opacity: 0, y: 6,  transition: { duration: durationFast,  ...easeStandard } },
};

export const slideDown: Variants = {
  hidden:  { opacity: 0, y: -10 },
  visible: { opacity: 1, y: 0,   transition: { duration: durationNormal, ...easeDecelerate } },
  exit:    { opacity: 0, y: -6,  transition: { duration: durationFast,   ...easeStandard } },
};

export const slideRight: Variants = {
  hidden:  { opacity: 0, x: -16 },
  visible: { opacity: 1, x: 0,  transition: { duration: durationNormal, ...easeDecelerate } },
  exit:    { opacity: 0, x: -8, transition: { duration: durationFast,   ...easeStandard } },
};

export const slideLeft: Variants = {
  hidden:  { opacity: 0, x: 16 },
  visible: { opacity: 1, x: 0,  transition: { duration: durationNormal, ...easeDecelerate } },
  exit:    { opacity: 0, x: 8,  transition: { duration: durationFast,   ...easeStandard } },
};

export const scaleIn: Variants = {
  hidden:  { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1,    transition: { duration: durationFast, ...easeSpring } },
  exit:    { opacity: 0, scale: 0.97, transition: { duration: durationFast, ...easeStandard } },
};

export const scaleInCenter: Variants = {
  hidden:  { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1,    transition: easeSpring },
  exit:    { opacity: 0, scale: 0.96, transition: { duration: durationFast, ...easeStandard } },
};

/* ── Stagger container ───────────────────────────────── */
export function staggerContainer(
  staggerChildren = 0.06,
  delayChildren = 0,
): Variants {
  return {
    hidden:  { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren, delayChildren },
    },
  };
}

export const staggerItem: Variants = slideUp;

/* ── Page transition ─────────────────────────────────── */
export const pageTransition: Variants = {
  hidden:  { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: durationNormal, ...easeDecelerate, staggerChildren: 0.05 },
  },
  exit: {
    opacity: 0,
    transition: { duration: durationFast, ...easeStandard },
  },
};

/* ── Drawer (side panel) ─────────────────────────────── */
export const drawerLeft: Variants = {
  hidden:  { x: "-100%", opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { duration: durationSlow, ...easeDecelerate } },
  exit:    { x: "-100%", opacity: 0, transition: { duration: durationNormal, ...easeStandard } },
};

export const drawerRight: Variants = {
  hidden:  { x: "100%", opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { duration: durationSlow, ...easeDecelerate } },
  exit:    { x: "100%", opacity: 0, transition: { duration: durationNormal, ...easeStandard } },
};

export const drawerBottom: Variants = {
  hidden:  { y: "100%", opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: durationSlow, ...easeDecelerate } },
  exit:    { y: "100%", opacity: 0, transition: { duration: durationNormal, ...easeStandard } },
};

/* ── Dialog / Modal ──────────────────────────────────── */
export const dialogOverlay: Variants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: durationNormal } },
  exit:    { opacity: 0, transition: { duration: durationFast } },
};

export const dialogContent: Variants = {
  hidden:  { opacity: 0, scale: 0.96, y: -8 },
  visible: {
    opacity: 1, scale: 1, y: 0,
    transition: { duration: durationNormal, ...easeSpring },
  },
  exit: {
    opacity: 0, scale: 0.98, y: 4,
    transition: { duration: durationFast, ...easeStandard },
  },
};

/* ── Toast ───────────────────────────────────────────── */
export const toastVariants: Variants = {
  hidden:  { opacity: 0, y: 16, scale: 0.96 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { duration: durationNormal, ...easeSpring },
  },
  exit: {
    opacity: 0, scale: 0.96, y: 8,
    transition: { duration: durationFast, ...easeStandard },
  },
};

/* ── Hover / Tap ─────────────────────────────────────── */
export const buttonPress = {
  whileHover: { scale: 1.01 },
  whileTap:   { scale: 0.97 },
  transition: easeSpring,
};

export const cardHover = {
  whileHover: { y: -2, boxShadow: "0 8px 24px -4px oklch(0.14 0.025 264 / 0.12)" },
  transition: { duration: durationFast, ...easeStandard },
};

/* ── Accordion / Collapsible ─────────────────────────── */
export const expandCollapse: Variants = {
  hidden:  { height: 0, opacity: 0, overflow: "hidden" },
  visible: {
    height: "auto", opacity: 1,
    transition: { height: { duration: durationNormal, ...easeDecelerate }, opacity: { duration: durationFast, delay: 0.05 } },
  },
  exit: {
    height: 0, opacity: 0,
    transition: { height: { duration: durationFast, ...easeStandard }, opacity: { duration: 0.08 } },
  },
};

/* ── Skeleton ────────────────────────────────────────── */
export const skeletonTransition: Transition = {
  repeat: Infinity,
  repeatType: "mirror",
  duration: 1.4,
  ease: "easeInOut",
};

/* ── Dropdown / Popover ──────────────────────────────── */
export const dropdownVariants: Variants = {
  hidden:  { opacity: 0, scale: 0.96, y: -4 },
  visible: {
    opacity: 1, scale: 1, y: 0,
    transition: { duration: durationFast, ...easeSpring },
  },
  exit: {
    opacity: 0, scale: 0.98, y: -2,
    transition: { duration: 0.10, ...easeStandard },
  },
};

/* ── Tooltip ─────────────────────────────────────────── */
export const tooltipVariants: Variants = {
  hidden:  { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.10, ...easeSpring } },
  exit:    { opacity: 0, scale: 0.97, transition: { duration: 0.08 } },
};

/* ── Sidebar collapse ────────────────────────────────── */
export const sidebarVariants: Variants = {
  expanded:  { width: "15rem", transition: { duration: durationNormal, ...easeDecelerate } },
  collapsed: { width: "4rem",  transition: { duration: durationNormal, ...easeStandard } },
};

export const sidebarLabelVariants: Variants = {
  expanded:  { opacity: 1, width: "auto", transition: { delay: 0.06, duration: durationFast } },
  collapsed: { opacity: 0, width: 0,      transition: { duration: durationFast } },
};

/* ── Number count-up ─────────────────────────────────── */
export const countUpTransition: Transition = {
  duration: durationSlower,
  ease: [0.4, 0, 0.2, 1],
};
