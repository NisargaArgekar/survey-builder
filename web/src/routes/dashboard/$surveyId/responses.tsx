import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useAuth } from '../../../stores/authContext'
import type { Response } from '../../../types'
import { responsesApi } from '../../../utils/api'

export const Route = createFileRoute('/dashboard/$surveyId/responses')({
  component: ResponsesPage,
})

function ResponsesPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { surveyId } = Route.useParams()
  const [responses, setResponses] = useState<Response[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) return
    fetchResponses()
  }, [user, surveyId])

  const fetchResponses = async () => {
    if (!user) return

    try {
      const data = await responsesApi.list(user.id, surveyId)
      setResponses(data.responses || [])
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

  if (isLoading) return <div>Loading responses...</div>

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Survey Responses</h1>
        <button
          onClick={() => navigate({ to: '/dashboard' })}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          Back to Dashboard
        </button>
      </div>

      {error && <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">{error}</div>}

      {responses.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600">No responses yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-gray-600 mb-4">
            Total responses: <strong>{responses.length}</strong>
          </p>

          {responses.map((response, index) => (
            <div key={response.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold">Response #{index + 1}</h3>
                  <p className="text-sm text-gray-600">
                    Submitted: {new Date(response.submitted_at).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteResponse(response.id)}
                  className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                >
                  Delete
                </button>
              </div>

              <div className="space-y-2">
                {response.answers.map((answer) => (
                  <div key={answer.id} className="text-sm">
                    <p className="font-semibold text-gray-700">Question: {answer.question_id}</p>
                    <p className="text-gray-600">{answer.answer_value}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
