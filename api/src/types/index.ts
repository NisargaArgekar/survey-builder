// User types
export interface User {
  id: string
  email: string
  name?: string
  created_at: string
}

// Survey types
export interface Survey {
  id: string
  user_id: string
  title: string
  description?: string
  primary_color: string
  logo_url?: string
  created_at: string
  updated_at: string
}

// Question types
export type QuestionType =
  | 'short_text'
  | 'long_text'
  | 'multiple_choice'
  | 'rating'
  | 'email'
  | 'date'

export interface Question {
  id: string
  survey_id: string
  type: QuestionType
  label: string
  description?: string
  order_index: number
  is_required: boolean
  options?: string // JSON array for multiple_choice
  created_at: string
}

// Response types
export interface Response {
  id: string
  survey_id: string
  respondent_id?: string
  submitted_at: string
}

export interface Answer {
  id: string
  response_id: string
  question_id: string
  answer_value: string
  created_at: string
}

// API Request/Response types
export interface CreateSurveyRequest {
  title: string
  description?: string
  primary_color?: string
  logo_url?: string
}

export interface UpdateSurveyRequest {
  title?: string
  description?: string
  primary_color?: string
  logo_url?: string
}

export interface CreateQuestionRequest {
  type: QuestionType
  label: string
  description?: string
  order_index: number
  is_required?: boolean
  options?: string[]
}

export interface SubmitResponseRequest {
  answers: Array<{
    question_id: string
    answer_value: string
  }>
}
