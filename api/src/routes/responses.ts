import { Hono } from 'hono'
import {
  createAnswer,
  createResponse,
  deleteResponse,
  deleteResponseAnswers,
  getResponse,
  getSurvey,
  getSurveyResponses,
} from '../db/queries'
import type { SubmitResponseRequest } from '../types/index'
import { generateId } from '../utils/auth'

const responsesRouter = new Hono<{ Bindings: Env }>()

/**
 * POST /surveys/:surveyId/responses
 * Submit a response to a public survey (no auth required)
 */
responsesRouter.post('/surveys/:surveyId/responses', async (c) => {
  try {
    const surveyId = c.req.param('surveyId')
    const data: SubmitResponseRequest = await c.req.json()

    if (!data.answers || !Array.isArray(data.answers)) {
      return c.json({ error: 'Answers array is required' }, 400)
    }

    // Generate anonymous respondent ID
    const respondentId = generateId('respondent')
    const responseId = generateId('response')

    // Create response
    const response = await createResponse(c.env.DB, responseId, surveyId, respondentId)

    // Create each answer
    for (const answer of data.answers) {
      const answerId = generateId('answer')
      await createAnswer(c.env.DB, answerId, responseId, answer.question_id, answer.answer_value)
    }

    return c.json({ message: 'Response submitted successfully', response }, 201)
  } catch (error) {
    console.error('Submit response error:', error)
    return c.json({ error: 'Failed to submit response' }, 500)
  }
})

/**
 * GET /surveys/:surveyId/responses
 * Get all responses for a survey (owner only)
 */
responsesRouter.get('/surveys/:surveyId/responses', async (c) => {
  try {
    const userId = c.req.header('x-user-id')
    const surveyId = c.req.param('surveyId')

    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    // Check if user owns the survey
    const survey = await getSurvey(c.env.DB, surveyId)
    if (!survey || survey.user_id !== userId) {
      return c.json({ error: 'Forbidden' }, 403)
    }

    const responses = await getSurveyResponses(c.env.DB, surveyId)

    return c.json({ responses })
  } catch (error) {
    console.error('Get responses error:', error)
    return c.json({ error: 'Failed to fetch responses' }, 500)
  }
})

/**
 * GET /surveys/:surveyId/responses/:responseId
 * Get a specific response with its answers
 */
responsesRouter.get('/surveys/:surveyId/responses/:responseId', async (c) => {
  try {
    const userId = c.req.header('x-user-id')
    const surveyId = c.req.param('surveyId')
    const responseId = c.req.param('responseId')

    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    // Check if user owns the survey
    const survey = await getSurvey(c.env.DB, surveyId)
    if (!survey || survey.user_id !== userId) {
      return c.json({ error: 'Forbidden' }, 403)
    }

    const response = await getResponse(c.env.DB, responseId)

    if (!response || response.survey_id !== surveyId) {
      return c.json({ error: 'Response not found' }, 404)
    }

    return c.json({ response })
  } catch (error) {
    console.error('Get response error:', error)
    return c.json({ error: 'Failed to fetch response' }, 500)
  }
})

/**
 * DELETE /surveys/:surveyId/responses/:responseId
 * Delete a specific response
 */
responsesRouter.delete('/surveys/:surveyId/responses/:responseId', async (c) => {
  try {
    const userId = c.req.header('x-user-id')
    const surveyId = c.req.param('surveyId')
    const responseId = c.req.param('responseId')

    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    // Check if user owns the survey
    const survey = await getSurvey(c.env.DB, surveyId)
    if (!survey || survey.user_id !== userId) {
      return c.json({ error: 'Forbidden' }, 403)
    }

    const response = await getResponse(c.env.DB, responseId)

    if (!response || response.survey_id !== surveyId) {
      return c.json({ error: 'Response not found' }, 404)
    }

    // Delete answers first, then response
    await deleteResponseAnswers(c.env.DB, responseId)
    await deleteResponse(c.env.DB, responseId)

    return c.json({ message: 'Response deleted' })
  } catch (error) {
    console.error('Delete response error:', error)
    return c.json({ error: 'Failed to delete response' }, 500)
  }
})

export default responsesRouter
