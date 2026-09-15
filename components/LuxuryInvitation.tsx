'use client';

import Image from 'next/image';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { motion, useMotionValue, useScroll, useSpring, useTransform } from 'framer-motion';
import { ArrowDown, ArrowRight, ExternalLink, MapPin } from 'lucide-react';
import { Fragment, useEffect, useRef, useState } from 'react';
import PaperBackground from '@/components/PaperBackground';
import WeddingCountdown from '@/components/WeddingCountdown';
import { AdaptiveLantern } from '@/components/CelestialBackdrop';

const RealisticButterflies = dynamic(() => import('@/components/RealisticButterflies'), { ssr: false });

const reveal = { hidden: { opacity: 0, y: 20, filter: 'blur(4px)' }, visible: { opacity: 1, y: 0, filter: 'blur(0px)' } }; // Reduced blur for performance

function Reveal({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    setIsMobile(window.innerWidth <= 768);
  }, []);
  
  return <motion.div className={className} variants={reveal} initial="hidden" whileInView="visible" viewport={{ once: isMobile, amount: 0.38 }} transition={{ duration: isMobile ? 0.6 : 1.05, delay: delay + (isMobile ? 0 : .08), ease: [0.22, 1, 0.36, 1] }}>{children}</motion.div>;
}

const openingArabicWords = ['بِسْمِ', 'اللَّهِ', 'الرَّحْمَنِ', 'الرَّحِيمِ'];
const getArabicGraphemes = (value: string) => {
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    return Array.from(new Intl.Segmenter('ar', { granularity: 'grapheme' }).segment(value), ({ segment }) => segment);
  }
  return Array.from(value);
};

function ArabicOpeningReveal() {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    setIsMobile(window.innerWidth <= 768);
  }, []);
  
  return <motion.p className="invitation-arabic invitation-arabic-opening" lang="ar" dir="rtl" initial="hidden" whileInView="visible" viewport={{ once: isMobile, amount: 0.7 }} variants={{ hidden: {}, visible: { transition: { staggerChildren: isMobile ? .03 : .052, delayChildren: isMobile ? 0 : .12 } } }}>
    {openingArabicWords.map((word, wordIndex) => <Fragment key={word}><span>{getArabicGraphemes(word).map((letter, index) => <motion.span key={`${letter}-${index}`} variants={{ hidden: { opacity: 0, x: isMobile ? 12 : 24, filter: 'blur(4px)' }, visible: { opacity: 1, x: 0, filter: 'blur(0px)' } }} transition={{ duration: isMobile ? .4 : .58, ease: [0.22, 1, 0.36, 1] }}>{letter}</motion.span>)}</span>{wordIndex === 1 && <br className="invitation-arabic-mobile-break" />}{wordIndex < openingArabicWords.length - 1 && ' '}</Fragment>)}
  </motion.p>;
}

function CornerOrnaments() {
  const ornament = <g fill="currentColor" stroke="none"><g transform="translate(24 27)"><circle cx="24" cy="10" r="10" opacity=".72" /><circle cx="38" cy="24" r="10" opacity=".72" /><circle cx="24" cy="38" r="10" opacity=".72" /><circle cx="10" cy="24" r="10" opacity=".72" /><circle cx="24" cy="24" r="6" fill="#b88a50" /></g><g transform="translate(78 67) scale(.72)"><circle cx="24" cy="10" r="10" opacity=".65" /><circle cx="38" cy="24" r="10" opacity=".65" /><circle cx="24" cy="38" r="10" opacity=".65" /><circle cx="10" cy="24" r="10" opacity=".65" /><circle cx="24" cy="24" r="6" fill="#b88a50" /></g><circle cx="72" cy="57" r="3" opacity=".5" /><circle cx="120" cy="104" r="3" opacity=".5" /></g>;
  return <div className="invitation-ornaments" aria-hidden="true"><svg className="invitation-corner invitation-corner-tl" viewBox="0 0 180 180" fill="none">{ornament}</svg><svg className="invitation-corner invitation-corner-tr" viewBox="0 0 180 180" fill="none">{ornament}</svg><svg className="invitation-corner invitation-corner-bl" viewBox="0 0 180 180" fill="none">{ornament}</svg><svg className="invitation-corner invitation-corner-br" viewBox="0 0 180 180" fill="none">{ornament}</svg></div>;
}

function DeferredButterflies() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Three.js is atmospheric rather than essential. Let text and layout paint first.
    const timer = window.setTimeout(() => setReady(true), 1000);
    return () => window.clearTimeout(timer);
  }, []);

  return ready ? <RealisticButterflies /> : null;
}

