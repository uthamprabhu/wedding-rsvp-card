'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Check, Minus, Plus, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import PaperBackground from '@/components/PaperBackground';
import ConfirmationPage from '@/components/ConfirmationPage';
import CelestialBackdrop, { RsvpLantern } from '@/components/CelestialBackdrop';

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

export default function RSVPPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const updateField = <Key extends keyof FormData>(key: Key, value: FormData[Key]) => {
    setFormData((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError('');
    if (!event.currentTarget.checkValidity()) {
      event.currentTarget.reportValidity();
      return;
    }
    if (!formData.name.trim() || !formData.phone.trim() || !formData.accommodation) {
      setSubmitError('Please complete the required fields before confirming.');
      return;
    }
    setShowConfirmation(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
        <PaperBackground />
        <CelestialBackdrop page="rsvp" butterflies />
        <RsvpLantern />
        <ConfirmationPage data={formData} onDownload={handleDownload} />
      </main>
    );
  }

  return (
    <main className="rsvp-page">
      <PaperBackground />
      <CelestialBackdrop page="rsvp" butterflies />
      <RsvpLantern />
      <div className="rsvp-glow rsvp-glow-left" aria-hidden="true" />
      <div className="rsvp-glow rsvp-glow-right" aria-hidden="true" />
      <motion.div className="rsvp-wrap" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
        <button type="button" className="rsvp-back" onClick={() => router.back()}><ArrowLeft size={16} aria-hidden="true" /> Back to journey</button>
        <header className="rsvp-header">
          <span className="rsvp-kicker"><Sparkles size={14} aria-hidden="true" /> With love &amp; dua</span>
          <p className="rsvp-monogram">F <span>&</span> B</p>
          <h1>Be our guest</h1>
          <p>We would be honoured to celebrate this blessed occasion with you.</p>
        </header>

        <form className="rsvp-form" onSubmit={handleSubmit} noValidate>
          <section className="rsvp-section" aria-labelledby="guest-heading">
            <div className="rsvp-section-heading"><span>01</span><h2 id="guest-heading">Your details</h2></div>
            <div className="rsvp-grid rsvp-grid-contact">
              <label className="rsvp-field rsvp-field-wide"><span>Full name <b>*</b></span><input required name="name" value={formData.name} onChange={(event) => updateField('name', event.target.value)} placeholder="Your name" autoComplete="name" /></label>
              <label className="rsvp-field"><span>Email address <em>Optional</em></span><input type="email" name="email" value={formData.email} onChange={(event) => updateField('email', event.target.value)} placeholder="you@example.com" autoComplete="email" /></label>
              <label className="rsvp-field"><span>Phone number <b>*</b></span><input required type="tel" name="phone" value={formData.phone} onChange={(event) => updateField('phone', event.target.value)} placeholder="Your phone number" autoComplete="tel" /></label>
            </div>
          </section>

          <section className="rsvp-section" aria-labelledby="party-heading">
            <div className="rsvp-section-heading"><span>02</span><h2 id="party-heading">Your party &amp; stay</h2></div>
            <div className="rsvp-party-row"><div><span className="rsvp-label">Number of guests</span><p>Including yourself</p></div><div className="rsvp-counter" aria-label="Number of guests"><button type="button" aria-label="Remove a guest" onClick={() => updateField('guestCount', Math.max(1, formData.guestCount - 1))}><Minus size={16} /></button><strong>{String(formData.guestCount).padStart(2, '0')}</strong><button type="button" aria-label="Add a guest" onClick={() => updateField('guestCount', Math.min(10, formData.guestCount + 1))}><Plus size={16} /></button></div></div>
            <fieldset className="rsvp-accommodation"><legend>Will you need accommodation? <b>*</b></legend><p>So we can make the right arrangements for you.</p><div className="rsvp-accommodation-options"><label className={`rsvp-choice ${formData.accommodation === 'yes' ? 'is-selected' : ''}`}><input required type="radio" name="accommodation" value="yes" checked={formData.accommodation === 'yes'} onChange={() => updateField('accommodation', 'yes')} /><span className="rsvp-choice-mark"><Check size={14} /></span><span><strong>Yes, please</strong><small>I&apos;ll need assistance with a stay.</small></span></label><label className={`rsvp-choice ${formData.accommodation === 'no' ? 'is-selected' : ''}`}><input required type="radio" name="accommodation" value="no" checked={formData.accommodation === 'no'} onChange={() => updateField('accommodation', 'no')} /><span className="rsvp-choice-mark"><Check size={14} /></span><span><strong>No, thank you</strong><small>I&apos;ve arranged my own stay.</small></span></label></div></fieldset>
          </section>

          {submitError && <p className="rsvp-error" role="alert">{submitError}</p>}
          <div className="rsvp-submit-row"><p>Your reply helps us prepare a day full of thoughtful details.</p><button className="rsvp-submit" type="submit">Confirm attendance <ArrowRight size={17} aria-hidden="true" /></button></div>
        </form>
        <p className="rsvp-footer">With love, Farzeen & Bilal <span>•</span> 2025</p>
      </motion.div>
    </main>
  );
}
