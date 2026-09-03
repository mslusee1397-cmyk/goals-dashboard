import express from 'express'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const distPath = join(__dirname, 'dist')
const indexPath = join(distPath, 'index.html')

const app = express()
const PORT = process.env.PORT || 5173

// Prevent an old cached index.html from pointing at an outdated Vite bundle.
app.use((req, res, next) => {
  if (req.path === '/' || req.path.endsWith('.html')) {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    res.set('Pragma', 'no-cache')
    res.set('Expires', '0')
  }
  next()
})

// Serve static files from dist.
app.use(express.static(distPath, { index: false }))

// SPA fallback - always serve the current index.html for application routes.
app.get('*', (req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  res.set('Pragma', 'no-cache')
  res.set('Expires', '0')
  res.sendFile(indexPath)
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✓ Server running at http://localhost:${PORT}`)
  console.log(`✓ Ready for requests`)
})
