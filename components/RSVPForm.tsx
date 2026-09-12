'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

interface FormData {
  name: string;
  phone: string;
  email: string;
  guestCount: number;
  accommodation: 'yes' | 'no' | '';
  dietaryRestrictions: string;
  message: string;
}

interface RSVPFormProps {
  onSubmit: (data: FormData) => void;
}

const steps = [
  {
    id: 'welcome',
    question: "Let's celebrate together!",
    subtitle: 'Help us prepare for your arrival',
    icon: '💌',
  },
  {
    id: 'name',
    question: "What's your name?",
    subtitle: 'First and last name please',
    icon: '✍️',
  },
  {
    id: 'contact',
    question: 'How can we reach you?',
    subtitle: 'Phone number and email',
    icon: '📱',
  },
  {
    id: 'guests',
    question: 'How many guests?',
    subtitle: 'Including yourself',
    icon: '👥',
  },
  {
    id: 'accommodation',
    question: 'Need accommodation?',
    subtitle: 'We can help arrange your stay',
    icon: '🏨',
  },
  {
    id: 'dietary',
    question: 'Any dietary restrictions?',
    subtitle: 'Let us know so we can cater to your needs',
    icon: '🍽️',
  },
  {
    id: 'message',
    question: 'Leave us a message?',
    subtitle: 'Share your excitement with us! (optional)',
    icon: '💝',
  },
];

