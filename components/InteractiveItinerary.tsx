'use client';

import { motion } from 'framer-motion';
import { VerticalTimeline, VerticalTimelineElement } from 'react-vertical-timeline-component';
import 'react-vertical-timeline-component/style.min.css';

const events = [
  {
    time: '4:00 PM',
    title: 'Welcome Reception',
    description: 'Join us for light refreshments as we gather and welcome our cherished guests',
    icon: '🥂',
    color: '#D4A574',
  },
  {
    time: '5:00 PM',
    title: 'Ceremony',
    description: 'The moment we say "I do" and begin our journey together',
    icon: '💍',
    color: '#C9A55C',
  },
  {
    time: '6:30 PM',
    title: 'Cocktail Hour',
    description: 'Mingle, sip signature cocktails, and celebrate with us',
    icon: '🍸',
    color: '#D4A574',
  },
  {
    time: '7:30 PM',
    title: 'Reception Dinner',
    description: 'Feast on a curated multi-course meal prepared by our chef',
    icon: '🍽️',
    color: '#C9A55C',
  },
  {
    time: '9:00 PM',
    title: 'First Dance',
    description: 'Watch us take the floor together for the first time as a married couple',
    icon: '💃',
    color: '#D4A574',
  },
  {
    time: '9:30 PM',
    title: 'Party Time',
    description: 'Dance the night away with us under the stars',
    icon: '🎉',
    color: '#C9A55C',
  },
];

export default function InteractiveItinerary() {
  return (
    <div className="w-full min-h-screen flex items-center justify-center py-16 md:py-20 px-4 md:px-8">
      <div className="w-full max-w-5xl">
        {/* Header */}
        <motion.div
          className="text-center mb-12 md:mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 
            className="text-4xl md:text-5xl lg:text-6xl text-[#D4A574] mb-3 md:mb-4"
            style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600 }}
          >
            The Journey Awaits
          </h2>
          <p 
            className="text-base md:text-lg text-[#8B7355]"
            style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400 }}
          >
            Our celebration unfolds throughout the day
          </p>
        </motion.div>

        {/* Timeline */}
        <VerticalTimeline
          lineColor="rgba(212, 165, 116, 0.3)"
          animate={true}
        >
          {events.map((event, index) => (
            <VerticalTimelineElement
              key={index}
              className="vertical-timeline-element"
              contentStyle={{
                background: 'rgba(255, 255, 255, 0.7)',
                backdropFilter: 'blur(12px)',
                border: '2px solid rgba(212, 165, 116, 0.2)',
                borderRadius: '24px',
                boxShadow: '0 8px 32px rgba(212, 165, 116, 0.15)',
                padding: '24px 28px',
              }}
              contentArrowStyle={{
                borderRight: '12px solid rgba(255, 255, 255, 0.7)',
              }}
              iconStyle={{
                background: event.color,
                color: '#fff',
                boxShadow: `0 0 0 4px rgba(212, 165, 116, 0.1), 0 4px 12px rgba(212, 165, 116, 0.3)`,
                width: '56px',
                height: '56px',
                marginLeft: '-28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '28px',
              }}
              icon={<span>{event.icon}</span>}
            >
              {/* Time */}
              <p 
                className="text-xs md:text-sm font-semibold tracking-wider mb-1.5 md:mb-2"
                style={{ 
                  fontFamily: "'Inter', sans-serif",
                  color: event.color,
                  letterSpacing: '0.05em',
                }}
              >
                {event.time}
              </p>

              {/* Title */}
              <h3 
                className="text-xl md:text-2xl lg:text-3xl text-[#8B7355] mb-2 md:mb-3"
                style={{ 
                  fontFamily: "'Cormorant Garamond', serif",
                  fontWeight: 600,
                  lineHeight: 1.3,
                }}
              >
                {event.title}
              </h3>

              {/* Description */}
              <p 
                className="text-sm md:text-base text-[#8B7355] opacity-80 leading-relaxed"
                style={{ 
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 400,
                  lineHeight: 1.6,
                }}
              >
                {event.description}
              </p>
            </VerticalTimelineElement>
          ))}
        </VerticalTimeline>

        {/* Bottom spacing for buttons */}
        <div className="h-24 md:h-32" />
      </div>
    </div>
  );
}
