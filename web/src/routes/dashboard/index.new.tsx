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
    if (!user || !confirm('Delete this survey? This action cannot be undone.')) return

    try {
      await surveysApi.delete(user.id, surveyId)
      setSurveys(surveys.filter((s) => s.id !== surveyId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete survey')
    }
  }

  if (isLoading)
    return <div className="flex items-center justify-center min-h-screen">Loading surveys...</div>

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">My Surveys</h1>
            <p className="text-gray-600 mt-2">{surveys.length} survey{surveys.length !== 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={handleCreateSurvey}
            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition shadow-sm"
          >
            + Create Survey
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {surveys.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-5xl mb-4">📋</div>
            <p className="text-gray-600 text-lg font-semibold mb-2">No surveys yet</p>
            <p className="text-gray-500 mb-6">Create your first survey to get started</p>
            <button
              onClick={handleCreateSurvey}
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
            >
              Create Your First Survey
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {surveys.map((survey) => (
              <div
                key={survey.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition group"
              >
                <div
                  className="h-2"
                  style={{
                    backgroundColor: survey.primary_color,
                  }}
                />

                <div className="p-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                    {survey.title}
                  </h2>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {survey.description || 'No description'}
                  </p>

                  <div className="space-y-3">
                    <Link
                      to={`/dashboard/$surveyId/builder`}
                      params={{ surveyId: survey.id }}
                      className="block px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-center font-semibold hover:bg-blue-100 transition"
                    >
                      Edit
                    </Link>
                    <Link
                      to={`/dashboard/$surveyId/responses`}
                      params={{ surveyId: survey.id }}
                      className="block px-4 py-2 bg-green-50 text-green-600 rounded-lg text-center font-semibold hover:bg-green-100 transition"
                    >
                      Responses
                    </Link>
                    <button
                      onClick={() => handleDeleteSurvey(survey.id)}
                      className="w-full px-4 py-2 bg-red-50 text-red-600 rounded-lg font-semibold hover:bg-red-100 transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
