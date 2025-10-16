export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Infosoft brand colors
        'infosoft-red': {
          50: '#FEF2F2',
          100: '#FEE2E2',
          200: '#FECACA',
          300: '#FCA5A5',
          400: '#F87171',
          500: '#FF0000',  // Primary Infosoft Red
          600: '#DC0000',
          700: '#B91C1C',
          800: '#991B1B',
          900: '#7F1D1D'
        },
        'infosoft-maroon': {
          DEFAULT: '#8B0000',
          light: '#A52A2A',
          dark: '#5C0000'
        },
        'infosoft-cyan': {
          DEFAULT: '#06B6D4',
          light: '#22D3EE',
          dark: '#0891B2'
        },
        // Map brand to Infosoft red for backward compatibility
        brand: {
          50: '#FEF2F2',
          100: '#FEE2E2',
          200: '#FECACA',
          300: '#FCA5A5',
          400: '#F87171',
          500: '#FF0000',
          600: '#DC0000',
          700: '#B91C1C',
          800: '#991B1B',
          900: '#7F1D1D'
        },
        muted: {
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937'
        },
        success: '#10B981',
        accent: '#DC0000'
      },
      fontFamily: {
        sans: ['Poppins', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        card: '0 12px 40px rgba(0, 0, 0, 0.08)',
        lift: '0 20px 45px rgba(255, 0, 0, 0.18)',
        soft: '0 4px 12px rgba(0, 0, 0, 0.05)'
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(135deg, #FF0000, #8B0000)',
        'infosoft-gradient': 'linear-gradient(135deg, #FF0000 0%, #DC0000 50%, #8B0000 100%)'
      },
      animation: {
        'fade-in': 'fadeIn 1s ease-in-out',
        'slide-up': 'slideUp 0.7s ease-out',
        'slide-left': 'slideLeft 0.7s ease-out',
        'slide-right': 'slideRight 0.7s ease-out',
        'bounce-slow': 'bounce 3s infinite'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        slideLeft: {
          '0%': { opacity: '0', transform: 'translateX(30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' }
        },
        slideRight: {
          '0%': { opacity: '0', transform: 'translateX(-30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' }
        }
      }
    }
  },
  plugins: []
};
