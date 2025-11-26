#!/bin/bash

echo "🌊 Setting up WowStore CMS Admin Dashboard..."
echo "=============================================="

# Create directory structure
mkdir -p ~/hydrogen-cms-admin/{src/{components,lib,store},public}
cd ~/hydrogen-cms-admin

# Create package.json
cat > package.json << 'EOFPKG'
{
  "name": "wowstore-cms-admin",
  "version": "2.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@tanstack/react-query": "^5.17.0",
    "@tiptap/react": "^2.1.13",
    "@tiptap/starter-kit": "^2.1.13",
    "@tiptap/extension-image": "^2.1.13",
    "@tiptap/extension-link": "^2.1.13",
    "zustand": "^4.4.7",
    "axios": "^1.6.5",
    "react-hot-toast": "^2.4.1",
    "lucide-react": "^0.303.0",
    "date-fns": "^3.0.6"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.1",
    "vite": "^5.0.11",
    "tailwindcss": "^3.4.1",
    "postcss": "^8.4.33",
    "autoprefixer": "^10.4.16"
  }
}
EOFPKG

# Create vite.config.js
cat > vite.config.js << 'EOFVITE'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    host: true,
  },
})
EOFVITE

# Create tailwind.config.js
cat > tailwind.config.js << 'EOFTAIL'
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
EOFTAIL

# Create postcss.config.js
cat > postcss.config.js << 'EOFPOST'
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
EOFPOST

# Create index.html
cat > index.html << 'EOFHTML'
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>WowStore CMS Admin</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
EOFHTML

echo "✅ Configuration files created"
echo "📦 Installing dependencies..."

npm install

echo "✅ Setup complete!"
echo ""
echo "�� To start development server:"
echo "   npm run dev"
echo ""
echo "📖 Then access at:"
echo "   https://3001-wowstore-dev-station.cluster-2lhixow5ibc7eudxay37r3rgmk.cloudworkstations.dev"

