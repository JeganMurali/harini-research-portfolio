import gsap from 'gsap'
import { CustomEase } from 'gsap/CustomEase'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

// One motion identity for the whole site: "Premium" archetype (editorial / portfolio).
// Signature easing carries ~80% of motion; entrances decelerate, exits accelerate.
gsap.registerPlugin(CustomEase, ScrollTrigger)

export const ease = {
  signature: CustomEase.create('signature', '0.4, 0, 0.2, 1'),
  enter: CustomEase.create('enter', '0.05, 0.7, 0.1, 1'),
  exit: CustomEase.create('exit', '0.3, 0, 1, 1'),
  ambient: 'sine.inOut',
}

// Duration palette (seconds): quick / standard / slow, plus a dramatic tier for reveals.
export const dur = { quick: 0.35, standard: 0.5, slow: 0.8, dramatic: 1.1 }

// Stagger budgets stay under 500ms in total.
export const stagger = { standard: 0.08, dramatic: 0.12 }

// Dev-only handle so browser tests can freeze timelines at exact moments.
if (import.meta.env.DEV) window.__gsap = gsap

export const prefersReducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches

export { gsap, ScrollTrigger }
