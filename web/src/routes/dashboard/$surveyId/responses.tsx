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
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="mx-auto max-w-5xl">
        <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl mb-10">
          <div className="h-2 bg-gradient-to-r from-emerald-500 via-sky-500 to-indigo-500" />
          <div className="p-8 lg:p-10">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Survey Responses</h1>
                <p className="text-slate-600 mt-2">{responses.length} response{responses.length !== 1 ? 's' : ''}</p>
              </div>
              <div className="flex flex-wrap gap-3">
                {responses.length > 0 && (
                  <button
                    onClick={handleExportCSV}
                    className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700"
                  >
                    Export CSV
                  </button>
                )}
                <button
                  onClick={() => navigate({ to: '/dashboard' })}
                  className="inline-flex items-center justify-center rounded-full bg-slate-200 px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-300"
                >
                  Back
                </button>
              </div>
            </div>
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
                className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm transition hover:shadow-lg"
              >
                <div className="flex flex-col gap-4 p-6 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-slate-900">Response #{responses.length - responseIndex}</h3>
                    <p className="text-sm text-slate-600 mt-1">
                      {new Date(response.submitted_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() =>
                        setExpandedResponseId(
                          expandedResponseId === response.id ? null : response.id,
                        )
                      }
                      className="inline-flex items-center justify-center rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
                    >
                      {expandedResponseId === response.id ? 'Hide details' : 'View details'}
                    </button>
                    <button
                      onClick={() => handleDeleteResponse(response.id)}
                      className="inline-flex items-center justify-center rounded-full bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {expandedResponseId === response.id && (
                  <div className="border-t border-slate-200 bg-slate-50 p-6 space-y-4">
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
