'use client';

import { motion, useMotionValue, useTransform, PanInfo, useScroll } from 'framer-motion';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import InteractiveItinerary from './InteractiveItinerary';
import RSVPForm from './RSVPForm';
import ConfirmationPage from './ConfirmationPage';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface InvitationCardProps {
  onClose?: () => void;
}

interface FormData {
  name: string;
  phone: string;
  email: string;
  guestCount: number;
  accommodation: 'yes' | 'no' | '';
  dietaryRestrictions: string;
  message: string;
}

export default function InvitationCard({ onClose }: InvitationCardProps) {
  const [currentCard, setCurrentCard] = useState<'first' | 'second'>('first');
  const [isMobile, setIsMobile] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [formData, setFormData] = useState<FormData | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Track scroll position for cards disappearing animation
  const { scrollY } = useScroll();
  const cardsY = useTransform(scrollY, [0, 300], [0, -400]);
  const cardsOpacity = useTransform(scrollY, [0, 200], [1, 0]);

  // Detect mobile on mount
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Motion values for drag interaction
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateZ = useTransform(x, [-200, 0, 200], [-15, 0, 15]);
  const scale = useTransform(x, [-200, 0, 200], [0.95, 1, 0.95]);

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 150;
    const velocity = info.velocity.x;

    // If dragged far enough or fast enough, switch cards
    if (Math.abs(info.offset.x) > threshold || Math.abs(velocity) > 500) {
      if (currentCard === 'first') {
        setCurrentCard('second');
      } else {
        setCurrentCard('first');
      }
    }

    // Reset position
    x.set(0);
    y.set(0);
  };

  const handleRSVPSubmit = (data: FormData) => {
    setFormData(data);
    setShowConfirmation(true);
    // Scroll to confirmation smoothly
    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }, 100);
  };

  const handleDownloadCard = async () => {
    if (!formData) return;

    try {
      // Create a download container
      const downloadContainer = document.createElement('div');
      downloadContainer.style.position = 'absolute';
      downloadContainer.style.left = '-9999px';
      downloadContainer.style.width = '800px';
      downloadContainer.style.background = '#FFF8F0';
      downloadContainer.style.padding = '40px';
      downloadContainer.style.fontFamily = 'serif';

      downloadContainer.innerHTML = `
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #D4A574; font-size: 48px; margin-bottom: 10px;">Wedding Invitation</h1>
          <p style="color: #8B7355; font-size: 18px;">You're invited to celebrate with us</p>
        </div>
        <div style="display: flex; gap: 20px; justify-content: center; margin-bottom: 40px;">
          <img src="/images/couple-pose.jpeg" style="width: 350px; height: auto; border-radius: 10px;" />
          <img src="/images/invitation-body.jpeg" style="width: 350px; height: auto; border-radius: 10px;" />
        </div>
        <div style="background: white; padding: 30px; border-radius: 20px; border: 2px solid #D4A574;">
          <h2 style="color: #D4A574; font-size: 32px; text-align: center; margin-bottom: 20px;">RSVP Confirmation</h2>
          <div style="margin-bottom: 15px;">
            <strong style="color: #8B7355;">Guest Name:</strong> <span style="color: #8B7355;">${formData.name}</span>
          </div>
          <div style="margin-bottom: 15px;">
            <strong style="color: #8B7355;">Contact:</strong> <span style="color: #8B7355;">${formData.phone} | ${formData.email}</span>
          </div>
          <div style="margin-bottom: 15px;">
            <strong style="color: #8B7355;">Number of Guests:</strong> <span style="color: #8B7355;">${formData.guestCount}</span>
          </div>
          <div style="margin-bottom: 15px;">
            <strong style="color: #8B7355;">Accommodation:</strong> <span style="color: #8B7355;">${formData.accommodation === 'yes' ? 'Required' : 'Not needed'}</span>
          </div>
          ${formData.dietaryRestrictions ? `<div style="margin-bottom: 15px;"><strong style="color: #8B7355;">Dietary:</strong> <span style="color: #8B7355;">${formData.dietaryRestrictions}</span></div>` : ''}
          ${formData.message ? `<div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #D4A574;"><em style="color: #8B7355;">"${formData.message}"</em></div>` : ''}
        </div>
      `;

      document.body.appendChild(downloadContainer);

      // Wait for images to load
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Generate canvas
      const canvas = await html2canvas(downloadContainer, {
        scale: 2,
        backgroundColor: '#FFF8F0',
      });

      // Create PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width / 2, canvas.height / 2],
      });

      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
      pdf.save(`wedding-invitation-${formData.name.replace(/\s+/g, '-')}.pdf`);

      // Clean up
      document.body.removeChild(downloadContainer);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('There was an error generating your invitation card. Please try again.');
    }
  };

  return (
    <div ref={containerRef} className="w-full">
      {/* Invitation Cards Section - Scrolls away */}
      <motion.div
        className="min-h-screen flex items-center justify-center z-20 px-4 md:px-8 lg:px-16"
        style={{ y: cardsY, opacity: cardsOpacity }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
      {/* Desktop/Tablet: Side-by-side */}
      <div className="hidden md:flex gap-0 max-w-[90vw] max-h-[85vh] relative">
        {/* Left card - Couple Pose */}
        <motion.div
          className="relative shadow-2xl"
          initial={{ x: -100, opacity: 0, rotateY: -10 }}
          animate={{ x: 0, opacity: 1, rotateY: 0 }}
          transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
          style={{ transformStyle: 'preserve-3d' }}
        >
          <div className="relative w-auto h-[85vh] max-w-[45vw]">
            <Image
              src="/images/couple-pose.jpeg"
              alt="Wedding Couple"
              width={800}
              height={1200}
              className="h-full w-auto object-contain"
              priority
            />
            
            {/* Ring/Border effect - stays within image */}
            <div 
              className="absolute inset-0 pointer-events-none"
              style={{
                border: '2px solid rgba(212, 165, 116, 0.4)',
                boxShadow: `
                  inset 0 0 60px rgba(212, 165, 116, 0.15),
                  inset 0 0 30px rgba(212, 165, 116, 0.1),
                  0 0 20px rgba(212, 165, 116, 0.2)
                `,
              }}
            >
              {/* Inner decorative ring */}
              <div 
                className="absolute inset-4 border border-[#D4A574]/30"
                style={{
                  boxShadow: 'inset 0 0 20px rgba(212, 165, 116, 0.1)',
                }}
              />
            </div>
          </div>
        </motion.div>

        {/* Right card - Invitation Body */}
        <motion.div
          className="relative shadow-2xl"
          initial={{ x: 100, opacity: 0, rotateY: 10 }}
          animate={{ x: 0, opacity: 1, rotateY: 0 }}
          transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1], delay: 0.1 }}
          style={{ transformStyle: 'preserve-3d' }}
        >
          <div className="relative w-auto h-[85vh] max-w-[45vw]">
            <Image
              src="/images/invitation-body.jpeg"
              alt="Invitation Details"
              width={800}
              height={1200}
              className="h-full w-auto object-contain"
              priority
            />
            
            {/* Ring/Border effect - stays within image */}
            <div 
              className="absolute inset-0 pointer-events-none"
              style={{
                border: '2px solid rgba(212, 165, 116, 0.4)',
                boxShadow: `
                  inset 0 0 60px rgba(212, 165, 116, 0.15),
                  inset 0 0 30px rgba(212, 165, 116, 0.1),
                  0 0 20px rgba(212, 165, 116, 0.2)
                `,
              }}
            >
              {/* Inner decorative ring */}
              <div 
                className="absolute inset-4 border border-[#D4A574]/30"
                style={{
                  boxShadow: 'inset 0 0 20px rgba(212, 165, 116, 0.1)',
                }}
              />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Mobile: Stacked Cards */}
      <div className="md:hidden relative w-full max-w-md h-[80vh] flex items-center justify-center">
        {/* Second card - Behind, slightly visible */}
        <motion.div
          className="absolute w-[90%] max-w-sm shadow-2xl rounded-lg overflow-hidden"
          style={{
            zIndex: currentCard === 'second' ? 20 : 10,
          }}
          animate={{
            y: currentCard === 'first' ? 40 : 0,
            scale: currentCard === 'first' ? 0.95 : 1,
            opacity: currentCard === 'first' ? 0.7 : 1,
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
        </motion.div>

        {/* First card - Draggable on top */}
        {currentCard === 'first' && (
          <motion.div
            className="absolute w-[90%] max-w-sm shadow-2xl rounded-lg overflow-hidden cursor-grab active:cursor-grabbing"
            style={{
              x,
              y,
              rotateZ,
              scale,
              zIndex: 20,
            }}
            drag
            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
            dragElastic={0.1}
            onDragEnd={handleDragEnd}
            initial={{ x: 0, opacity: 1 }}
            exit={{ x: '100vw', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
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

            {/* Drag hint indicator */}
            <motion.div
              className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-sm tracking-widest uppercase"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.8 }}
            >
              <div className="flex items-center gap-2 bg-black/30 backdrop-blur-sm px-4 py-2 rounded-full">
                <span>Swipe to reveal</span>
                <motion.span
                  animate={{ x: [0, 10, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                >
                  →
                </motion.span>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Tap to go back hint for second card */}
        {currentCard === 'second' && (
          <motion.button
            className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/70 text-sm tracking-widest uppercase bg-black/30 backdrop-blur-sm px-6 py-3 rounded-full z-30"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => setCurrentCard('first')}
          >
            ← Back to couple
          </motion.button>
        )}
      </div>

      {/* Fun Scroll Prompt */}
      <motion.div 
        className="absolute bottom-12 left-1/2 -translate-x-1/2 z-30 text-center"
        style={{ opacity: cardsOpacity }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5, duration: 0.8 }}
      >
        <div className="bg-gradient-to-r from-[#D4A574]/20 to-[#C9A55C]/20 backdrop-blur-md border border-[#D4A574]/30 rounded-full px-8 py-4 shadow-lg">
          <p className="text-[#D4A574] font-serif text-lg mb-1">
            ✨ There's More Magic Below ✨
          </p>
          <p className="text-[#B8925A] text-sm tracking-wider">
            Scroll down for the journey ahead
          </p>
          <motion.div
            className="mt-2 text-2xl"
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            ↓
          </motion.div>
        </div>
      </motion.div>
    </motion.div>

      {/* Rest of content - visible after scroll */}
      <div className="relative z-10">
        {/* Itinerary section */}
        <div className="bg-gradient-to-b from-transparent via-[#FFF8F0]/30 to-transparent">
          <InteractiveItinerary />
        </div>

        {/* RSVP form section */}
        {!showConfirmation ? (
          <div className="bg-gradient-to-b from-transparent to-[#FFF8F0]/50">
            <RSVPForm onSubmit={handleRSVPSubmit} />
          </div>
        ) : (
          <div className="bg-gradient-to-b from-[#FFF8F0]/50 to-[#FFF8F0]/80">
            <ConfirmationPage data={formData!} onDownload={handleDownloadCard} />
          </div>
        )}
      </div>
    </div>
  );
}
