/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        obsidian: '#0b0f0c',
        bunker: '#0f1712',
        armor: '#17261c',
        steel: '#9aa691',
        ember: '#f5c451',
        emberDeep: '#f29e3d',
        neon: '#7dffb0',
        danger: '#ff5f6d',
        haze: '#1f2d23'
      },
      fontFamily: {
        display: ['"Teko"', 'sans-serif'],
        body: ['"Chakra Petch"', 'sans-serif']
      },
      boxShadow: {
        panel: '0 24px 80px rgba(0, 0, 0, 0.45)',
        glow: '0 0 30px rgba(245, 196, 81, 0.3)',
        neon: '0 0 22px rgba(125, 255, 176, 0.35)'
      },
      backgroundImage: {
        grid: 'linear-gradient(transparent 0 0), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
        hatch: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.0) 60%)'
      }
    }
  },
  plugins: []
}
