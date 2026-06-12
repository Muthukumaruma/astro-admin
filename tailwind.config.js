import typography from '@tailwindcss/typography';

export default {
    content: ['./index.html', './src/**/*.{ts,tsx}'],
    theme: {
        extend: {
            colors: {
                background: 'hsl(var(--background))',
                foreground: 'hsl(var(--foreground))',
                border: 'hsl(var(--border))',
                input: 'hsl(var(--input))',
                ring: 'hsl(var(--ring))',
                cosmic: {
                    950: '#04030E',
                    900: '#080618',
                    800: '#0D0B2A',
                    700: '#12103A',
                    600: '#1C1952',
                    500: '#2D2A6E',
                },
                gold: {
                    300: '#FCD34D',
                    400: '#F59E0B',
                    500: '#D97706',
                },
                nebula: {
                    400: '#A78BFA',
                    500: '#8B5CF6',
                    600: '#7C3AED',
                },
                planet: {
                    sun: '#F59E0B',
                    moon: '#CBD5E1',
                    mars: '#EF4444',
                    mercury: '#10B981',
                    jupiter: '#F59E0B',
                    venus: '#EC4899',
                    saturn: '#8B5CF6',
                    rahu: '#6366F1',
                    ketu: '#94A3B8',
                },
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                display: ['Outfit', 'sans-serif'],
            },
            backgroundImage: {
                'cosmic-gradient': 'linear-gradient(135deg, #04030E 0%, #0D0B2A 50%, #080618 100%)',
                'gold-gradient': 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                'nebula-gradient': 'linear-gradient(135deg, #A78BFA 0%, #7C3AED 100%)',
            },
            boxShadow: {
                glass: '0 8px 32px rgba(0, 0, 0, 0.4)',
                'glow-red': '0 0 20px rgba(239, 68, 68, 0.4)',
                'glow-gold': '0 0 20px rgba(245, 158, 11, 0.3)',
            },
            animation: {
                float: 'float 6s ease-in-out infinite',
                shimmer: 'shimmer 2s linear infinite',
                glowPulse: 'glowPulse 2s ease-in-out infinite',
            },
            keyframes: {
                float: { '0%, 100%': { transform: 'translateY(0px)' }, '50%': { transform: 'translateY(-10px)' } },
                shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
                glowPulse: { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0.5' } },
            },
        },
    },
    plugins: [typography],
};