function DeferredPaperBackground() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // The solid paper colour on the page is an intentional fallback. Starting
    // its shader after first paint avoids competing with the opening reveal.
    const timer = window.setTimeout(() => setReady(true), 180);
    return () => window.clearTimeout(timer);
  }, []);

  return ready ? <PaperBackground /> : null;
}

function CouplePortraitStory() {
  const ref = useRef<HTMLDivElement>(null);
  const [featured, setFeatured] = useState<'bride' | 'groom'>('bride');
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => window.innerWidth <= 768;
    setIsMobile(checkMobile());
    const handleResize = () => setIsMobile(checkMobile());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Disable scroll-linked animations on mobile for performance
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const portraitY = useTransform(scrollYProgress, [0, 1], isMobile ? [0, 0] : [34, -34]);
  const backY = useTransform(scrollYProgress, [0, 1], isMobile ? [0, 0] : [-28, 28]);
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const rotateY = useSpring(useTransform(pointerX, [-.5, .5], isMobile ? [0, 0] : [-3.5, 3.5]), { stiffness: 90, damping: 18 });
  const rotateX = useSpring(useTransform(pointerY, [-.5, .5], isMobile ? [0, 0] : [2.5, -2.5]), { stiffness: 90, damping: 18 });
  return <section className="couple-portrait-story" ref={ref} aria-label="Meet the couple">
    <motion.div className="portrait-memory portrait-memory-left" style={{ y: backY, rotate: -9 }}><Image src="/images/humans/couple-pose-straight-full.jpg" alt="Farzeen and Bilal together" fill sizes="(max-width: 640px) 29vw, 190px" className="object-contain" /></motion.div>
    <motion.div className="portrait-memory portrait-memory-right" style={{ y: portraitY, rotate: 8 }}><Image src="/images/humans/couple-pose-look-eachother.jpg" alt="Farzeen and Bilal sharing a moment" fill sizes="(max-width: 640px) 28vw, 185px" className="object-contain" /></motion.div>
    <div className="couple-presentation" data-featured={featured} onPointerMove={(event) => { const bounds = event.currentTarget.getBoundingClientRect(); pointerX.set((event.clientX - bounds.left) / bounds.width - .5); pointerY.set((event.clientY - bounds.top) / bounds.height - .5); }} onPointerLeave={() => { pointerX.set(0); pointerY.set(0); }}>
      <motion.article className="couple-profile couple-profile-bride" style={{ y: portraitY, rotateX, rotateY }}>
        <figure className="couple-portrait-frame"><Image src="/images/humans/bride-pose-straight.jpg" alt="Farzeen Fathima Firoz" fill sizes="(max-width: 640px) 80vw, (max-width: 1024px) 38vw, 390px" className="object-cover" /></figure>
        <p className="portrait-role">The bride</p><h3>Farzeen <span>Fathima Firoz</span></h3>
      </motion.article>
      <div className="couple-union" aria-hidden="true"><span>✦</span><i /><p>two lives,<br />one prayer</p><i /><span>✦</span></div>
      <motion.article className="couple-profile couple-profile-groom" style={{ y: backY, rotateX, rotateY }}>
        <figure className="couple-portrait-frame"><Image src="/images/humans/groom-pose-straight.jpg" alt="Bilal Nasimudeen" fill sizes="(max-width: 640px) 80vw, (max-width: 1024px) 38vw, 390px" className="object-cover" /></figure>
        <p className="portrait-role">The groom</p><h3>Bilal <span>Nasimudeen</span></h3>
      </motion.article>
    </div>
    <div className="mobile-person-switch" role="tablist" aria-label="Choose a portrait"><button type="button" role="tab" aria-selected={featured === 'bride'} onClick={() => setFeatured('bride')}>Farzeen</button><span>✦</span><button type="button" role="tab" aria-selected={featured === 'groom'} onClick={() => setFeatured('groom')}>Bilal</button></div>
    <motion.figure className="couple-hands-portrait" style={{ y: backY }}><Image src="/images/humans/couple-handsholding-only.jpg" alt="Farzeen and Bilal holding hands" fill sizes="(max-width: 640px) 148px, 132px" className="object-cover" /></motion.figure>
    <p className="couple-weds">Farzeen <span>weds</span> Bilal</p>
  </section>;
}

