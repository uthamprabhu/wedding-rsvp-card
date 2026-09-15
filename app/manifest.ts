import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Farzeen & Bilal Wedding Invitation',
    short_name: 'F&B Wedding',
    description: 'You are cordially invited to celebrate the wedding of Farzeen and Bilal',
    start_url: '/',
    display: 'standalone',
    background_color: '#ebe1d6',
    theme_color: '#a6814e',
    orientation: 'portrait',
    icons: [
      {
        src: '/images/logo.jpeg',
        sizes: 'any',
        type: 'image/jpeg',
      },
    ],
  };
}
