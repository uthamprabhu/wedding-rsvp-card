'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import confetti from 'canvas-confetti';
import { useEffect } from 'react';

interface FormData {
  name: string;
  phone: string;
  email: string;
  guestCount: number;
  accommodation: 'yes' | 'no' | '';
  dietaryRestrictions: string;
  message: string;
}

interface ConfirmationPageProps {
  data: FormData;
  onDownload: () => void;
}

export default function ConfirmationPage({
  data,
  onDownload,
}: ConfirmationPageProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  // Fire confetti on mount
  useEffect(() => {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval: NodeJS.Timeout = setInterval(function () {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ['#D4A574', '#C9A55C', '#FFD700', '#FFF8F0'],
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ['#D4A574', '#C9A55C', '#FFD700', '#FFF8F0'],
      });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  const handleDownload = () => {
    setIsDownloading(true);
    onDownload();
    setTimeout(() => setIsDownloading(false), 2000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-20 px-4">
      <motion.div
        className="max-w-3xl w-full"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, type: 'spring' }}
      >
        {/* Success icon with animation */}
        <motion.div
          className="text-center mb-8"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.8, type: 'spring', bounce: 0.5 }}
        >
          <motion.div
            className="inline-block text-9xl"
            animate={{
              rotate: [0, 10, -10, 10, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 2 }}
          >
            🎊
          </motion.div>
        </motion.div>

        {/* Main message */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <h2 className="text-5xl md:text-6xl font-serif text-[#D4A574] mb-4">
            You're All Set!
          </h2>
          <p className="text-xl text-[#8B7355] mb-2">
            We can't wait to celebrate with you, {data.name.split(' ')[0]}!
          </p>
          <p className="text-[#8B7355]/70">
            A confirmation has been sent to {data.email}
          </p>
        </motion.div>

        {/* Confirmation card */}
        <motion.div
          className="bg-gradient-to-br from-white/70 to-white/50 backdrop-blur-xl rounded-3xl shadow-2xl border border-[#D4A574]/30 p-8 md:p-12 mb-8"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          <h3 className="text-2xl font-serif text-[#D4A574] mb-6 text-center">
            Your RSVP Details
          </h3>

          <div className="space-y-6">
            {/* Name */}
            <motion.div
              className="flex items-start gap-4 pb-4 border-b border-[#D4A574]/20"
              whileHover={{ x: 5 }}
            >
              <div className="text-3xl">👤</div>
              <div className="flex-1">
                <p className="text-sm text-[#8B7355]/60 mb-1">Guest Name</p>
                <p className="text-lg font-semibold text-[#8B7355]">{data.name}</p>
              </div>
            </motion.div>

            {/* Contact */}
            <motion.div
              className="flex items-start gap-4 pb-4 border-b border-[#D4A574]/20"
              whileHover={{ x: 5 }}
            >
              <div className="text-3xl">📞</div>
              <div className="flex-1">
                <p className="text-sm text-[#8B7355]/60 mb-1">Contact</p>
                <p className="text-lg text-[#8B7355]">{data.phone}</p>
                <p className="text-sm text-[#8B7355]/70">{data.email}</p>
              </div>
            </motion.div>

            {/* Guest count */}
            <motion.div
              className="flex items-start gap-4 pb-4 border-b border-[#D4A574]/20"
              whileHover={{ x: 5 }}
            >
              <div className="text-3xl">👥</div>
              <div className="flex-1">
                <p className="text-sm text-[#8B7355]/60 mb-1">Number of Guests</p>
                <p className="text-lg font-semibold text-[#8B7355]">
                  {data.guestCount} {data.guestCount === 1 ? 'guest' : 'guests'}
                </p>
              </div>
            </motion.div>

            {/* Accommodation */}
            <motion.div
              className="flex items-start gap-4 pb-4 border-b border-[#D4A574]/20"
              whileHover={{ x: 5 }}
            >
              <div className="text-3xl">🏨</div>
              <div className="flex-1">
                <p className="text-sm text-[#8B7355]/60 mb-1">Accommodation</p>
                <p className="text-lg text-[#8B7355]">
                  {data.accommodation === 'yes' ? '✓ Assistance needed' : '✗ Not required'}
                </p>
              </div>
            </motion.div>

            {/* Dietary restrictions */}
            {data.dietaryRestrictions && (
              <motion.div
                className="flex items-start gap-4 pb-4 border-b border-[#D4A574]/20"
                whileHover={{ x: 5 }}
              >
                <div className="text-3xl">🍽️</div>
                <div className="flex-1">
                  <p className="text-sm text-[#8B7355]/60 mb-1">
                    Dietary Restrictions
                  </p>
                  <p className="text-lg text-[#8B7355]">
                    {data.dietaryRestrictions}
                  </p>
                </div>
              </motion.div>
            )}

            {/* Message */}
            {data.message && (
              <motion.div
                className="flex items-start gap-4"
                whileHover={{ x: 5 }}
              >
                <div className="text-3xl">💝</div>
                <div className="flex-1">
                  <p className="text-sm text-[#8B7355]/60 mb-1">Your Message</p>
                  <p className="text-lg text-[#8B7355] italic">
                    "{data.message}"
                  </p>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Download button */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
        >
          <motion.button
            className="inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-[#D4A574] to-[#C9A55C] text-white rounded-full font-semibold text-lg shadow-xl"
            whileHover={{
              scale: 1.05,
              boxShadow: '0 20px 40px rgba(212, 165, 116, 0.4)',
            }}
            whileTap={{ scale: 0.95 }}
            onClick={handleDownload}
            disabled={isDownloading}
          >
            {isDownloading ? (
              <>
                <motion.div
                  className="w-6 h-6 border-3 border-white border-t-transparent rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
                Preparing...
              </>
            ) : (
              <>
                <span className="text-2xl">📥</span>
                Download Your Invitation Card
              </>
            )}
          </motion.button>
          <p className="text-sm text-[#8B7355]/60 mt-4">
            Save a beautiful keepsake with your RSVP details
          </p>
        </motion.div>

        {/* Decorative elements */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-6xl opacity-20"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -30, 0],
                rotate: [0, 10, -10, 0],
                opacity: [0.1, 0.3, 0.1],
              }}
              transition={{
                duration: 4 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            >
              {['💍', '❤️', '🌙', '⭐', '🎁', '💐'][i]}
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