export default function LuxuryInvitation() {
  const scrollToMessage = () => {
    document.getElementById('invitation-message')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return <main className="luxury-invitation"><DeferredPaperBackground /><DeferredButterflies /><AdaptiveLantern /><CornerOrnaments /><div className="invitation-story">
    <section className="invitation-opening"><div><ArabicOpeningReveal /><Reveal delay={.38}><div className="invitation-starline"><span />✦<span /></div><p className="invitation-translation">In the name of Allah,<br />the Most Gracious, the Most Merciful</p></Reveal></div><motion.a href="#invitation-message" className="invitation-scroll" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4, duration: .7 }} aria-label="Begin invitation" onClick={(event) => { event.preventDefault(); scrollToMessage(); }}><span>Begin</span><ArrowDown size={15} /></motion.a></section>
    <section id="invitation-message" className="invitation-message-section"><Reveal className="invitation-message"><p className="section-eyebrow">A family invitation</p><blockquote>“With hearts full of joy, we invite you and your family to be a part of the Nikah and Wedding Ceremony of our beloved daughter.”</blockquote><p className="invitation-from">With love from<br /><strong>Mr. Firoz Khan M <em>(Late)</em><br />&amp; Mrs. Ambily Firoz</strong></p></Reveal></section>
    <section className="invitation-names" aria-label="The couple"><Reveal><p className="section-eyebrow">Together with their families</p></Reveal><Reveal delay={.06}><h1>Farzeen <span>Fathima Firoz</span></h1></Reveal><Reveal delay={.1}><p className="invitation-with">with</p></Reveal><Reveal delay={.14}><h2>Bilal <span>Nasimudeen</span></h2></Reveal><Reveal delay={.18}><p className="invitation-event-label">Nikah &amp; Wedding Ceremony</p></Reveal></section>
    <Reveal><WeddingCountdown /></Reveal>
    <section className="invitation-portrait-section"><Reveal><CouplePortraitStory /></Reveal></section>
    <section className="invitation-event-section"><Reveal className="event-heading"><p className="section-eyebrow">Save the date</p><h2>Sunday<br /><span>01 November 2026</span></h2><p>21 Jumada Al-Awwal 1448 AH</p></Reveal><Reveal className="event-details" delay={.08}><div><span>Nikah</span><strong>12:00 Noon – 12:30 PM</strong></div><div><span>Venue</span><strong>M Convention Centre</strong><p><MapPin size={14} /> Vallicode, Pathanamthitta</p></div></Reveal><Reveal className="event-map" delay={.12}><iframe title="Map to M Convention Centre, Vallicode" src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3938.206138050515!2d76.76959297456129!3d9.225851590843531!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3b0615513ccc43d9%3A0x97467c32644f4a62!2sM%20CONVENTION%20CENTRE!5e0!3m2!1sen!2sin!4v1789413356381!5m2!1sen!2sin" allowFullScreen loading="lazy" referrerPolicy="strict-origin-when-cross-origin" /><a className="event-map-link" href="https://www.google.com/maps/search/?api=1&query=M%20Convention%20Centre%2C%20Vallicode%2C%20Pathanamthitta" target="_blank" rel="noreferrer">Open in Google Maps <ExternalLink size={14} /></a></Reveal></section>
    <section className="invitation-families"><Reveal><p className="section-eyebrow">Two homes, one prayer</p></Reveal><div className="family-columns"><Reveal className="family-note"><span>The bride&apos;s family</span><h3>Puthuveedu</h3><p>Pettah (P.O.),<br />Pathanamthitta</p></Reveal><Reveal className="family-note family-groom" delay={.08}><span>The groom&apos;s parents</span><h3>Mr. Nasimudeen M<br />&amp; Mrs. Naseeja S</h3><p className="family-address">Ambalathil Veedu, Poredom (P.O.),<br />Chadayamangalam, Kollam</p></Reveal></div></section>
    <section className="invitation-closing"><Reveal><p className="invitation-arabic invitation-closing-arabic" lang="ar" dir="rtl">بارك الله لكما وبارك عليكما وجمع بينكما في خير</p><p className="closing-copy">We would be honoured to share this blessed beginning with you.</p><div className="closing-links"><Link href="/itinerary">Discover the day <ArrowRight size={16} /></Link><Link href="/rsvp" className="closing-rsvp">Kindly RSVP</Link></div><p className="closing-support">Sharing the happiness: Fajar Firoz &amp; Fajas Firoz<br /><a href="tel:+917902925262">+91 7902925262</a></p></Reveal></section>
  </div></main>;
}
