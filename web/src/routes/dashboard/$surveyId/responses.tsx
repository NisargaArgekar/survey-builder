import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useAuth } from '../../../stores/authContext'
import type { Question, Response } from '../../../types'
import { questionsApi, responsesApi } from '../../../utils/api'

export const Route = createFileRoute('/dashboard/$surveyId/responses')({
  component: ResponsesPage,
})

function ResponsesPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { surveyId } = Route.useParams()
  const [responses, setResponses] = useState<Response[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedResponseId, setExpandedResponseId] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    fetchData()
  }, [user, surveyId])

  const fetchData = async () => {
    if (!user) return

    try {
      const [responseData, questionsData] = await Promise.all([
        responsesApi.list(user.id, surveyId),
        questionsApi.list(surveyId),
      ])
      setResponses(responseData.responses || [])
      setQuestions(questionsData.questions || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load responses')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteResponse = async (responseId: string) => {
    if (!user || !confirm('Delete this response?')) return

    try {
      await responsesApi.delete(user.id, surveyId, responseId)
      setResponses(responses.filter((r) => r.id !== responseId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete response')
    }
  }

  const getQuestionLabel = (questionId: string) => {
    return questions.find((q) => q.id === questionId)?.label || `Question ${questionId}`
  }

  const getQuestionType = (questionId: string) => {
    return questions.find((q) => q.id === questionId)?.type || 'unknown'
  }

  const handleExportCSV = () => {
    if (questions.length === 0 || responses.length === 0) return

    // Create CSV header
    const headers = ['Response ID', 'Submitted At', ...questions.map((q) => q.label)]
    const rows = responses.map((response) => [
      response.id,
      new Date(response.submitted_at).toLocaleString(),
      ...questions.map((q) => {
        const answer = response.answers.find((a) => a.question_id === q.id)
        return answer?.answer_value || ''
      }),
    ])

    // Convert to CSV
    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n')

    // Download
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `responses-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  if (isLoading)
    return <div className="flex items-center justify-center min-h-screen">Loading responses...</div>

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Survey Responses</h1>
            <p className="text-gray-600 mt-2">{responses.length} response{responses.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex gap-2">
            {responses.length > 0 && (
              <button
                onClick={handleExportCSV}
                className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition"
              >
                Export CSV
              </button>
            )}
            <button
              onClick={() => navigate({ to: '/dashboard' })}
              className="px-4 py-2 bg-gray-200 text-gray-900 font-semibold rounded-lg hover:bg-gray-300 transition"
            >
              Back
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {responses.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <p className="text-gray-600 text-lg">No responses yet</p>
            <p className="text-gray-500 mt-2">Responses will appear here once someone submits your survey</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Analytics Summary */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <p className="text-sm text-gray-600 font-semibold">Total Responses</p>
                <p className="text-3xl font-bold text-blue-600">{responses.length}</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <p className="text-sm text-gray-600 font-semibold">Questions</p>
                <p className="text-3xl font-bold text-blue-600">{questions.length}</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <p className="text-sm text-gray-600 font-semibold">Last Response</p>
                <p className="text-sm font-semibold text-gray-900">
                  {new Date(responses[responses.length - 1].submitted_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Responses List */}
            {responses.map((response, responseIndex) => (
              <div
                key={response.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition"
              >
                <button
                  onClick={() =>
                    setExpandedResponseId(
                      expandedResponseId === response.id ? null : response.id,
                    )
                  }
                  className="w-full p-6 flex justify-between items-center hover:bg-gray-50 transition"
                >
                  <div className="text-left flex-1">
                    <h3 className="font-semibold text-gray-900">
                      Response #{responses.length - responseIndex}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {new Date(response.submitted_at).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteResponse(response.id)
                    }}
                    className="px-3 py-1 bg-red-100 text-red-600 text-sm font-semibold rounded-lg hover:bg-red-200 transition"
                  >
                    Delete
                  </button>
                </button>

                {expandedResponseId === response.id && (
                  <div className="border-t border-gray-200 p-6 bg-gray-50 space-y-4">
                    {response.answers.length === 0 ? (
                      <p className="text-gray-600">No answers recorded</p>
                    ) : (
                      response.answers.map((answer) => {
                        const question = questions.find((q) => q.id === answer.question_id)
                        const questionIndex = question
                          ? questions.findIndex((q) => q.id === question.id) + 1
                          : '?'

                        return (
                          <div key={answer.id} className="bg-white rounded-lg p-4">
                            <p className="text-sm text-gray-600 mb-1">
                              Question {questionIndex} • {getQuestionType(answer.question_id)}
                            </p>
                            <p className="font-semibold text-gray-900 mb-2">
                              {getQuestionLabel(answer.question_id)}
                            </p>
                            <p className="text-gray-700 break-words">{answer.answer_value || '(empty)'}</p>
                          </div>
                        )
                      })
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
        </div>
      )}
    </div>
  )
}
