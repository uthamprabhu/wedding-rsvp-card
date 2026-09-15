'use client';

import { motion, useReducedMotion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { HeartHandshake, MoonStar, Sparkles, Utensils, UsersRound } from 'lucide-react';

interface TimelineEvent {
  time: string;
  title: string;
  description: string;
  note: string;
  icon: LucideIcon;
}

const events: TimelineEvent[] = [
  {
    time: '4:00 PM',
    title: 'Welcome & Mehndi',
    description: 'Begin the evening with warm greetings, delicate henna, and sweet refreshments with the people we love most.',
    note: 'Gather & greet',
    icon: Sparkles,
  },
  {
    time: '5:00 PM',
    title: 'The Nikah',
    description: 'Join us as we begin our marriage with a beautiful ceremony surrounded by family, blessings, and dua.',
    note: 'The ceremony',
    icon: MoonStar,
  },
  {
    time: '6:30 PM',
    title: 'Family Portraits',
    description: 'A quiet moment for photographs, embraces, and memories we will carry with us long after the evening ends.',
    note: 'Together in joy',
    icon: UsersRound,
  },
  {
    time: '7:30 PM',
    title: 'Dinner & Walima',
    description: 'Share a generous feast of favourite flavours as we celebrate the beginning of our life together.',
    note: 'A blessed feast',
    icon: Utensils,
  },
  {
    time: '9:00 PM',
    title: 'An Evening of Joy',
    description: 'Stay with us for warm conversation, sweet memories, and a final celebration beneath the evening sky.',
    note: 'Celebrate with us',
    icon: HeartHandshake,
  },
];

export default function InteractiveItinerary() {
  const reducedMotion = useReducedMotion();

  return (
    <section className="itinerary-experience" aria-labelledby="itinerary-title">
      <div className="itinerary-shell">
        <motion.header
          className="itinerary-header"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.3 }}
          transition={{ duration: 0.7 }}
        >
          <p className="itinerary-bismillah">بِسْمِ ٱللَّٰهِ <span>•</span> with gratitude</p>
          <p className="itinerary-monogram">F <span>&</span> B</p>
          <h1 id="itinerary-title">A day of blessings</h1>
          <p className="itinerary-lead">A thoughtful sequence of moments, shared with the people who make our story complete.</p>
        </motion.header>

        <div className="itinerary-timeline">
          <motion.div
            className="itinerary-line"
            aria-hidden="true"
            initial={{ scaleY: 0, opacity: 0 }}
            whileInView={{ scaleY: 1, opacity: 1 }}
            viewport={{ once: false, amount: 0.08 }}
            transition={{ duration: reducedMotion ? 0 : 1.25, ease: [0.22, 1, 0.36, 1] }}
          />
          {events.map((event, index) => {
            const Icon = event.icon;
            const entersFromLeft = index % 2 === 0;
            return (
              <motion.article
                className={`itinerary-event ${index % 2 === 0 ? 'is-left' : 'is-right'}`}
                key={event.title}
                initial={{ opacity: 0, x: reducedMotion ? 0 : entersFromLeft ? -46 : 46, y: 20, scale: 0.975 }}
                whileInView={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                viewport={{ once: false, amount: 0.25 }}
                transition={{ duration: reducedMotion ? 0 : 0.68, delay: reducedMotion ? 0 : 0.04, ease: [0.22, 1, 0.36, 1] }}
              >
                <motion.div className="itinerary-card" whileHover={reducedMotion ? undefined : { y: -4, rotate: entersFromLeft ? -0.35 : 0.35 }} transition={{ type: 'spring', stiffness: 260, damping: 20 }}>
                  <div className="itinerary-card-meta"><span>{event.note}</span><time>{event.time}</time></div>
                  <h2>{event.title}</h2>
                  <p>{event.description}</p>
                </motion.div>
                <motion.div className="itinerary-marker" aria-hidden="true" initial={{ opacity: 0, scale: 0.35, rotate: -30 }} whileInView={{ opacity: 1, scale: 1, rotate: 0 }} viewport={{ once: false, amount: 0.35 }} transition={{ type: 'spring', stiffness: 240, damping: 17, delay: reducedMotion ? 0 : 0.13 }}><Icon size={18} strokeWidth={1.4} /></motion.div>
                <div className="itinerary-spacer" aria-hidden="true" />
              </motion.article>
            );
          })}
        </div>

        <motion.p className="itinerary-closing" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: false, amount: 0.7 }} transition={{ duration: reducedMotion ? 0 : 0.65, ease: [0.22, 1, 0.36, 1] }}>May Allah fill this gathering with peace, love, and barakah.</motion.p>
        <div className="itinerary-ornament" aria-hidden="true"><span /><i>✦</i><span /></div>
        <div className="itinerary-bottom-space" aria-hidden="true" />
      </div>
    </section>
  );
}
