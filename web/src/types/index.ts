// Mirror the backend types
export type QuestionType =
  | 'short_text'
  | 'long_text'
  | 'multiple_choice'
  | 'rating'
  | 'email'
  | 'date'

export interface User {
  id: string
  email: string
  name?: string
  created_at: string
}

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

export interface Question {
  id: string
  survey_id: string
  type: QuestionType
  label: string
  description?: string
  order_index: number
  is_required: boolean
  options?: string
  created_at: string
}

export interface Response {
  id: string
  survey_id: string
  respondent_id?: string
  submitted_at: string
  answers: Answer[]
}

export interface Answer {
  id: string
  response_id: string
  question_id: string
  answer_value: string
  created_at: string
}

// Auth context
export interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, name: string, password: string) => Promise<void>
  logout: () => void
}
