import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'
import { defineConfig, loadEnv, type Plugin } from 'vite'

// Serves api/explain.ts inside `vite dev` the same way Vercel serves it in
// production, so the AI card works on localhost without extra tooling.
const devApi = (env: Record<string, string>): Plugin => ({
  name: 'dev-api',
  configureServer(server) {
    server.middlewares.use('/api/explain', async (req, res) => {
      if (req.method !== 'POST') {
        res.statusCode = 405
        return res.end()
      }
      const chunks: Buffer[] = []
      for await (const c of req) chunks.push(c as Buffer)
      const mod = await server.ssrLoadModule('/api/explain.ts')
      const out = await mod.explainLedger(JSON.parse(Buffer.concat(chunks).toString()).ledger, env).then(
        (body: unknown) => ({ status: 200, body }),
        (e: Error) => ({ status: 500, body: { error: e.message } }),
      )
      res.statusCode = out.status
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify(out.body))
    })
  },
})

// Two pages: the landing site at / and the app at /app/
export default defineConfig(({ mode }) => ({
  plugins: [react(), devApi(loadEnv(mode, process.cwd(), 'FEATHERLESS_'))],
  build: {
    rollupOptions: {
      input: {
        site: resolve(import.meta.dirname, 'index.html'),
        app: resolve(import.meta.dirname, 'app/index.html'),
      },
    },
  },
}))
