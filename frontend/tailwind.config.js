export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        'icc-blue': {
          DEFAULT: '#1E3A8A',
          light: '#3B82F6',
          dark: '#1E40AF'
        },
        'icc-orange': {
          DEFAULT: '#F97316',
          light: '#FB923C',
          dark: '#EA580C'
        },
        'icc-gray': {
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          600: '#4B5563',
          800: '#1F2937',
          900: '#111827'
        },
        brand: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A'
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
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        card: '0 12px 40px rgba(15, 23, 42, 0.08)',
        lift: '0 20px 45px rgba(30, 58, 138, 0.18)'
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(135deg, rgba(30, 58, 138, 0.95), rgba(30, 64, 175, 0.9))'
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
