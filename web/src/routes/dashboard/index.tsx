import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useAuth } from '../../stores/authContext'
import type { Survey } from '../../types'
import { surveysApi } from '../../utils/api'

export const Route = createFileRoute('/dashboard/')({
  component: DashboardPage,
})

function DashboardPage() {
  const navigate = useNavigate()
  const { user, isLoading: authLoading } = useAuth()
  const [surveys, setSurveys] = useState<Survey[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (authLoading) return

    if (!user) {
      navigate({ to: '/auth/login' })
      return
    }

    fetchSurveys()
  }, [user, authLoading])

  const fetchSurveys = async () => {
    if (!user) return

    try {
      const data = await surveysApi.list(user.id)
      setSurveys(data.surveys || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load surveys')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateSurvey = async () => {
    if (!user) return

    try {
      const newSurvey = await surveysApi.create(user.id, {
        title: 'Untitled Survey',
      })
      navigate({
        to: '/dashboard/$surveyId/builder',
        params: { surveyId: newSurvey.survey.id },
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create survey')
    }
  }

  const handleDeleteSurvey = async (surveyId: string) => {
    if (!user || !confirm('Are you sure?')) return

    try {
      await surveysApi.delete(user.id, surveyId)
      setSurveys(surveys.filter((s) => s.id !== surveyId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete survey')
    }
  }

  if (isLoading) return <div>Loading...</div>

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Surveys</h1>
        <button
          onClick={handleCreateSurvey}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + New Survey
        </button>
      </div>

      {error && <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">{error}</div>}

      {surveys.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">You haven't created any surveys yet</p>
          <button
            onClick={handleCreateSurvey}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Create Your First Survey
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {surveys.map((survey) => (
            <div
              key={survey.id}
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition"
            >
              <h2 className="text-xl font-semibold mb-2">{survey.title}</h2>
              <p className="text-gray-600 mb-4 text-sm">{survey.description || 'No description'}</p>
              <div className="flex gap-2">
                <Link
                  to={`/dashboard/$surveyId/builder`}
                  params={{ surveyId: survey.id }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded text-center hover:bg-blue-700"
                >
                  Edit
                </Link>
                <Link
                  to={`/dashboard/$surveyId/responses`}
                  params={{ surveyId: survey.id }}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded text-center hover:bg-green-700"
                >
                  Responses
                </Link>
                <button
                  onClick={() => handleDeleteSurvey(survey.id)}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
