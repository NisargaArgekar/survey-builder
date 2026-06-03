import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useAuth } from '../../stores/authContext'
import type { Question, Response } from '../../types'
import { questionsApi, responsesApi } from '../../utils/api'
import { formatLocalDate, formatLocalDateTime } from '../../utils/date'

export const Route = createFileRoute('/dashboard/responses')({
  component: ResponsesPage,
})

function ResponsesPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { surveyId } = Route.useParams<{ surveyId: string }>()

  const [questions, setQuestions] = useState<Question[]>([])
  const [responses, setResponses] = useState<Response[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedResponse, setSelectedResponse] = useState<Response | null>(null)

  useEffect(() => {
    if (!user) {
      navigate({ to: '/auth/login' })
      return
    }
    fetchData()
  }, [surveyId, user])

  const fetchData = async () => {
    try {
      const [questionsData, responsesData] = await Promise.all([
        questionsApi.list(surveyId),
        responsesApi.list(user!.id, surveyId),
      ])

      setQuestions(questionsData.questions || [])
      setResponses(responsesData.responses || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load responses')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteResponse = async (responseId: string) => {
    if (!confirm('Delete this response?')) return

    try {
      await responsesApi.delete(user!.id, surveyId, responseId)
      setResponses(responses.filter((r) => r.id !== responseId))
      setSelectedResponse(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete response')
    }
  }

  const getAnswerForQuestion = (response: Response, questionId: string) => {
    return response.answers.find((a) => a.question_id === questionId)?.answer_value || '-'
  }

  const getQuestionLabel = (questionId: string) => {
    return questions.find((q) => q.id === questionId)?.label || 'Unknown Question'
  }

  const goBack = () => {
    navigate({
      to: '/dashboard/$surveyId/builder',
      params: { surveyId },
    })
  }

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Header */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Survey Responses</h1>
              <p className="text-slate-600 mt-1">{responses.length} response{responses.length !== 1 ? 's' : ''}</p>
            </div>
            <button
              onClick={goBack}
              className="px-4 py-2 bg-slate-200 text-slate-900 rounded-lg hover:bg-slate-300 transition font-semibold"
            >
              ← Back to Builder
            </button>
          </div>
        </div>

        {responses.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <p className="text-slate-600 text-lg">No responses yet</p>
            <p className="text-slate-500 text-sm mt-2">Share your survey link to start collecting responses</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Responses List */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-200 bg-slate-50">
                  <h2 className="font-semibold text-slate-900">All Responses</h2>
                </div>
                <div className="divide-y max-h-96 overflow-y-auto">
                  {responses.map((response, idx) => (
                    <button
                      key={response.id}
                      onClick={() => setSelectedResponse(response)}
                      className={`w-full text-left p-3 hover:bg-blue-50 transition ${
                        selectedResponse?.id === response.id ? 'bg-blue-100' : ''
                      }`}
                    >
                      <div className="font-semibold text-slate-900">Response #{idx + 1}</div>
                      <div className="text-xs text-slate-500 mt-1">
                        {formatLocalDateTime(response.submitted_at)}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Response Details */}
            <div className="lg:col-span-2">
              {selectedResponse ? (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                    <div>
                      <h2 className="font-semibold text-slate-900">Response Details</h2>
                      <p className="text-xs text-slate-500 mt-1">
                        {formatLocalDateTime(selectedResponse.submitted_at)}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteResponse(selectedResponse.id)}
                      className="px-3 py-2 text-red-600 hover:bg-red-50 rounded transition font-semibold text-sm"
                    >
                      🗑️ Delete
                    </button>
                  </div>

                  <div className="p-6 space-y-4">
                    {questions.map((question) => {
                      const answer = getAnswerForQuestion(selectedResponse, question.id)
                      return (
                        <div key={question.id} className="pb-4 border-b border-slate-200 last:border-b-0">
                          <div className="font-semibold text-slate-900 mb-2">{question.label}</div>
                          <div className="text-slate-700 bg-slate-50 p-3 rounded-lg break-words">
                            {answer === '-' ? (
                              <span className="text-slate-500 italic">No answer provided</span>
                            ) : (
                              answer
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
                  <p className="text-slate-600">Select a response to view details</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
