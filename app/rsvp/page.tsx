'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, Minus, Plus, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import PaperBackground from '@/components/PaperBackground';
import ConfirmationPage from '@/components/ConfirmationPage';
import CelestialBackdrop, { AdaptiveLantern } from '@/components/CelestialBackdrop';
import InvitationParticles from '@/components/InvitationParticles';
import { SlideToConfirm } from '@/components/lightswind/slide-to-confirm';
import JourneyPageLoader from '@/components/JourneyPageLoader';

interface FormData {
  name: string;
  phone: string;
  email: string;
  guestCount: number;
  accommodation: 'yes' | 'no' | '';
}

const initialFormData: FormData = {
  name: '', phone: '', email: '', guestCount: 1, accommodation: '',
};

const scrollReveal = {
  hidden: { opacity: 0, y: 26, filter: 'blur(7px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)' },
};

export default function RSVPPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [slideWidth, setSlideWidth] = useState(300);
  const formRef = useRef<HTMLFormElement>(null);
  const confirmationTimer = useRef<number | null>(null);

  useEffect(() => {
    const updateConfirmControl = () => {
      const isPhone = window.innerWidth <= 640;
      setSlideWidth(Math.min(360, Math.max(248, isPhone ? window.innerWidth - 56 : window.innerWidth - 360)));
    };
    updateConfirmControl();
    window.addEventListener('resize', updateConfirmControl);
    return () => {
      window.removeEventListener('resize', updateConfirmControl);
      if (confirmationTimer.current) window.clearTimeout(confirmationTimer.current);
    };
  }, []);

  const updateField = <Key extends keyof FormData>(key: Key, value: FormData[Key]) => {
    setFormData((current) => ({ ...current, [key]: value }));
  };

  const confirmRsvp = () => {
    setSubmitError('');
    const form = formRef.current;
    if (!form?.checkValidity()) {
      form?.reportValidity();
      return false;
    }
    if (!formData.name.trim() || !formData.phone.trim() || !formData.accommodation) {
      setSubmitError('Please complete the required fields before confirming.');
      return false;
    }
    // Preserve the slider's completion state briefly before the celebration
    // sequence replaces the form.
    confirmationTimer.current = window.setTimeout(() => {
      setShowConfirmation(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 620);
    return true;
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    confirmRsvp();
  };

  const handleDownload = async () => {
    const { default: html2canvas } = await import('html2canvas');
    const { jsPDF } = await import('jspdf');
    const downloadContainer = document.createElement('div');
    downloadContainer.style.cssText = 'position:fixed;left:-10000px;top:0;width:720px;padding:64px;background:#f8f4ee;color:#433b34;font-family:Georgia,serif;';

    const heading = document.createElement('h1');
    heading.textContent = 'A note of celebration';
    heading.style.cssText = 'margin:0 0 12px;text-align:center;color:#a6814e;font-size:42px;font-weight:400;';
    downloadContainer.appendChild(heading);
    const intro = document.createElement('p');
    intro.textContent = 'Your RSVP is reserved for Farzeen & Bilal';
    intro.style.cssText = 'margin:0 0 42px;text-align:center;color:#7d7063;font-size:17px;';
    downloadContainer.appendChild(intro);

    const details = document.createElement('div');
    details.style.cssText = 'padding:34px;background:#fffdf9;border:1px solid #d9c7a8;';
    const rows: [string, string][] = [
      ['Guest', formData.name.trim()],
      ['Contact', formData.email.trim() ? `${formData.phone.trim()} | ${formData.email.trim()}` : formData.phone.trim()],
      ['Guests', String(formData.guestCount)],
      ['Accommodation', formData.accommodation === 'yes' ? 'Assistance requested' : 'Not needed'],
    ];
    rows.forEach(([label, value]) => {
      const row = document.createElement('p');
      row.style.cssText = 'margin:0 0 18px;font-size:18px;line-height:1.5;';
      const strong = document.createElement('strong');
      strong.textContent = `${label}: `;
      strong.style.color = '#a6814e';
      row.append(strong, document.createTextNode(value));
      details.appendChild(row);
    });
    downloadContainer.appendChild(details);
    document.body.appendChild(downloadContainer);

    try {
      const canvas = await html2canvas(downloadContainer, { scale: 2, backgroundColor: '#f8f4ee' });
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [canvas.width / 2, canvas.height / 2] });
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
      pdf.save(`wedding-rsvp-${formData.name.trim().replace(/\s+/g, '-').toLowerCase()}.pdf`);
    } finally {
      downloadContainer.remove();
    }
  };

  if (showConfirmation) {
    return (
      <main className="rsvp-page">
        <PaperBackground zIndex={0} />
        <CelestialBackdrop page="rsvp" />
        <InvitationParticles />
        <AdaptiveLantern />
        <ConfirmationPage data={formData} onDownload={handleDownload} />
      </main>
    );
  }

  return (
    <main className="rsvp-page">
      <JourneyPageLoader label="Preparing your RSVP" />
      <PaperBackground zIndex={0} />
      <CelestialBackdrop page="rsvp" />
      <InvitationParticles />
      <AdaptiveLantern />
      <div className="rsvp-glow rsvp-glow-left" aria-hidden="true" />
      <div className="rsvp-glow rsvp-glow-right" aria-hidden="true" />
      <motion.div className="rsvp-wrap" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
        <button type="button" className="rsvp-back" onClick={() => router.back()}><ArrowLeft size={16} aria-hidden="true" /> Back to journey</button>
        <motion.header className="rsvp-header" variants={scrollReveal} initial="hidden" whileInView="visible" viewport={{ once: false, amount: .5 }} transition={{ duration: .72, ease: [0.22, 1, 0.36, 1] }}>
          <span className="rsvp-kicker"><Sparkles size={14} aria-hidden="true" /> With love &amp; dua</span>
          <p className="rsvp-monogram">F <span>&</span> B</p>
          <h1>Be our guest</h1>
          <p>We would be honoured to celebrate this blessed occasion with you.</p>
        </motion.header>

        <form ref={formRef} className="rsvp-form" onSubmit={handleSubmit} noValidate>
          <motion.section className="rsvp-section" aria-labelledby="guest-heading" variants={scrollReveal} initial="hidden" whileInView="visible" viewport={{ once: false, amount: .22 }} transition={{ duration: .7, ease: [0.22, 1, 0.36, 1] }}>
            <div className="rsvp-section-heading"><span>01</span><h2 id="guest-heading">Your details</h2></div>
            <div className="rsvp-grid rsvp-grid-contact">
              <label className="rsvp-field rsvp-field-wide"><span>Full name <b>*</b></span><input required name="name" value={formData.name} onChange={(event) => updateField('name', event.target.value)} placeholder="Your name" autoComplete="name" /></label>
              <label className="rsvp-field"><span>Email address <em>Optional</em></span><input type="email" name="email" value={formData.email} onChange={(event) => updateField('email', event.target.value)} placeholder="you@example.com" autoComplete="email" /></label>
              <label className="rsvp-field"><span>Phone number <b>*</b></span><input required type="tel" name="phone" value={formData.phone} onChange={(event) => updateField('phone', event.target.value)} placeholder="Your phone number" autoComplete="tel" /></label>
            </div>
          </motion.section>

          <motion.section className="rsvp-section" aria-labelledby="party-heading" variants={scrollReveal} initial="hidden" whileInView="visible" viewport={{ once: false, amount: .22 }} transition={{ duration: .7, ease: [0.22, 1, 0.36, 1] }}>
            <div className="rsvp-section-heading"><span>02</span><h2 id="party-heading">Your party &amp; stay</h2></div>
            <div className="rsvp-party-row"><div><span className="rsvp-label">Number of guests</span><p>Including yourself</p></div><div className="rsvp-counter" aria-label="Number of guests"><button type="button" aria-label="Remove a guest" onClick={() => updateField('guestCount', Math.max(1, formData.guestCount - 1))}><Minus size={16} /></button><strong>{String(formData.guestCount).padStart(2, '0')}</strong><button type="button" aria-label="Add a guest" onClick={() => updateField('guestCount', Math.min(10, formData.guestCount + 1))}><Plus size={16} /></button></div></div>
            <fieldset className="rsvp-accommodation"><legend>Will you need accommodation? <b>*</b></legend><p>So we can make the right arrangements for you.</p><div className="rsvp-accommodation-options"><label className={`rsvp-choice ${formData.accommodation === 'yes' ? 'is-selected' : ''}`}><input required type="radio" name="accommodation" value="yes" checked={formData.accommodation === 'yes'} onChange={() => updateField('accommodation', 'yes')} /><span className="rsvp-choice-mark"><Check size={14} /></span><span><strong>Yes, please</strong><small>I&apos;ll need assistance with a stay.</small></span></label><label className={`rsvp-choice ${formData.accommodation === 'no' ? 'is-selected' : ''}`}><input required type="radio" name="accommodation" value="no" checked={formData.accommodation === 'no'} onChange={() => updateField('accommodation', 'no')} /><span className="rsvp-choice-mark"><Check size={14} /></span><span><strong>No, thank you</strong><small>I&apos;ve arranged my own stay.</small></span></label></div></fieldset>
          </motion.section>

          {submitError && <p className="rsvp-error" role="alert">{submitError}</p>}
          <motion.div className="rsvp-submit-row" variants={scrollReveal} initial="hidden" whileInView="visible" viewport={{ once: false, amount: .55 }} transition={{ duration: .7, ease: [0.22, 1, 0.36, 1] }}><p>Your reply helps us prepare a day full of thoughtful details.</p><SlideToConfirm className="rsvp-slide-confirm" width={slideWidth} height={60} text="Slide to confirm your place" successText="Your place is confirmed" onConfirm={() => confirmRsvp() ? undefined : Promise.reject(new Error('Please complete the RSVP form.'))} /></motion.div>
        </form>
        <p className="rsvp-footer">With love, Farzeen & Bilal <span>•</span> 2025</p>
      </motion.div>
    </main>
  );
}
