'use client';

import { motion } from 'framer-motion';
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
    description: 'Stay with us for conversation, music, and a final celebration beneath the evening sky.',
    note: 'Celebrate with us',
    icon: HeartHandshake,
  },
];

export default function InteractiveItinerary() {
  return (
    <section className="itinerary-experience" aria-labelledby="itinerary-title">
      <div className="itinerary-shell">
        <motion.header
          className="itinerary-header"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7 }}
        >
          <p className="itinerary-bismillah">Bismillah <span>•</span> with gratitude</p>
          <p className="itinerary-monogram">F <span>&</span> B</p>
          <h1 id="itinerary-title">A day of blessings</h1>
          <p className="itinerary-lead">A thoughtful sequence of moments, shared with the people who make our story complete.</p>
        </motion.header>

        <div className="itinerary-timeline">
          <div className="itinerary-line" aria-hidden="true" />
          {events.map((event, index) => {
            const Icon = event.icon;
            return (
              <motion.article
                className={`itinerary-event ${index % 2 === 0 ? 'is-left' : 'is-right'}`}
                key={event.title}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ duration: 0.55, delay: index * 0.06 }}
              >
                <div className="itinerary-card">
                  <div className="itinerary-card-meta"><span>{event.note}</span><time>{event.time}</time></div>
                  <h2>{event.title}</h2>
                  <p>{event.description}</p>
                </div>
                <div className="itinerary-marker" aria-hidden="true"><Icon size={18} strokeWidth={1.4} /></div>
                <div className="itinerary-spacer" aria-hidden="true" />
              </motion.article>
            );
          })}
        </div>

        <p className="itinerary-closing">May this gathering be filled with peace, love, and barakah.</p>
        <div className="itinerary-ornament" aria-hidden="true"><span /><i>✦</i><span /></div>
        <div className="itinerary-bottom-space" aria-hidden="true" />
      </div>
    </section>
  );
}
