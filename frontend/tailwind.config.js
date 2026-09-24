/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: { ink: '#f5f7f2', moss: '#c6ff00', mint: '#c6ff00', sand: '#080b0a', line: '#253129' },
      boxShadow: { glass: '0 22px 80px rgba(0, 0, 0, .32)' },
      backgroundImage: { 'mesh': 'radial-gradient(circle at 10% 0%, rgba(198,255,0,.15), transparent 28%), radial-gradient(circle at 100% 20%, rgba(255,83,170,.14), transparent 30%), linear-gradient(135deg, #080b0a, #121815)' }
    }
  },
  plugins: []
}
