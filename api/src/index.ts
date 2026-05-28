import { Hono } from 'hono'
import { initializeDb } from './db/init'
import authRouter from './routes/auth'
import questionsRouter from './routes/questions'
import responsesRouter from './routes/responses'
import surveysRouter from './routes/surveys'

const app = new Hono<{ Bindings: Env }>()

// Initialize database on startup
app.use('*', async (c, next) => {
  try {
    await initializeDb(c.env.DB)
  } catch (error) {
    console.error('DB init error:', error)
  }
  await next()
})

// Health check
app.get('/api/health', (c) => c.json({ status: 'ok' }))

// Routes
app.route('/api/auth', authRouter)
app.route('/api', surveysRouter)
app.route('/api', questionsRouter)
app.route('/api', responsesRouter)

export default app
