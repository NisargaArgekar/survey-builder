/**
 * API client utilities
 * Centralized fetch wrapper for all API calls
 */

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
  }
}

interface FetchOptions extends RequestInit {
  skipJson?: boolean
}

/**
 * Get authorization headers with user ID
 */
function getAuthHeaders(): Record<string, string> {
  const user = localStorage.getItem('user')
  if (user) {
    try {
      const { id } = JSON.parse(user)
      return { 'x-user-id': id }
    } catch {}
  }
  return {}
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

/**
 * Wrapper around fetch that handles errors and JSON parsing
 */
export async function apiCall(url: string, options: FetchOptions = {}): Promise<any> {
  const { skipJson = false, ...fetchOptions } = options

  const method = (fetchOptions.method || 'GET').toString().toUpperCase()
  const start = performance.now()

  try {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...fetchOptions,
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
        ...(fetchOptions.headers || {}),
      },
    })

    const duration = performance.now() - start
    console.debug(`[API] ${method} ${url} -> ${response.status} (${duration.toFixed(1)}ms)`) 

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new ApiError(response.status, error.error || 'API error')
    }

    if (skipJson) {
      return response
    }

    const json = await response.json()
    console.debug(`[API] ${method} ${url} JSON parsed (${duration.toFixed(1)}ms)`)
    return json
  } catch (error) {
    const duration = performance.now() - start
    console.debug(`[API] ${method} ${url} ERROR (${duration.toFixed(1)}ms):`, error)
    if (error instanceof ApiError) {
      throw error
    }
    throw new Error(`Failed to fetch ${url}: ${String(error)}`)
  }
}

// Auth API calls
export const authApi = {
  signup: async (email: string, name: string, password: string) => {
    return apiCall('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, name, password }),
    })
  },

  login: async (email: string, password: string) => {
    return apiCall('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  },

  me: async (userId: string) => {
    return apiCall('/api/auth/me')
  },
}

// Surveys API calls
export const surveysApi = {
  list: async (userId: string) => {
    return apiCall('/api/surveys')
  },

  create: async (userId: string, data: Record<string, unknown>) => {
    return apiCall('/api/surveys', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  get: async (userId: string, surveyId: string) => {
    return apiCall(`/api/surveys/${surveyId}`)
  },

  update: async (userId: string, surveyId: string, data: Record<string, unknown>) => {
    return apiCall(`/api/surveys/${surveyId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  delete: async (userId: string, surveyId: string) => {
    return apiCall(`/api/surveys/${surveyId}`, {
      method: 'DELETE',
    })
  },
}

// Questions API calls
export const questionsApi = {
  create: async (userId: string, surveyId: string, data: Record<string, unknown>) => {
    return apiCall(`/api/surveys/${surveyId}/questions`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  list: async (surveyId: string) => {
    return apiCall(`/api/surveys/${surveyId}/questions`)
  },

  update: async (userId: string, surveyId: string, questionId: string, data: Record<string, unknown>) => {
    return apiCall(`/api/surveys/${surveyId}/questions/${questionId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  delete: async (userId: string, surveyId: string, questionId: string) => {
    return apiCall(`/api/surveys/${surveyId}/questions/${questionId}`, {
      method: 'DELETE',
    })
  },

  reorder: async (userId: string, surveyId: string, questionIds: string[]) => {
    return apiCall(`/api/surveys/${surveyId}/questions/reorder`, {
      method: 'PUT',
      body: JSON.stringify({ questionIds }),
    })
  },
}

// Responses API calls
export const responsesApi = {
  submit: async (surveyId: string, answers: Array<Record<string, string>>) => {
    return apiCall(`/api/surveys/${surveyId}/responses`, {
      method: 'POST',
      body: JSON.stringify({ answers }),
    })
  },

  list: async (userId: string, surveyId: string) => {
    return apiCall(`/api/surveys/${surveyId}/responses`)
  },

  get: async (userId: string, surveyId: string, responseId: string) => {
    return apiCall(`/api/surveys/${surveyId}/responses/${responseId}`)
  },

  delete: async (userId: string, surveyId: string, responseId: string) => {
    return apiCall(`/api/surveys/${surveyId}/responses/${responseId}`, {
      method: 'DELETE',
    })
  },
}