export default function RSVPForm({ onSubmit }: RSVPFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    phone: '',
    email: '',
    guestCount: 1,
    accommodation: '',
    dietaryRestrictions: '',
    message: '',
  });

  const progress = ((currentStep + 1) / steps.length) * 100;

  const goNext = () => {
    if (currentStep < steps.length - 1) {
      setDirection(1);
      setCurrentStep(currentStep + 1);
    } else {
      onSubmit(formData);
    }
  };

  const goBack = () => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = () => {
    const step = steps[currentStep].id;
    if (step === 'welcome') return true;
    if (step === 'name') return formData.name.trim().length > 0;
    if (step === 'contact')
      return formData.phone.trim().length > 0 && formData.email.trim().length > 0;
    if (step === 'guests') return formData.guestCount > 0;
    if (step === 'accommodation') return formData.accommodation !== '';
    if (step === 'dietary') return true; // Optional
    if (step === 'message') return true; // Optional
    return false;
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
      scale: 0.8,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0,
      scale: 0.8,
    }),
  };

  const renderStepContent = () => {
    const step = steps[currentStep];

    switch (step.id) {
      case 'welcome':
        return (
          <motion.div
            className="text-center space-y-6"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              className="text-8xl mb-6"
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 5, -5, 0],
              }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
            >
              {step.icon}
            </motion.div>
            <h3 className="text-3xl font-serif text-[#D4A574]">
              {step.question}
            </h3>
            <p className="text-[#8B7355] text-lg">{step.subtitle}</p>
            <motion.button
              className="mt-8 px-12 py-4 bg-gradient-to-r from-[#D4A574] to-[#C9A55C] text-white rounded-full font-semibold text-lg shadow-lg"
              whileHover={{ scale: 1.05, boxShadow: '0 10px 30px rgba(212, 165, 116, 0.4)' }}
              whileTap={{ scale: 0.95 }}
              onClick={goNext}
            >
              Let's Begin ✨
            </motion.button>
          </motion.div>
        );

      case 'name':
        return (
          <div className="space-y-6 w-full max-w-md">
            <motion.div className="text-6xl text-center mb-4">
              {step.icon}
            </motion.div>
            <h3 className="text-2xl font-serif text-[#D4A574] text-center">
              {step.question}
            </h3>
            <p className="text-[#8B7355] text-center">{step.subtitle}</p>
            <motion.input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-6 py-4 text-center text-2xl font-serif border-2 border-[#D4A574]/30 rounded-2xl bg-white/50 backdrop-blur-sm focus:border-[#D4A574] focus:outline-none transition-all"
              placeholder="Your full name"
              autoFocus
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              onKeyDown={(e) => e.key === 'Enter' && canProceed() && goNext()}
            />
          </div>
        );

      case 'contact':
        return (
          <div className="space-y-6 w-full max-w-md">
            <motion.div className="text-6xl text-center mb-4">
              {step.icon}
            </motion.div>
            <h3 className="text-2xl font-serif text-[#D4A574] text-center">
              {step.question}
            </h3>
            <p className="text-[#8B7355] text-center">{step.subtitle}</p>
            <div className="space-y-4">
              <motion.input
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="w-full px-6 py-4 text-center text-xl border-2 border-[#D4A574]/30 rounded-2xl bg-white/50 backdrop-blur-sm focus:border-[#D4A574] focus:outline-none transition-all"
                placeholder="Phone number"
                autoFocus
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              />
              <motion.input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full px-6 py-4 text-center text-xl border-2 border-[#D4A574]/30 rounded-2xl bg-white/50 backdrop-blur-sm focus:border-[#D4A574] focus:outline-none transition-all"
                placeholder="Email address"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                onKeyDown={(e) => e.key === 'Enter' && canProceed() && goNext()}
              />
            </div>
          </div>
        );

      case 'guests':
        return (
          <div className="space-y-6 w-full max-w-md">
            <motion.div className="text-6xl text-center mb-4">
              {step.icon}
            </motion.div>
            <h3 className="text-2xl font-serif text-[#D4A574] text-center">
              {step.question}
            </h3>
            <p className="text-[#8B7355] text-center">{step.subtitle}</p>
            <div className="flex items-center justify-center gap-8">
              <motion.button
                className="w-16 h-16 rounded-full bg-[#D4A574]/20 text-[#D4A574] text-3xl font-bold hover:bg-[#D4A574] hover:text-white transition-all"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() =>
                  setFormData({
                    ...formData,
                    guestCount: Math.max(1, formData.guestCount - 1),
                  })
                }
              >
                -
              </motion.button>
              <motion.div
                className="text-6xl font-serif text-[#D4A574] min-w-[100px] text-center"
                key={formData.guestCount}
                initial={{ scale: 1.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                {formData.guestCount}
              </motion.div>
              <motion.button
                className="w-16 h-16 rounded-full bg-[#D4A574]/20 text-[#D4A574] text-3xl font-bold hover:bg-[#D4A574] hover:text-white transition-all"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() =>
                  setFormData({
                    ...formData,
                    guestCount: Math.min(10, formData.guestCount + 1),
                  })
                }
              >
                +
              </motion.button>
            </div>
            <p className="text-center text-sm text-[#8B7355]/60">
              {formData.guestCount === 1 ? 'Just you' : `${formData.guestCount} wonderful souls`}
            </p>
          </div>
        );

      case 'accommodation':
        return (
          <div className="space-y-6 w-full max-w-md">
            <motion.div className="text-6xl text-center mb-4">
              {step.icon}
            </motion.div>
            <h3 className="text-2xl font-serif text-[#D4A574] text-center">
              {step.question}
            </h3>
            <p className="text-[#8B7355] text-center">{step.subtitle}</p>
            <div className="grid grid-cols-2 gap-4">
              <motion.button
                className={`py-8 px-6 rounded-2xl border-2 transition-all ${
                  formData.accommodation === 'yes'
                    ? 'border-[#D4A574] bg-[#D4A574]/10 shadow-lg'
                    : 'border-[#D4A574]/30 bg-white/50'
                }`}
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setFormData({ ...formData, accommodation: 'yes' });
                  setTimeout(goNext, 300);
                }}
              >
                <div className="text-4xl mb-2">🛏️</div>
                <div className="font-semibold text-[#D4A574]">Yes, Please!</div>
              </motion.button>
              <motion.button
                className={`py-8 px-6 rounded-2xl border-2 transition-all ${
                  formData.accommodation === 'no'
                    ? 'border-[#D4A574] bg-[#D4A574]/10 shadow-lg'
                    : 'border-[#D4A574]/30 bg-white/50'
                }`}
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setFormData({ ...formData, accommodation: 'no' });
                  setTimeout(goNext, 300);
                }}
              >
                <div className="text-4xl mb-2">🏡</div>
                <div className="font-semibold text-[#D4A574]">I'm all set</div>
              </motion.button>
            </div>
          </div>
        );

      case 'dietary':
        return (
          <div className="space-y-6 w-full max-w-md">
            <motion.div className="text-6xl text-center mb-4">
              {step.icon}
            </motion.div>
            <h3 className="text-2xl font-serif text-[#D4A574] text-center">
              {step.question}
            </h3>
            <p className="text-[#8B7355] text-center">{step.subtitle}</p>
            <motion.textarea
              value={formData.dietaryRestrictions}
              onChange={(e) =>
                setFormData({ ...formData, dietaryRestrictions: e.target.value })
              }
              className="w-full px-6 py-4 text-center text-lg border-2 border-[#D4A574]/30 rounded-2xl bg-white/50 backdrop-blur-sm focus:border-[#D4A574] focus:outline-none transition-all resize-none"
              placeholder="Vegetarian, vegan, allergies, etc."
              rows={3}
              autoFocus
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            />
            <p className="text-center text-sm text-[#8B7355]/60">
              Leave blank if none
            </p>
          </div>
        );

      case 'message':
        return (
          <div className="space-y-6 w-full max-w-md">
            <motion.div className="text-6xl text-center mb-4">
              {step.icon}
            </motion.div>
            <h3 className="text-2xl font-serif text-[#D4A574] text-center">
              {step.question}
            </h3>
            <p className="text-[#8B7355] text-center">{step.subtitle}</p>
            <motion.textarea
              value={formData.message}
              onChange={(e) =>
                setFormData({ ...formData, message: e.target.value })
              }
              className="w-full px-6 py-4 text-center text-lg border-2 border-[#D4A574]/30 rounded-2xl bg-white/50 backdrop-blur-sm focus:border-[#D4A574] focus:outline-none transition-all resize-none"
              placeholder="Your warm wishes..."
              rows={4}
              autoFocus
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-20 px-4">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-5xl md:text-6xl font-serif text-[#D4A574] mb-4">
            Join Our Celebration
          </h2>
          {currentStep > 0 && (
            <div className="max-w-md mx-auto mt-6">
              {/* Progress bar */}
              <div className="h-2 bg-[#D4A574]/20 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-[#D4A574] to-[#C9A55C]"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>
              <p className="text-sm text-[#8B7355] mt-2">
                Step {currentStep + 1} of {steps.length}
              </p>
            </div>
          )}
        </motion.div>

        {/* Form content with animation */}
        <div className="bg-white/40 backdrop-blur-lg rounded-3xl shadow-2xl border border-[#D4A574]/20 p-8 md:p-12 min-h-[500px] flex items-center justify-center">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentStep}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: 'spring', stiffness: 300, damping: 30 },
                opacity: { duration: 0.3 },
              }}
              className="w-full flex flex-col items-center"
            >
              {renderStepContent()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation buttons */}
        {currentStep > 0 && (
          <div className="flex gap-4 mt-8 justify-center">
            <motion.button
              className="px-8 py-3 border-2 border-[#D4A574] text-[#D4A574] rounded-full font-semibold hover:bg-[#D4A574]/10 transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={goBack}
            >
              ← Back
            </motion.button>
            {steps[currentStep].id !== 'welcome' && (
              <motion.button
                className={`px-8 py-3 rounded-full font-semibold transition-all ${
                  canProceed()
                    ? 'bg-gradient-to-r from-[#D4A574] to-[#C9A55C] text-white shadow-lg'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
                whileHover={canProceed() ? { scale: 1.05 } : {}}
                whileTap={canProceed() ? { scale: 0.95 } : {}}
                onClick={canProceed() ? goNext : undefined}
                disabled={!canProceed()}
              >
                {currentStep === steps.length - 1 ? 'Submit RSVP ✨' : 'Continue →'}
              </motion.button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
