import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

// Register plugins and set global defaults for performance
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger)

  // Global defaults for 60fps performance (recommended by GSAP)
  gsap.defaults({
    force3D: true,  // GPU acceleration
    lazy: false,    // Immediate rendering
  })
}

// Default ScrollTrigger configuration for luxury feel
export const defaultScrollTriggerConfig = {
  start: "top 85%",
  end: "bottom 15%",
  toggleActions: "play none none reverse",
  markers: false,
}

// Curated easings for premium motion
export const easings = {
  // Smooth and luxurious - primary easing
  smooth: "power3.out",
  // For bidirectional animations
  smoothInOut: "power2.inOut",
  // Elegant entrance
  elegantIn: "power4.out",
  // Quick and snappy
  snappy: "power3.inOut",
  // Subtle bounce for playful elements
  softBounce: "back.out(1.4)",
  // Elastic for attention-grabbing
  elastic: "elastic.out(1, 0.5)",
  // Linear for continuous animations
  linear: "none",
  // Custom bezier for scroll reveals
  reveal: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
} as const

// Duration presets (in seconds)
export const durations = {
  instant: 0.15,
  fast: 0.3,
  normal: 0.6,
  slow: 0.9,
  reveal: 1.2,
  dramatic: 1.8,
} as const

// Stagger presets
export const staggers = {
  fast: 0.05,
  normal: 0.1,
  slow: 0.15,
  dramatic: 0.2,
} as const

// Animation presets for common patterns
export const animationPresets = {
  // Fade up reveal - most common
  fadeUp: {
    from: { y: 60, opacity: 0 },
    to: { y: 0, opacity: 1, duration: durations.reveal, ease: easings.smooth },
  },
  // Fade in only
  fadeIn: {
    from: { opacity: 0 },
    to: { opacity: 1, duration: durations.normal, ease: easings.smooth },
  },
  // Scale reveal for images/cards
  scaleReveal: {
    from: { scale: 0.95, opacity: 0 },
    to: { scale: 1, opacity: 1, duration: durations.reveal, ease: easings.smooth },
  },
  // Clip reveal from bottom
  clipFromBottom: {
    from: { clipPath: "inset(100% 0 0 0)" },
    to: { clipPath: "inset(0% 0 0 0)", duration: durations.reveal, ease: easings.smoothInOut },
  },
  // Slide from left
  slideFromLeft: {
    from: { x: -100, opacity: 0 },
    to: { x: 0, opacity: 1, duration: durations.slow, ease: easings.smooth },
  },
  // Slide from right
  slideFromRight: {
    from: { x: 100, opacity: 0 },
    to: { x: 0, opacity: 1, duration: durations.slow, ease: easings.smooth },
  },
  // Character reveal for text
  charReveal: {
    from: { y: "100%", opacity: 0, rotateX: -45 },
    to: { y: "0%", opacity: 1, rotateX: 0, duration: durations.normal, ease: easings.smooth },
    stagger: 0.03,
  },
  // Word reveal for text
  wordReveal: {
    from: { y: "100%", opacity: 0 },
    to: { y: "0%", opacity: 1, duration: durations.normal, ease: easings.smooth },
    stagger: 0.08,
  },
  // Line reveal for paragraphs
  lineReveal: {
    from: { y: 40, opacity: 0 },
    to: { y: 0, opacity: 1, duration: durations.slow, ease: easings.smooth },
    stagger: 0.15,
  },
} as const

// Helper to create scroll-triggered animation
export function createScrollAnimation(
  element: gsap.TweenTarget,
  animation: { from: gsap.TweenVars; to: gsap.TweenVars },
  scrollTriggerOptions?: Partial<ScrollTrigger.Vars>
) {
  return gsap.fromTo(element, animation.from, {
    ...animation.to,
    scrollTrigger: {
      trigger: element as Element,
      ...defaultScrollTriggerConfig,
      ...scrollTriggerOptions,
    },
  })
}

// Helper for batch animations (performance optimized for grids)
export function createBatchAnimation(
  selector: string,
  animation: { from: gsap.TweenVars; to: gsap.TweenVars },
  stagger = staggers.normal
) {
  ScrollTrigger.batch(selector, {
    onEnter: (elements) => {
      gsap.fromTo(
        elements,
        animation.from,
        {
          ...animation.to,
          stagger,
        }
      )
    },
    onLeaveBack: (elements) => {
      gsap.to(elements, {
        ...animation.from,
        stagger,
      })
    },
  })
}

// Split text into spans for character/word animations
export function splitText(text: string, type: "chars" | "words" | "lines"): string[] {
  switch (type) {
    case "chars":
      return text.split("")
    case "words":
      return text.split(" ")
    case "lines":
      return text.split("\n")
    default:
      return [text]
  }
}

export { gsap, ScrollTrigger }
