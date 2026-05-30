import { Hono } from 'hono'
import { createSurvey, deleteSurvey, getSurvey, getUserSurveys, updateSurvey } from '../db/queries'
import type { CreateSurveyRequest } from '../types/index'
import { generateId } from '../utils/auth'

const surveysRouter = new Hono<{ Bindings: Env }>()

/**
 * GET /surveys
 * Get all surveys for the logged-in user
 */
surveysRouter.get('/surveys', async (c) => {
  try {
    const userId = c.req.header('x-user-id')

    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const surveys = await getUserSurveys(c.env.DB, userId)

    return c.json({ surveys })
  } catch (error) {
    console.error('Get surveys error:', error)
    return c.json({ error: 'Failed to fetch surveys' }, 500)
  }
})

/**
 * POST /surveys
 * Create a new survey
 */
surveysRouter.post('/surveys', async (c) => {
  try {
    const userId = c.req.header('x-user-id')

    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const data: CreateSurveyRequest = await c.req.json()

    if (!data.title) {
      return c.json({ error: 'Title is required' }, 400)
    }

    const surveyId = generateId('survey')
    const survey = await createSurvey(
      c.env.DB,
      surveyId,
      userId,
      data.title,
      data.description,
      data.primary_color,
      data.logo_url,
    )

    return c.json({ survey }, 201)
  } catch (error) {
    console.error('Create survey error:', error)
    return c.json({ error: 'Failed to create survey' }, 500)
  }
})

/**
 * GET /surveys/:id
 * Get a specific survey. Public access is allowed so the shared survey link works without login.
 */
surveysRouter.get('/surveys/:id', async (c) => {
  try {
    const surveyId = c.req.param('id')

    const survey = await getSurvey(c.env.DB, surveyId)

    if (!survey) {
      return c.json({ error: 'Survey not found' }, 404)
    }

    return c.json({ survey })
  } catch (error) {
    console.error('Get survey error:', error)
    return c.json({ error: 'Failed to fetch survey' }, 500)
  }
})

/**
 * PUT /surveys/:id
 * Update survey metadata (title, branding, etc.)
 */
surveysRouter.put('/surveys/:id', async (c) => {
  try {
    const userId = c.req.header('x-user-id')
    const surveyId = c.req.param('id')

    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const survey = await getSurvey(c.env.DB, surveyId)

    if (!survey) {
      return c.json({ error: 'Survey not found' }, 404)
    }

    if (survey.user_id !== userId) {
      return c.json({ error: 'Forbidden' }, 403)
    }

    const updates = await c.req.json()
    const updatedSurvey = await updateSurvey(c.env.DB, surveyId, updates)

    return c.json({ survey: updatedSurvey })
  } catch (error) {
    console.error('Update survey error:', error)
    return c.json({ error: 'Failed to update survey' }, 500)
  }
})

/**
 * DELETE /surveys/:id
 * Delete a survey
 */
surveysRouter.delete('/surveys/:id', async (c) => {
  try {
    const userId = c.req.header('x-user-id')
    const surveyId = c.req.param('id')

    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const survey = await getSurvey(c.env.DB, surveyId)

    if (!survey) {
      return c.json({ error: 'Survey not found' }, 404)
    }

    if (survey.user_id !== userId) {
      return c.json({ error: 'Forbidden' }, 403)
    }

    await deleteSurvey(c.env.DB, surveyId)

    return c.json({ message: 'Survey deleted' })
  } catch (error) {
    console.error('Delete survey error:', error)
    return c.json({ error: 'Failed to delete survey' }, 500)
  }
})

export default surveysRouter
