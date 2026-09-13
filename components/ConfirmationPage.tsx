'use client';

import { useState } from 'react';
import { Check, Download, Mail, Users, Utensils, BedDouble } from 'lucide-react';
import { motion } from 'framer-motion';

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
  onDownload: () => Promise<void>;
}

export default function ConfirmationPage({ data, onDownload }: ConfirmationPageProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');

  const handleDownload = async () => {
    setIsDownloading(true);
    setDownloadError('');
    try {
      await onDownload();
    } catch {
      setDownloadError('Your RSVP is saved on this page, but the keepsake could not be prepared.');
    } finally {
      setIsDownloading(false);
    }
  };

  const firstName = data.name.trim().split(/\s+/)[0];
  const details = [
    { icon: Users, label: 'Your party', value: `${data.guestCount} ${data.guestCount === 1 ? 'guest' : 'guests'}` },
    { icon: Mail, label: 'Confirmation email', value: data.email },
    { icon: BedDouble, label: 'Accommodation', value: data.accommodation === 'yes' ? 'Assistance requested' : 'Not needed' },
  ];

  return (
    <div className="rsvp-confirmation">
      <motion.div className="rsvp-confirmation-wrap" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .7 }}>
        <div className="rsvp-confirmation-mark"><Check size={22} strokeWidth={1.5} /></div>
        <p className="rsvp-kicker">The sweetest yes</p>
        <h1>Thank you, {firstName}.</h1>
        <p className="rsvp-confirmation-intro">Your place at our celebration is lovingly reserved. We cannot wait to share the day with you.</p>

        <div className="rsvp-confirmation-details">
          {details.map(({ icon: Icon, label, value }) => <div className="rsvp-detail" key={label}><Icon size={17} strokeWidth={1.5} /><div><span>{label}</span><strong>{value}</strong></div></div>)}
          {data.dietaryRestrictions && <div className="rsvp-detail"><Utensils size={17} strokeWidth={1.5} /><div><span>Dietary notes</span><strong>{data.dietaryRestrictions}</strong></div></div>}
        </div>

        <div className="rsvp-confirmation-actions">
          <button type="button" className="rsvp-submit" onClick={handleDownload} disabled={isDownloading}><Download size={16} /> {isDownloading ? 'Preparing keepsake' : 'Download keepsake'}</button>
          <p>We have your RSVP details for {data.phone}.</p>
        </div>
        {downloadError && <p className="rsvp-error" role="alert">{downloadError}</p>}
        {data.message && <p className="rsvp-confirmation-note">“{data.message}”</p>}
        <p className="rsvp-footer">With love, Farzeen & Bilal <span>•</span> 2025</p>
      </motion.div>
    </div>
  );
}
