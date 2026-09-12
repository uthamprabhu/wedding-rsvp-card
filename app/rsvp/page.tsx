'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PaperBackground from '@/components/PaperBackground';
import TactileButton from '@/components/TactileButton';
import PremiumInput from '@/components/PremiumInput';
import PremiumSwitch from '@/components/PremiumSwitch';
import GuestCounter from '@/components/GuestCounter';
import ConfirmationPage from '@/components/ConfirmationPage';
import { ChevronLeft, Check } from 'lucide-react';
import dynamic from 'next/dynamic';

const FluidBackground = dynamic(() => import('@/components/FluidBackground'), {
  ssr: false,
});

interface FormData {
  name: string;
  phone: string;
  email: string;
  guestCount: number;
  accommodation: boolean;
  dietaryRestrictions: string;
  message: string;
}

export default function RSVPPage() {
  const router = useRouter();
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    phone: '',
    email: '',
    guestCount: 1,
    accommodation: false,
    dietaryRestrictions: '',
    message: '',
  });

  const canSubmit = formData.name && formData.phone && formData.email;

  const handleSubmit = () => {
    if (!canSubmit) return;
    setShowConfirmation(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDownload = async () => {
    // Download logic from existing ConfirmationPage
    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

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
            <strong style="color: #8B7355;">Accommodation:</strong> <span style="color: #8B7355;">${formData.accommodation ? 'Required' : 'Not needed'}</span>
          </div>
          ${formData.dietaryRestrictions ? `<div style="margin-bottom: 15px;"><strong style="color: #8B7355;">Dietary:</strong> <span style="color: #8B7355;">${formData.dietaryRestrictions}</span></div>` : ''}
          ${formData.message ? `<div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #D4A574;"><em style="color: #8B7355;">"${formData.message}"</em></div>` : ''}
        </div>
      `;

      document.body.appendChild(downloadContainer);
      await new Promise((resolve) => setTimeout(resolve, 500));

      const canvas = await html2canvas(downloadContainer, {
        scale: 2,
        backgroundColor: '#FFF8F0',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width / 2, canvas.height / 2],
      });

      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
      pdf.save(`wedding-invitation-${formData.name.replace(/\s+/g, '-')}.pdf`);

      document.body.removeChild(downloadContainer);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  if (showConfirmation) {
    return (
      <main className="relative w-full min-h-screen overflow-x-hidden overflow-y-auto">
        <PaperBackground />
        <FluidBackground className="opacity-25" variant="rsvp" />
        
        <motion.div
          style={{ zIndex: 20 }}
          className="relative"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
        >
          <ConfirmationPage 
            data={{
              ...formData,
              accommodation: formData.accommodation ? 'yes' : 'no',
            }} 
            onDownload={handleDownload} 
          />
        </motion.div>
      </main>
    );
  }

  return (
    <main className="relative w-full min-h-screen overflow-x-hidden overflow-y-auto pb-32">
      {/* Paper background - z-0 */}
      <PaperBackground />
      
      {/* Fluid background - z-5 */}
      <FluidBackground className="opacity-25" variant="rsvp" />

      {/* Content - z-20 */}
      <motion.div
        style={{ zIndex: 20 }}
        className="relative max-w-2xl mx-auto px-4 py-20"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h1 className="text-5xl md:text-6xl font-serif text-[#D4A574] mb-4">
            Join Our Celebration
          </h1>
          <p className="text-lg text-[#8B7355]">
            We can't wait to celebrate with you
          </p>
        </motion.div>

        {/* Form sections with stagger */}
        <div className="space-y-8">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <PremiumInput
              label="Your Full Name"
              value={formData.name}
              onChange={(value) => setFormData({ ...formData, name: value })}
              placeholder="John & Jane Doe"
              icon="✍️"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="grid md:grid-cols-2 gap-4"
          >
            <PremiumInput
              label="Phone Number"
              value={formData.phone}
              onChange={(value) => setFormData({ ...formData, phone: value })}
              placeholder="+1 (555) 000-0000"
              type="tel"
              icon="📱"
            />
            <PremiumInput
              label="Email Address"
              value={formData.email}
              onChange={(value) => setFormData({ ...formData, email: value })}
              placeholder="you@example.com"
              type="email"
              icon="✉️"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
          >
            <GuestCounter
              label="Number of Guests"
              value={formData.guestCount}
              onChange={(value) => setFormData({ ...formData, guestCount: value })}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <PremiumSwitch
              label="Need Accommodation?"
              description="We can help arrange your stay"
              checked={formData.accommodation}
              onCheckedChange={(checked) => setFormData({ ...formData, accommodation: checked })}
              icon="🏨"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
          >
            <label className="block text-sm font-medium text-[#8B7355] mb-2 ml-1">
              Dietary Restrictions <span className="text-[#8B7355]/40">(optional)</span>
            </label>
            <textarea
              value={formData.dietaryRestrictions}
              onChange={(e) => setFormData({ ...formData, dietaryRestrictions: e.target.value })}
              placeholder="Vegetarian, vegan, allergies..."
              rows={3}
              className="w-full px-4 py-4 rounded-2xl border-2 border-[#D4A574]/30 bg-white/60 backdrop-blur-sm text-[#8B7355] placeholder:text-[#8B7355]/40 focus:outline-none focus:border-[#D4A574] focus:bg-white/80 transition-all font-medium resize-none"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 }}
          >
            <label className="block text-sm font-medium text-[#8B7355] mb-2 ml-1">
              A Message for Us <span className="text-[#8B7355]/40">(optional)</span>
            </label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Share your excitement..."
              rows={4}
              className="w-full px-4 py-4 rounded-2xl border-2 border-[#D4A574]/30 bg-white/60 backdrop-blur-sm text-[#8B7355] placeholder:text-[#8B7355]/40 focus:outline-none focus:border-[#D4A574] focus:bg-white/80 transition-all font-medium resize-none"
            />
          </motion.div>
        </div>
      </motion.div>

      {/* Navigation buttons - z-40 */}
      <motion.div
        style={{ zIndex: 40 }}
        className="fixed bottom-8 left-1/2 -translate-x-1/2 flex gap-4"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
      >
        <TactileButton
          onClick={() => router.back()}
          icon={ChevronLeft}
          variant="secondary"
          size="md"
        >
          Back to Journey
        </TactileButton>

        <TactileButton
          onClick={handleSubmit}
          icon={Check}
          variant="primary"
          size="md"
          disabled={!canSubmit}
        >
          Confirm & Celebrate
        </TactileButton>
      </motion.div>
    </main>
  );
}
