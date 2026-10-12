export default {
  content: ['./index.html', './main.js'],
  theme: {
    extend: {
      colors: {
        slatebg: '#F1F4F8',
        surface: '#FFFFFF',
        surfaceMuted: '#E8EDF4',
        navy: '#20334F',
        navySoft: '#344761',
        blue: '#2676F3',
        blueHover: '#1D5FC7',
        border: '#D7DEE8',
        muted: '#66758A'
      },
      boxShadow: {
        soft: '0 12px 30px rgba(32, 51, 79, 0.08)'
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
};
