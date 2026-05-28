/**
 * Database query helpers
 * Reusable functions for common database operations
 */

import type { Answer, Question, Response, Survey, User } from '../types'

// ========== USERS ==========
export async function createUser(
  db: D1Database,
  id: string,
  email: string,
  name: string,
  passwordHash: string,
): Promise<User> {
  await db
    .prepare('INSERT INTO users (id, email, name, password_hash) VALUES (?, ?, ?, ?)')
    .bind(id, email, name, passwordHash)
    .run()

  return { id, email, name, created_at: new Date().toISOString() }
}

export async function getUserByEmail(db: D1Database, email: string): Promise<User | null> {
  const result = await db.prepare('SELECT * FROM users WHERE email = ?').bind(email).first()
  return result as User | null
}

export async function getUser(db: D1Database, id: string): Promise<User | null> {
  const result = await db.prepare('SELECT * FROM users WHERE id = ?').bind(id).first()
  return result as User | null
}

// ========== SURVEYS ==========
export async function createSurvey(
  db: D1Database,
  id: string,
  userId: string,
  title: string,
  description?: string,
  primaryColor?: string,
  logoUrl?: string,
): Promise<Survey> {
  await db
    .prepare(
      'INSERT INTO surveys (id, user_id, title, description, primary_color, logo_url) VALUES (?, ?, ?, ?, ?, ?)',
    )
    .bind(id, userId, title, description || '', primaryColor || '#007BFF', logoUrl || '')
    .run()

  return {
    id,
    user_id: userId,
    title,
    description: description || '',
    primary_color: primaryColor || '#007BFF',
    logo_url: logoUrl || '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

export async function getSurvey(db: D1Database, id: string): Promise<Survey | null> {
  const result = await db.prepare('SELECT * FROM surveys WHERE id = ?').bind(id).first()
  return result as Survey | null
}

export async function getUserSurveys(db: D1Database, userId: string): Promise<Survey[]> {
  const result = await db
    .prepare('SELECT * FROM surveys WHERE user_id = ? ORDER BY created_at DESC')
    .bind(userId)
    .all()

  return (result.results as Survey[]) || []
}

export async function updateSurvey(
  db: D1Database,
  id: string,
  updates: Partial<Survey>,
): Promise<Survey | null> {
  const fields = []
  const values: any[] = []

  if (updates.title !== undefined) {
    fields.push('title = ?')
    values.push(updates.title)
  }
  if (updates.description !== undefined) {
    fields.push('description = ?')
    values.push(updates.description)
  }
  if (updates.primary_color !== undefined) {
    fields.push('primary_color = ?')
    values.push(updates.primary_color)
  }
  if (updates.logo_url !== undefined) {
    fields.push('logo_url = ?')
    values.push(updates.logo_url)
  }

  fields.push('updated_at = ?')
  values.push(new Date().toISOString())
  values.push(id)

  await db
    .prepare(`UPDATE surveys SET ${fields.join(', ')} WHERE id = ?`)
    .bind(...values)
    .run()

  return getSurvey(db, id)
}

export async function deleteSurvey(db: D1Database, id: string): Promise<void> {
  await db.prepare('DELETE FROM surveys WHERE id = ?').bind(id).run()
}

// ========== QUESTIONS ==========
export async function createQuestion(
  db: D1Database,
  id: string,
  surveyId: string,
  type: string,
  label: string,
  description?: string,
  orderIndex?: number,
  isRequired?: boolean,
  options?: string,
): Promise<Question> {
  await db
    .prepare(
      'INSERT INTO questions (id, survey_id, type, label, description, order_index, is_required, options) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    )
    .bind(
      id,
      surveyId,
      type,
      label,
      description || '',
      orderIndex ?? 0,
      isRequired ? 1 : 0,
      options || null,
    )
    .run()

  return {
    id,
    survey_id: surveyId,
    type: type as any,
    label,
    description: description || '',
    order_index: orderIndex ?? 0,
    is_required: isRequired ?? true,
    options,
    created_at: new Date().toISOString(),
  }
}

export async function getQuestion(db: D1Database, id: string): Promise<Question | null> {
  const result = await db.prepare('SELECT * FROM questions WHERE id = ?').bind(id).first()
  return result as Question | null
}

export async function getSurveyQuestions(db: D1Database, surveyId: string): Promise<Question[]> {
  const result = await db
    .prepare('SELECT * FROM questions WHERE survey_id = ? ORDER BY order_index ASC')
    .bind(surveyId)
    .all()

  return (result.results as Question[]) || []
}

export async function updateQuestion(
  db: D1Database,
  id: string,
  updates: Partial<Question>,
): Promise<Question | null> {
  const fields = []
  const values: any[] = []

  if (updates.label !== undefined) {
    fields.push('label = ?')
    values.push(updates.label)
  }
  if (updates.description !== undefined) {
    fields.push('description = ?')
    values.push(updates.description)
  }
  if (updates.type !== undefined) {
    fields.push('type = ?')
    values.push(updates.type)
  }
  if (updates.order_index !== undefined) {
    fields.push('order_index = ?')
    values.push(updates.order_index)
  }
  if (updates.is_required !== undefined) {
    fields.push('is_required = ?')
    values.push(updates.is_required ? 1 : 0)
  }
  if (updates.options !== undefined) {
    fields.push('options = ?')
    values.push(updates.options)
  }

  values.push(id)
  await db
    .prepare(`UPDATE questions SET ${fields.join(', ')} WHERE id = ?`)
    .bind(...values)
    .run()

  return getQuestion(db, id)
}

export async function deleteQuestion(db: D1Database, id: string): Promise<void> {
  await db.prepare('DELETE FROM questions WHERE id = ?').bind(id).run()
}

export async function reorderQuestions(
  db: D1Database,
  surveyId: string,
  questionIds: string[],
): Promise<void> {
  for (let i = 0; i < questionIds.length; i++) {
    await db
      .prepare('UPDATE questions SET order_index = ? WHERE id = ? AND survey_id = ?')
      .bind(i, questionIds[i], surveyId)
      .run()
  }
}

// ========== RESPONSES ==========
export async function createResponse(
  db: D1Database,
  id: string,
  surveyId: string,
  respondentId: string,
): Promise<Response> {
  await db
    .prepare('INSERT INTO responses (id, survey_id, respondent_id) VALUES (?, ?, ?)')
    .bind(id, surveyId, respondentId)
    .run()

  return {
    id,
    survey_id: surveyId,
    respondent_id: respondentId,
    submitted_at: new Date().toISOString(),
    answers: [],
  }
}

export async function getResponse(db: D1Database, id: string): Promise<Response | null> {
  const response = await db.prepare('SELECT * FROM responses WHERE id = ?').bind(id).first()

  if (!response) return null

  const answers = await db.prepare('SELECT * FROM answers WHERE response_id = ?').bind(id).all()

  return {
    ...(response as any),
    answers: (answers.results as Answer[]) || [],
  }
}

export async function getSurveyResponses(db: D1Database, surveyId: string): Promise<Response[]> {
  const responses = await db
    .prepare('SELECT * FROM responses WHERE survey_id = ? ORDER BY submitted_at DESC')
    .bind(surveyId)
    .all()

  const result: Response[] = []

  for (const response of responses.results || []) {
    const answers = await db
      .prepare('SELECT * FROM answers WHERE response_id = ?')
      .bind((response as any).id)
      .all()

    result.push({
      ...(response as any),
      answers: (answers.results as Answer[]) || [],
    })
  }

  return result
}

export async function deleteResponse(db: D1Database, id: string): Promise<void> {
  await db.prepare('DELETE FROM responses WHERE id = ?').bind(id).run()
}

// ========== ANSWERS ==========
export async function createAnswer(
  db: D1Database,
  id: string,
  responseId: string,
  questionId: string,
  answerValue: string,
): Promise<Answer> {
  await db
    .prepare('INSERT INTO answers (id, response_id, question_id, answer_value) VALUES (?, ?, ?, ?)')
    .bind(id, responseId, questionId, answerValue)
    .run()

  return {
    id,
    response_id: responseId,
    question_id: questionId,
    answer_value: answerValue,
    created_at: new Date().toISOString(),
  }
}

export async function deleteResponseAnswers(db: D1Database, responseId: string): Promise<void> {
  await db.prepare('DELETE FROM answers WHERE response_id = ?').bind(responseId).run()
}
