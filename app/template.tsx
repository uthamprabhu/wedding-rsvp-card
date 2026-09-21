/**
 * Route template — intentionally no transition wrapper.
 *
 * A previous version wrapped every page in a Framer Motion opacity fade,
 * which caused a black flash on navigation: the new route rendered at
 * opacity:0 over the dark invitation background while the loading.tsx
 * file was invisible underneath it. Each page owns its own entrance
 * animation, and the loading.tsx files for /rsvp and /itinerary show
 * immediately at full opacity so the user always sees something.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
