# Farzeen & Bilal Wedding RSVP

A beautiful, luxury Muslim-themed wedding invitation and RSVP system built with Next.js 16 and Supabase.

## ✨ Features

### Public Experience
- **Luxury Digital Invitation** - Elegant card with Muslim wedding theme
- **Interactive Itinerary** - Timeline of wedding events (Mehndi, Nikah, Walima)
- **RSVP Form** - Guest registration with accommodation preferences
- **Confirmation Page** - Celebratory confirmation with confetti animation
- **Realistic Butterflies** - WebGL-powered 3D butterflies
- **Smooth Animations** - Framer Motion with mobile optimizations
- **Responsive Design** - Optimized for mobile, tablet, and desktop

### Admin Panel
- **Secure Login** - Password-protected with HttpOnly session cookies
- **Dashboard Stats** - Total responses, guests, accommodation needs, trends
- **RSVP Management** - Search, filter, and sort all submissions
- **Mobile Responsive** - Table view on desktop, card layout on mobile
- **Elegant Theme** - Matches wedding aesthetic

## 🛠️ Tech Stack

### Frontend
- **Next.js 16** - React framework with App Router
- **TypeScript** - Type-safe code
- **Tailwind CSS 4** - Utility-first styling
- **Framer Motion** - Smooth animations
- **Three.js** - 3D butterfly animations
- **Paper Design Shaders** - Textured backgrounds

### Backend
- **Supabase** - PostgreSQL database with real-time capabilities
- **Server Actions** - Secure API routes
- **Row Level Security** - Database-level security

### UI Components
- **Radix UI** - Accessible primitives (Dialog, Switch, Slider)
- **Lucide React** - Beautiful icons
- **Canvas Confetti** - Celebration effects

## 📦 Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd wedding-rsvp-card

# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with your credentials

# Run development server
npm run dev

# Build for production
npm run build
npm start
```

## 🔑 Environment Variables

Create `.env.local` in the root directory:

```env
# Supabase - Public (client-side safe)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_publishable_key

# Supabase - Server-side only (keep secret!)
SUPABASE_SECRET_KEY=your_service_role_key

# Admin Panel Access
ADMIN_PASSWORD=your_secure_password
```

## 🗄️ Database Schema

Run this SQL in Supabase SQL Editor:

```sql
-- Create RSVPs table
CREATE TABLE IF NOT EXISTS public.rsvps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  guest_count INTEGER NOT NULL CHECK (guest_count >= 1 AND guest_count <= 10),
  accommodation_needed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_rsvps_created_at ON public.rsvps(created_at DESC);

-- Enable RLS
ALTER TABLE public.rsvps ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON public.rsvps TO service_role;
GRANT ALL ON public.rsvps TO postgres;
GRANT INSERT ON public.rsvps TO anon;
```

## 🚀 Deployment

### Vercel (Recommended)

1. **Push to GitHub**
```bash
git add .
git commit -m "Wedding RSVP system"
git push origin main
```

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your repository
   - Add environment variables
   - Deploy!

3. **Add Environment Variables in Vercel**
   - Go to Project Settings → Environment Variables
   - Add all variables from `.env.local`

## 📱 Routes

| Route | Description | Type |
|-------|-------------|------|
| `/` | Landing/Invitation page | Public |
| `/itinerary` | Wedding event timeline | Public |
| `/rsvp` | RSVP form | Public |
| `/rsvp/confirmation` | Confirmation page | Public |
| `/admin` | Admin login | Protected |
| `/admin/dashboard` | RSVP management | Protected |

## 🎨 Theme & Design

### Colors
- **Background**: `#ebe1d6` (Elegant cream)
- **Primary**: `#a6814e` (Luxury gold)
- **Text**: `#433b34` (Deep brown)

### Typography
- **Headings**: Cormorant Garamond (serif)
- **Body**: Inter (sans-serif)

### Animations
- **Mobile**: Simplified, `once: true` viewport triggers
- **Desktop**: Full parallax and scroll-linked effects
- **Performance**: Hardware-accelerated, 60fps target

## 📊 Performance Optimizations

- ✅ **Lazy loading** - Heavy components load on demand
- ✅ **Mobile optimizations** - Reduced animations, no parallax
- ✅ **Image optimization** - Next.js Image component
- ✅ **Code splitting** - Automatic route-based splitting
- ✅ **CSS optimization** - will-change hints, hardware acceleration
- ✅ **Server-side rendering** - Fast initial page loads

## 🔒 Security Features

### RSVP Submission
- Server-side validation
- API route with service_role key
- Input sanitization
- Rate limiting via Supabase RLS

### Admin Panel
- Password authentication (bcrypt alternative via env)
- HttpOnly session cookies
- Secure flag in production
- SameSite CSRF protection
- Session expiry (24 hours)
- Middleware route protection

## 📝 Scripts

```bash
# Development
npm run dev          # Start dev server (localhost:3000)

# Production
npm run build        # Build for production
npm start            # Start production server

# Code Quality
npm run lint         # Run ESLint
```

## 🐛 Troubleshooting

### RSVP Submission Fails
- Verify `SUPABASE_SECRET_KEY` is set
- Check `rsvps` table exists in Supabase
- Ensure service_role has permissions

### Admin Login Not Working
- Verify `ADMIN_PASSWORD` in environment variables
- Clear browser cookies
- Check browser console for errors

### Butterflies Not Appearing
- Check browser console for WebGL errors
- Verify `/butterfly.png` exists in `public/`
- Some browsers don't support WebGL (fallback: no butterflies)

### Performance Issues on Mobile
- Animations automatically simplified on mobile
- Parallax effects disabled below 768px
- Check Chrome DevTools Performance tab

## 📄 License

Private project for Farzeen & Bilal's wedding.

## 👨‍💻 Built With

Created with ❤️ using:
- Next.js 16.3.5
- React 19.2.8
- TypeScript 5
- Supabase
- Framer Motion 13
- Three.js
- Tailwind CSS 4

---

**For support or questions, contact the development team.**

Made with love for Farzeen & Bilal's special day 💍✨
