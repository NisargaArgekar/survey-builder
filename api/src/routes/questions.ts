import { Hono } from 'hono'
import {
  createQuestion,
  deleteQuestion,
  getQuestion,
  getSurvey,
  getSurveyQuestions,
  reorderQuestions,
  updateQuestion,
} from '../db/queries'
import type { CreateQuestionRequest } from '../types/index'
import { generateId } from '../utils/auth'

const questionsRouter = new Hono<{ Bindings: Env }>()

/**
 * POST /surveys/:surveyId/questions
 * Add a question to a survey
 */
questionsRouter.post('/surveys/:surveyId/questions', async (c) => {
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

    const data: CreateQuestionRequest = await c.req.json()

    if (!data.label || !data.type) {
      return c.json({ error: 'Label and type are required' }, 400)
    }

    // Get current question count to set order_index
    const existingQuestions = await getSurveyQuestions(c.env.DB, surveyId)
    const orderIndex = data.order_index ?? existingQuestions.length

    const questionId = generateId('question')
    const question = await createQuestion(
      c.env.DB,
      questionId,
      surveyId,
      data.type,
      data.label,
      data.description,
      orderIndex,
      data.is_required,
      data.options ? JSON.stringify(data.options) : undefined,
    )

    return c.json({ question }, 201)
  } catch (error) {
    console.error('Create question error:', error)
    return c.json({ error: 'Failed to create question' }, 500)
  }
})

/**
 * GET /surveys/:surveyId/questions
 * Get all questions for a survey
 */
questionsRouter.get('/surveys/:surveyId/questions', async (c) => {
  try {
    const surveyId = c.req.param('surveyId')
    const questions = await getSurveyQuestions(c.env.DB, surveyId)

    return c.json({ questions })
  } catch (error) {
    console.error('Get questions error:', error)
    return c.json({ error: 'Failed to fetch questions' }, 500)
  }
})

/**
 * PUT /surveys/:surveyId/questions/:questionId
 * Update a specific question
 */
questionsRouter.put('/surveys/:surveyId/questions/:questionId', async (c) => {
  try {
    const userId = c.req.header('x-user-id')
    const surveyId = c.req.param('surveyId')
    const questionId = c.req.param('questionId')

    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    // Check if user owns the survey
    const survey = await getSurvey(c.env.DB, surveyId)
    if (!survey || survey.user_id !== userId) {
      return c.json({ error: 'Forbidden' }, 403)
    }

    const question = await getQuestion(c.env.DB, questionId)

    if (!question || question.survey_id !== surveyId) {
      return c.json({ error: 'Question not found' }, 404)
    }

    const updates = await c.req.json()
    const updatedQuestion = await updateQuestion(c.env.DB, questionId, updates)

    return c.json({ question: updatedQuestion })
  } catch (error) {
    console.error('Update question error:', error)
    return c.json({ error: 'Failed to update question' }, 500)
  }
})

/**
 * DELETE /surveys/:surveyId/questions/:questionId
 * Delete a question
 */
questionsRouter.delete('/surveys/:surveyId/questions/:questionId', async (c) => {
  try {
    const userId = c.req.header('x-user-id')
    const surveyId = c.req.param('surveyId')
    const questionId = c.req.param('questionId')

    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    // Check if user owns the survey
    const survey = await getSurvey(c.env.DB, surveyId)
    if (!survey || survey.user_id !== userId) {
      return c.json({ error: 'Forbidden' }, 403)
    }

    const question = await getQuestion(c.env.DB, questionId)

    if (!question || question.survey_id !== surveyId) {
      return c.json({ error: 'Question not found' }, 404)
    }

    await deleteQuestion(c.env.DB, questionId)

    return c.json({ message: 'Question deleted' })
  } catch (error) {
    console.error('Delete question error:', error)
    return c.json({ error: 'Failed to delete question' }, 500)
  }
})

/**
 * PUT /surveys/:surveyId/questions/reorder
 * Reorder questions in a survey
 */
questionsRouter.put('/surveys/:surveyId/questions/reorder', async (c) => {
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

    const { questionIds } = await c.req.json()

    if (!Array.isArray(questionIds)) {
      return c.json({ error: 'questionIds must be an array' }, 400)
    }

    await reorderQuestions(c.env.DB, surveyId, questionIds)

    const questions = await getSurveyQuestions(c.env.DB, surveyId)

    return c.json({ questions })
  } catch (error) {
    console.error('Reorder questions error:', error)
    return c.json({ error: 'Failed to reorder questions' }, 500)
  }
})

export default questionsRouter
