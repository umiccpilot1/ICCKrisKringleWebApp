/***************************************************
 * Tailwind CSS configuration for the Kris Kringle app
 ***************************************************/
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Inter var', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        display: ['Poppins', 'Inter', 'sans-serif']
      },
      colors: {
        festive: {
          red: '#ef4444',
          green: '#22c55e',
          gold: '#facc15'
        },
        midnight: '#050810',
        nightfall: '#0b1220',
        aurora: '#39d0ff',
        iris: '#6366f1',
        orchid: '#b46bff'
      },
      boxShadow: {
        glow: '0 18px 48px -16px rgba(57, 208, 255, 0.45)',
        soft: '0 24px 60px -30px rgba(15, 23, 42, 0.8)'
      },
      backgroundImage: {
        'aurora-gradient': 'radial-gradient(circle at 10% 20%, rgba(99,102,241,0.35), transparent 45%), radial-gradient(circle at 80% 0%, rgba(57,208,255,0.25), transparent 55%)'
      }
    }
  },
  plugins: []
};
