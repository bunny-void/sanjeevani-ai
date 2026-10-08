import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { createMedicalCopilotMiddleware } from './server/medicalCopilotHandler.js'

const sanjeevaniCopilotApiPlugin = () => ({
  name: 'sanjeevani-medical-copilot-api',
  configureServer(server) {
    server.middlewares.use(createMedicalCopilotMiddleware())
  },
  configurePreviewServer(server) {
    server.middlewares.use(createMedicalCopilotMiddleware())
  },
})

export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss(), sanjeevaniCopilotApiPlugin()],
})
