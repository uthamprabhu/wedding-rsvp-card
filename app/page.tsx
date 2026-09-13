'use client';

import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import PaperBackground from '@/components/PaperBackground';
import LoadingAnimation from '@/components/LoadingAnimation';
import InvitationHero from '@/components/InvitationHero';
import FloatingParticles from '@/components/FloatingParticles';
import { ArrowRight } from 'lucide-react';
import { useGesture } from '@use-gesture/react';
import { useSpring, animated } from '@react-spring/web';

const FluidBackground = dynamic(() => import('@/components/FluidBackground'), {
  ssr: false,
});

export default function Home() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [showFluid, setShowFluid] = useState(false);
  const [invitationOpened, setInvitationOpened] = useState(false);
  const [logoTransitioning, setLogoTransitioning] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [currentCard, setCurrentCard] = useState<'first' | 'second'>('first');

  // Spring animation for card drag
  const [{ x, y }, api] = useSpring(() => ({ x: 0, y: 0 }));

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      setTimeout(() => {
        setShowFluid(true);
      }, 100);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleOpenInvitation = () => {
    setLogoTransitioning(true);
    setTimeout(() => {
      setInvitationOpened(true);
    }, 800);
  };

  const handleNavigateToItinerary = () => {
    router.push('/itinerary');
  };

  // Mobile card swipe gesture - active only on card elements
  const bind = useGesture(
    {
      onDrag: ({ movement: [mx], down, velocity: [vx], direction: [dx], event }) => {
        // Only prevent default if event is cancelable
        if (event?.cancelable) {
          try {
            event.preventDefault();
          } catch (e) {
            // Ignore
          }
        }
        
        const trigger = Math.abs(mx) > 100 || Math.abs(vx) > 0.5;
        
        if (!down && trigger) {
          // Swipe right - show second card
          if (dx > 0 && currentCard === 'first') {
            setCurrentCard('second');
            api.start({ x: 0, y: 0 });
          }
          // Swipe left - show first card
          else if (dx < 0 && currentCard === 'second') {
            setCurrentCard('first');
            api.start({ x: 0, y: 0 });
          } else {
            api.start({ x: 0, y: 0 });
          }
        } else {
          api.start({ x: down ? mx : 0, y: 0, immediate: down });
        }
      },
    },
    {
      drag: {
        filterTaps: true,
        threshold: 10,
        axis: 'x',
        bounds: { left: -400, right: 400 },
        rubberband: true,
      },
    }
  );

  return (
    <main className="relative w-full min-h-screen overflow-hidden">
      {/* Paper background - z-0 */}
      <PaperBackground />
      
      {/* Fluid background - z-5 (behind everything) */}
      {showFluid && (
        <FluidBackground 
          className="opacity-30" 
          variant="home" 
        />
      )}

      {/* Floating particles - z-15 (above fluid, below cards) */}
      {invitationOpened && (
        <div style={{ zIndex: 15 }}>
          <FloatingParticles />
        </div>
      )}

      {/* Loading animation - z-100 */}
      <AnimatePresence mode="wait">
        {isLoading && <LoadingAnimation key="loading" />}
      </AnimatePresence>

      {/* Logo hero - z-20 */}
      {!isLoading && !invitationOpened && (
        <motion.div
          style={{ zIndex: 20 }}
          animate={logoTransitioning ? {
            y: -200,
            scale: 0.3,
            opacity: 0,
          } : {}}
          transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
        >
          <InvitationHero onOpen={handleOpenInvitation} />
        </motion.div>
      )}

      {/* Invitation cards - z-30 (highest, always above fluid) */}
      <AnimatePresence>
        {invitationOpened && (
          <motion.div
            style={{ zIndex: 30 }}
            className="fixed inset-0 flex flex-col items-center justify-center px-4 md:px-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Desktop: Side-by-side cards */}
            <div className="hidden md:flex gap-0 max-w-[90vw] max-h-[75vh] relative">
              <motion.div
                className="relative shadow-2xl"
                initial={{ x: -100, opacity: 0, rotateY: -10 }}
                animate={{ x: 0, opacity: 1, rotateY: 0 }}
                transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
                style={{ transformStyle: 'preserve-3d' }}
              >
                <div className="relative w-auto h-[75vh] max-w-[43vw]">
                  <Image
                    src="/images/couple-pose.jpeg"
                    alt="Wedding Couple"
                    width={800}
                    height={1200}
                    className="h-full w-auto object-contain rounded-lg"
                    priority
                  />
                  <div 
                    className="absolute inset-0 rounded-lg pointer-events-none"
                    style={{
                      border: '2px solid rgba(212, 165, 116, 0.4)',
                      boxShadow: 'inset 0 0 60px rgba(212, 165, 116, 0.15), 0 0 20px rgba(212, 165, 116, 0.2)',
                    }}
                  />
                </div>
              </motion.div>

              <motion.div
                className="relative shadow-2xl"
                initial={{ x: 100, opacity: 0, rotateY: 10 }}
                animate={{ x: 0, opacity: 1, rotateY: 0 }}
                transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1], delay: 0.1 }}
                style={{ transformStyle: 'preserve-3d' }}
              >
                <div className="relative w-auto h-[75vh] max-w-[43vw]">
                  <Image
                    src="/images/invitation-body.jpeg"
                    alt="Invitation Details"
                    width={800}
                    height={1200}
                    className="h-full w-auto object-contain rounded-lg"
                    priority
                  />
                  <div 
                    className="absolute inset-0 rounded-lg pointer-events-none"
                    style={{
                      border: '2px solid rgba(212, 165, 116, 0.4)',
                      boxShadow: 'inset 0 0 60px rgba(212, 165, 116, 0.15), 0 0 20px rgba(212, 165, 116, 0.2)',
                    }}
                  />
                </div>
              </motion.div>
            </div>

            {/* Mobile: Swipeable stacked cards - bidirectional */}
            <div className="md:hidden relative w-full max-w-sm h-[70vh] flex items-center justify-center">
              {/* Second card */}
              <animated.div
                {...(currentCard === 'second' ? bind() : {})}
                className="absolute w-[85%] shadow-2xl rounded-xl overflow-hidden"
                style={{
                  x: currentCard === 'second' ? x : 0,
                  y: currentCard === 'second' ? y : 0,
                  zIndex: currentCard === 'second' ? 2 : 1,
                  touchAction: 'pan-y',
                }}
              >
                <motion.div
                  animate={{
                    y: currentCard === 'first' ? 30 : 0,
                    scale: currentCard === 'first' ? 0.9 : 1,
                    opacity: currentCard === 'first' ? 0.6 : 1,
                  }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                >
                  <div className="relative w-full aspect-[3/4]">
                    <Image
                      src="/images/invitation-body.jpeg"
                      alt="Invitation Details"
                      fill
                      className="object-cover"
                      priority
                    />
                  </div>
                  
                  {currentCard === 'second' && (
                    <motion.div
                      className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/90 text-sm"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <div className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2">
                        <motion.span
                          animate={{ x: [0, -6, 0] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          ←
                        </motion.span>
                        <span className="font-medium">Swipe to go back</span>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              </animated.div>

              {/* First card - draggable */}
              <animated.div
                {...(currentCard === 'first' ? bind() : {})}
                className="absolute w-[85%] shadow-2xl rounded-xl overflow-hidden"
                style={{
                  x: currentCard === 'first' ? x : 0,
                  y: currentCard === 'first' ? y : 0,
                  zIndex: currentCard === 'first' ? 2 : 1,
                  touchAction: 'pan-y',
                }}
              >
                <div className="relative w-full aspect-[3/4]">
                  <Image
                    src="/images/couple-pose.jpeg"
                    alt="Wedding Couple"
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
                
                {currentCard === 'first' && (
                  <motion.div
                    className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/90 text-sm"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1 }}
                  >
                    <div className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2">
                      <span className="font-medium">Swipe to see more</span>
                      <motion.span
                        animate={{ x: [0, 6, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        →
                      </motion.span>
                    </div>
                  </motion.div>
                )}
              </animated.div>
            </div>

            {/* Forward button - z-40 (above cards) */}
            <motion.div
              style={{ zIndex: 40 }}
              className="journey-nav absolute bottom-6 left-1/2 -translate-x-1/2"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2, duration: 0.6 }}
            >
              <button
                onClick={handleNavigateToItinerary}
                className="journey-nav-primary"
              >
                <span><small>Continue the celebration</small>View the journey</span>
                <ArrowRight size={18} aria-hidden="true" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
