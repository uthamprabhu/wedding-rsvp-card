'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

const menuItems = [
  { label: 'Home', path: '/', icon: '🏠', description: 'View invitation' },
  { label: 'Itinerary', path: '/itinerary', icon: '📅', description: 'Event timeline' },
  { label: 'RSVP', path: '/rsvp', icon: '✉️', description: 'Confirm attendance' },
];

export default function FloatingNavbar() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const handleNavigate = (path: string) => {
    if (pathname !== path) {
      router.push(path);
    }
    setIsOpen(false);
  };

  return (
    <>
      {/* Hamburger Button - Bottom Right */}
      <motion.button
        className="fixed bottom-8 right-8 z-50 w-16 h-16 rounded-full bg-gradient-to-br from-[#D4A574] to-[#C9A55C] shadow-2xl flex items-center justify-center"
        whileHover={{ scale: 1.1, boxShadow: '0 20px 40px rgba(212, 165, 116, 0.5)' }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1, duration: 0.5, type: 'spring', bounce: 0.5 }}
      >
        <motion.div
          className="relative w-6 h-6"
          animate={isOpen ? 'open' : 'closed'}
        >
          {/* Top line */}
          <motion.span
            className="absolute left-0 w-6 h-0.5 bg-white rounded-full"
            variants={{
              closed: { rotate: 0, y: 0 },
              open: { rotate: 45, y: 8 },
            }}
            transition={{ duration: 0.3 }}
            style={{ top: '4px' }}
          />
          {/* Middle line */}
          <motion.span
            className="absolute left-0 w-6 h-0.5 bg-white rounded-full"
            variants={{
              closed: { opacity: 1 },
              open: { opacity: 0 },
            }}
            transition={{ duration: 0.3 }}
            style={{ top: '11px' }}
          />
          {/* Bottom line */}
          <motion.span
            className="absolute left-0 w-6 h-0.5 bg-white rounded-full"
            variants={{
              closed: { rotate: 0, y: 0 },
              open: { rotate: -45, y: -8 },
            }}
            transition={{ duration: 0.3 }}
            style={{ top: '18px' }}
          />
        </motion.div>
      </motion.button>

      {/* Tooltip hint when closed */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            className="fixed bottom-8 right-28 z-40 pointer-events-none"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ delay: 2, duration: 0.5 }}
          >
            <div className="bg-[#D4A574] text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg whitespace-nowrap">
              Explore More
              <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-l-8 border-l-[#D4A574]" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Menu Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => setIsOpen(false)}
            />

            {/* Menu Content */}
            <motion.div
              className="fixed bottom-28 right-8 z-50 w-80 max-w-[calc(100vw-4rem)]"
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              transition={{ duration: 0.4, type: 'spring', bounce: 0.3 }}
            >
              <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-[#D4A574]/30 p-6 overflow-hidden">
                {/* Header */}
                <motion.div
                  className="text-center mb-6 pb-4 border-b border-[#D4A574]/20"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <h3 className="text-2xl font-serif text-[#D4A574] mb-1">Navigation</h3>
                  <p className="text-sm text-[#8B7355]/70">Where would you like to go?</p>
                </motion.div>

                {/* Menu Items */}
                <div className="space-y-3">
                  {menuItems.map((item, index) => {
                    const isActive = pathname === item.path;
                    return (
                      <motion.button
                        key={item.path}
                        className={`w-full text-left p-4 rounded-2xl transition-all ${
                          isActive
                            ? 'bg-gradient-to-r from-[#D4A574] to-[#C9A55C] text-white shadow-lg'
                            : 'bg-[#FFF8F0]/50 hover:bg-[#FFF8F0] text-[#8B7355]'
                        }`}
                        onClick={() => handleNavigate(item.path)}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.15 + index * 0.05 }}
                        whileHover={!isActive ? { scale: 1.03, x: 5 } : {}}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-center gap-4">
                          <div className="text-3xl">{item.icon}</div>
                          <div className="flex-1">
                            <div className="font-semibold text-lg mb-0.5">
                              {item.label}
                            </div>
                            <div
                              className={`text-xs ${
                                isActive ? 'text-white/80' : 'text-[#8B7355]/60'
                              }`}
                            >
                              {item.description}
                            </div>
                          </div>
                          {isActive && (
                            <motion.div
                              className="w-2 h-2 rounded-full bg-white"
                              layoutId="activeIndicator"
                              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            />
                          )}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>

                {/* Decorative element */}
                <motion.div
                  className="mt-6 pt-4 border-t border-[#D4A574]/20 text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <p className="text-xs text-[#8B7355]/50 italic">
                    Tap outside to close
                  </p>
                </motion.div>
              </div>

              {/* Decorative pointer */}
              <div className="absolute bottom-0 right-8 translate-y-3 w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-t-8 border-t-white/90" />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
