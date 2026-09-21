'use client';

/**
 * The itinerary: a simple 3-day swipeable experience.
 *
 * Uses native CSS scroll-snap for the swipe instead of hand-rolled drag
 * physics - the browser handles momentum, elasticity and touch smoothness
 * far better than any custom implementation, and it's a fraction of the code.
 */

import { motion, useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

interface ItineraryDay {
  day: string;
  date: string;
  title: string;
  description: string;
  timing: string;
  location: string;
  /** Google Maps link for the venue. Omitted when the venue isn't set yet. */
  mapUrl?: string;
}

const DAYS: ItineraryDay[] = [
  {
    day: 'Day 1',
    date: '30 October 2026',
    title: 'Fabi Mehandi',
    description:
      "An evening where two families come together and the celebrations officially begin. As Bilal's family presents Farzeen with her wedding attire, an intimate family tradition unfolds. Then comes the colour, the mehendi, the music and the celebration, as everyone gathers around Farzeen for the first chapter of FABI.",
    timing: '6:00 PM \u2013 9:00 PM',
    location: "Farzeen's Residence",
    mapUrl: 'https://maps.app.goo.gl/yYyNNZoZ9fMU18kJA',
  },
  {
    day: 'Day 2',
    date: '31 October 2026',
    title: "Molutty's Haldi & Sangeeth",
    description:
      "One last evening before she becomes a bride. Farzeen's closest family and friends gather in yellow for an intimate celebration filled with haldi, music, games, laughter, good food and a little chaos. A night for her favourite people to celebrate Molutty before tomorrow changes everything.",
    timing: '5:00 PM \u2013 9:00 PM',
    location: "Farzeen's Residence",
    mapUrl: 'https://maps.app.goo.gl/yYyNNZoZ9fMU18kJA',
  },
  {
    day: 'Day 3',
    date: '01 November 2026',
    title: 'The Fabi Big Day',
    description:
      'The day we have been waiting for. Join Farzeen and Bilal as they begin their next chapter surrounded by the people who matter most.',
    timing: 'Arrival 11:30 AM \u00b7 Nikah 12:00 PM \u2013 12:30 PM',
    location: 'M Convention Centre',
    mapUrl: 'https://www.google.com/maps/search/?api=1&query=M%20Convention%20Centre%2C%20Vallicode%2C%20Pathanamthitta',
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

export default function InteractiveItinerary() {
  const [active, setActive] = useState(0);
  const prefersReducedMotion = useReducedMotion();
  const trackRef = useRef<HTMLDivElement>(null);

  // Track which card is currently snapped into view, purely from native
  // scroll position - no drag state, no motion values.
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const index = Math.round(el.scrollLeft / el.clientWidth);
        setActive(Math.max(0, Math.min(DAYS.length - 1, index)));
      });
    };

    el.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  const goTo = useCallback((rawIndex: number) => {
    const el = trackRef.current;
    if (!el) return;
    const index = Math.max(0, Math.min(DAYS.length - 1, rawIndex));
    el.scrollTo({
      left: index * el.clientWidth,
      behavior: 'smooth',
    });
  }, []);

  return (
    <section className="itinerary-experience" aria-labelledby="itinerary-title">
      <div className="itinerary-shell">
        <motion.header
          className="itinerary-header"
          initial={prefersReducedMotion ? undefined : 'hidden'}
          animate="visible"
          variants={fadeUp}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <h1 id="itinerary-title">The Itinerary</h1>
          <motion.p
            className="itinerary-lead"
            initial={prefersReducedMotion ? undefined : 'hidden'}
            animate="visible"
            variants={fadeUp}
            transition={{ duration: 0.5, delay: 0.08, ease: 'easeOut' }}
          >
            Three days. Three celebrations. One story.
          </motion.p>
        </motion.header>

        <motion.div
          className="itinerary-carousel"
          initial={prefersReducedMotion ? undefined : 'hidden'}
          animate="visible"
          variants={fadeUp}
          transition={{ duration: 0.5, delay: 0.16, ease: 'easeOut' }}
        >
          {/* Desktop only (hidden via CSS on touch viewports, where swipe/dots
              are the natural gesture). Dots alone are easy to miss as the
              primary way to navigate on a mouse-and-keyboard device. */}
          <button
            type="button"
            className="itinerary-arrow itinerary-arrow-prev"
            onClick={() => goTo(active - 1)}
            disabled={active === 0}
            aria-label="Previous day"
          >
            <ChevronLeft size={22} strokeWidth={2} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="itinerary-arrow itinerary-arrow-next"
            onClick={() => goTo(active + 1)}
            disabled={active === DAYS.length - 1}
            aria-label="Next day"
          >
            <ChevronRight size={22} strokeWidth={2} aria-hidden="true" />
          </button>

          <div className="itinerary-track" ref={trackRef}>
            {DAYS.map((entry) => (
              <article className="itinerary-slide" key={entry.title}>
                <div className="itinerary-card">
                  <p className="itinerary-card-day">
                    {entry.day} <span>&middot;</span> {entry.date}
                  </p>
                  <h2>{entry.title}</h2>
                  <p className="itinerary-card-description">{entry.description}</p>
                  <div className="itinerary-card-meta">
                    <span className="itinerary-card-timing">{entry.timing}</span>
                    {entry.mapUrl ? (
                      <a
                        href={entry.mapUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="itinerary-card-location itinerary-card-location-link"
                        aria-label={`Open ${entry.location} in Google Maps`}
                      >
                        <span>{entry.location}</span>
                        <MapPin size={14} strokeWidth={2} aria-hidden="true" />
                      </a>
                    ) : (
                      <span className="itinerary-card-location">{entry.location}</span>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </motion.div>

        <motion.div
          className="itinerary-dots"
          role="tablist"
          aria-label="Choose a day"
          initial={prefersReducedMotion ? undefined : 'hidden'}
          animate="visible"
          variants={fadeUp}
          transition={{ duration: 0.5, delay: 0.22, ease: 'easeOut' }}
        >
          {DAYS.map((entry, index) => (
            <button
              key={entry.title}
              type="button"
              role="tab"
              aria-selected={index === active}
              aria-label={`${entry.day}: ${entry.title}`}
              className={`itinerary-dot${index === active ? ' is-active' : ''}`}
              onClick={() => goTo(index)}
            />
          ))}
        </motion.div>

        <motion.p
          className="itinerary-swipe-hint"
          initial={prefersReducedMotion ? undefined : 'hidden'}
          animate="visible"
          variants={fadeUp}
          transition={{ duration: 0.5, delay: 0.28, ease: 'easeOut' }}
        >
          Swipe to discover the next celebration
        </motion.p>
      </div>
    </section>
  );
}
