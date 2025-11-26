export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
  safelist: [
    'bg-blue-50', 'bg-blue-100', 'text-blue-600', 'text-blue-800',
    'bg-purple-50', 'bg-purple-100', 'text-purple-600',
    'bg-green-50', 'bg-green-100', 'text-green-600', 'text-green-800',
    'bg-yellow-50', 'bg-yellow-100', 'text-yellow-600', 'text-yellow-800',
    'bg-orange-50', 'bg-orange-100', 'text-orange-600',
    'bg-red-50', 'bg-red-100', 'text-red-600', 'text-red-800',
  ],
}
