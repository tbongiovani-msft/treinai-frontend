import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      // Each Function App runs on its own port locally.
      // Start with: func start --port <port>
      '/api/alunos':           { target: 'http://localhost:7071', changeOrigin: true },
      '/api/treinos':          { target: 'http://localhost:7072', changeOrigin: true },
      '/api/exercicios':       { target: 'http://localhost:7072', changeOrigin: true }, // fn-treinos
      '/api/atividades':       { target: 'http://localhost:7073', changeOrigin: true },
      '/api/avaliacoes':       { target: 'http://localhost:7074', changeOrigin: true },
      '/api/nutricao':         { target: 'http://localhost:7075', changeOrigin: true },
      '/api/relatorios':       { target: 'http://localhost:7076', changeOrigin: true },
      '/api/auth':             { target: 'http://localhost:7077', changeOrigin: true }, // fn-admin
      '/api/usuarios':         { target: 'http://localhost:7077', changeOrigin: true }, // fn-admin
      '/api/notificacoes':     { target: 'http://localhost:7077', changeOrigin: true }, // fn-admin
      '/api/objetivos':        { target: 'http://localhost:7077', changeOrigin: true }, // fn-admin
      '/api/tenants':          { target: 'http://localhost:7077', changeOrigin: true }, // fn-admin
    },
  },
})
