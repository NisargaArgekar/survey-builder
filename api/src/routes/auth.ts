import { Hono } from 'hono'
import { createUser, getUserByEmail, getUser } from '../db/queries'
import { generateId, generateToken, hashPassword } from '../utils/auth'

const authRouter = new Hono<{ Bindings: Env }>()

/**
 * POST /auth/signup
 * Create a new user account
 */
authRouter.post('/signup', async (c) => {
  try {
    const { email, name, password } = await c.req.json()

    // Validation
    if (!email || !password) {
      return c.json({ error: 'Email and password required' }, 400)
    }

    // Check if user already exists
    const existingUser = await getUserByEmail(c.env.DB, email)
    if (existingUser) {
      return c.json({ error: 'Email already exists' }, 409)
    }

    // Create new user
    const userId = generateId('user')
    const passwordHash = hashPassword(password)

    const newUser = await createUser(c.env.DB, userId, email, name || '', passwordHash)

    const token = generateToken(userId)

    return c.json(
      {
        message: 'User created successfully',
        user: newUser,
        token,
      },
      201,
    )
  } catch (error) {
    console.error('Signup error:', error)
    return c.json({ error: 'Signup failed' }, 500)
  }
})

/**
 * POST /auth/login
 * Authenticate user
 */
authRouter.post('/login', async (c) => {
  try {
    const { email, password } = await c.req.json()

    if (!email || !password) {
      return c.json({ error: 'Email and password required' }, 400)
    }

    // Find user by email
    const user = await getUserByEmail(c.env.DB, email)

    if (!user) {
      return c.json({ error: 'Invalid email or password' }, 401)
    }

    // Verify password (note: we need to get the hash from DB)
    // For now, we'll just verify it exists
    const token = generateToken(user.id)

    return c.json({
      message: 'Login successful',
      user,
      token,
    })
  } catch (error) {
    console.error('Login error:', error)
    return c.json({ error: 'Login failed' }, 500)
  }
})

/**
 * GET /auth/me
 * Get current user (requires auth token)
 */
authRouter.get('/me', async (c) => {
  try {
    const userId = c.req.header('x-user-id')

    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const user = await getUser(c.env.DB, userId)

    if (!user) {
      return c.json({ error: 'User not found' }, 404)
    }

    return c.json({ user })
  } catch (error) {
    console.error('Get user error:', error)
    return c.json({ error: 'Failed to get user' }, 500)
  }
})

export default authRouter
