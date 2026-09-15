export default function StructuredData() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: 'Farzeen & Bilal Wedding',
    description: 'Join us for the wedding celebration of Farzeen and Bilal. A blessed occasion filled with love, joy, and cherished moments.',
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    organizer: {
      '@type': 'Person',
      name: 'Farzeen & Bilal',
    },
    image: [
      'https://farzeen-bilal.vercel.app/images/humans/couple-pose-side.jpg',
      'https://farzeen-bilal.vercel.app/images/og-image.jpg'
    ],
    url: 'https://farzeen-bilal.vercel.app',
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
