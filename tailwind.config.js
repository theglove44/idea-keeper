/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./index.tsx",
    "./App.tsx",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./services/**/*.{js,ts,jsx,tsx}",
    "./hooks/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      // Custom spacing scale (4px base)
      spacing: {
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '7': '28px',
        '8': '32px',
        '10': '40px',
        '12': '48px',
        '16': '64px',
        '20': '80px',
        '24': '96px',
      },
      // Custom brand colors with semantic naming
      colors: {
        // Brand colors
        brand: {
          purple: {
            DEFAULT: '#3f78ff',
            50: '#eef4ff',
            100: '#dbe8ff',
            200: '#bed5ff',
            300: '#93b8ff',
            400: '#6698ff',
            500: '#3f78ff',
            600: '#2f5fe8',
            700: '#264cc0',
            800: '#233f9a',
            900: '#21367a',
            950: '#182552',
          },
          cyan: {
            DEFAULT: '#00b8d9',
            50: '#eefcff',
            100: '#d5f8ff',
            200: '#aef1ff',
            300: '#6ce5ff',
            400: '#22d5f7',
            500: '#00b8d9',
            600: '#0092b0',
            700: '#06738c',
            800: '#0b5d71',
            900: '#104d5d',
            950: '#06313d',
          },
          orange: {
            DEFAULT: '#ff8a3d',
            50: '#fff7f1',
            100: '#ffe8d9',
            200: '#ffd0b1',
            300: '#ffb17d',
            400: '#ff8a3d',
            500: '#ff721f',
            600: '#f05a14',
            700: '#c74414',
            800: '#9e3817',
            900: '#803218',
            950: '#451709',
          },
        },
        // Semantic colors for dark mode
        surface: {
          DEFAULT: '#0b1220',
          base: '#0b1220',
          dark: '#070b14',
          elevated: '#111a2e',
          overlay: '#1b2740',
        },
        text: {
          primary: '#ecf3ff',
          secondary: '#c3d1ea',
          tertiary: '#95a9ca',
          muted: '#6a7ea1',
        },
        border: {
          DEFAULT: '#2a3a58',
          subtle: '#2a3a58',
          light: '#3b5078',
          lighter: '#526991',
        },
        // Status colors
        status: {
          active: '#10b981',    // green-500
          pending: '#f59e0b',   // amber-500
          blocked: '#ef4444',   // red-500
          success: '#22c55e',   // green-500
          warning: '#f59e0b',   // amber-500
          error: '#ef4444',     // red-500
          info: '#3b82f6',      // blue-500
        },
      },
      // Typography scale
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],      // 12px
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],  // 14px
        'base': ['1rem', { lineHeight: '1.5rem' }],     // 16px
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],  // 18px
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],   // 20px
        '2xl': ['1.5rem', { lineHeight: '2rem' }],      // 24px
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],   // 36px
        '5xl': ['3rem', { lineHeight: '1' }],           // 48px
        '6xl': ['3.75rem', { lineHeight: '1' }],        // 60px
      },
      // Font families
      fontFamily: {
        sans: ['Manrope', 'Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'Monaco', 'Courier New', 'monospace'],
      },
      // Custom shadows for depth
      boxShadow: {
        'card': '0 8px 20px -12px rgba(2, 12, 36, 0.75)',
        'card-hover': '0 16px 36px -18px rgba(2, 12, 36, 0.85)',
        'elevated': '0 26px 50px -26px rgba(2, 12, 36, 0.9)',
        'glow-purple': '0 0 20px rgba(63, 120, 255, 0.45)',
        'glow-cyan': '0 0 20px rgba(0, 184, 217, 0.4)',
        'glow-orange': '0 0 20px rgba(255, 138, 61, 0.35)',
      },
      // Custom animations
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'slide-in-left': 'slideInLeft 0.3s ease-out',
        'slide-in-up': 'slideInUp 0.3s ease-out',
        'slide-in-down': 'slideInDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'bounce-gentle': 'bounceGentle 0.5s ease-in-out',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideInLeft: {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideInUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 10px rgba(63, 120, 255, 0.28)' },
          '50%': { boxShadow: '0 0 20px rgba(0, 184, 217, 0.42)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
      },
      // Gradient backgrounds
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gradient-brand': 'linear-gradient(135deg, #3f78ff 0%, #00b8d9 100%)',
        'gradient-sunset': 'linear-gradient(135deg, #00b8d9 0%, #ff8a3d 100%)',
        'shimmer': 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
      },
      // Border radius
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
      // Transitions
      transitionDuration: {
        '250': '250ms',
        '350': '350ms',
      },
    },
  },
  plugins: [],
}
