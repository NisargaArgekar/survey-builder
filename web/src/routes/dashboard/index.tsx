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
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="mx-auto max-w-6xl">
        <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl mb-10">
            <div className="h-2 bg-black" />
            <div className="p-8 lg:p-10">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h1 className="text-4xl font-bold text-black">My Surveys</h1>
                  <p className="text-slate-600 mt-2">{surveys.length} survey{surveys.length !== 1 ? 's' : ''}</p>
                </div>
                <button
                  onClick={handleCreateSurvey}
                  className="inline-flex items-center justify-center rounded-full bg-black px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 transition hover:bg-slate-900"
                >
                  + Create Survey
                </button>
              </div>
            </div>
          </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {surveys.length === 0 ? (
          <div className="bg-white rounded-[1.75rem] border border-slate-200 p-14 text-center shadow-sm">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-100 text-4xl">📋</div>
            <p className="text-slate-700 text-xl font-semibold mb-2">No surveys yet</p>
            <p className="text-slate-500 mb-6">Create your first survey to get started.</p>
            <button
              onClick={handleCreateSurvey}
              className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 transition hover:bg-slate-800"
            >
              Create Your First Survey
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {surveys.map((survey) => (
              <div
                key={survey.id}
                className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm transition hover:shadow-lg"
              >
                <div
                  className="h-2"
                  style={{
                    backgroundColor: survey.primary_color,
                  }}
                />

                <div className="p-6">
                  <h2 className="text-xl font-bold text-slate-900 mb-2 line-clamp-2">
                    {survey.title}
                  </h2>
                  <p className="text-sm text-slate-600 mb-5 line-clamp-2">
                    {survey.description || 'No description'}
                  </p>

                  <div className="space-y-2">
                    <Link
                      to="/dashboard/$surveyId/builder"
                      params={{ surveyId: survey.id }}
                      className="block rounded-full border border-slate-200 bg-slate-50 px-4 py-3 text-center text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
                    >
                      ✏️ Edit
                    </Link>
                    <Link
                      to="/dashboard/$surveyId/responses"
                      params={{ surveyId: survey.id }}
                      className="block rounded-full border border-slate-200 bg-slate-50 px-4 py-3 text-center text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
                    >
                      📊 Responses
                    </Link>
                    <button
                      onClick={() => {
                        const url = `${window.location.origin}/survey/${survey.id}`
                        navigator.clipboard.writeText(url)
                        alert('Survey link copied to clipboard!')
                      }}
                      className="w-full rounded-full border border-slate-200 bg-slate-50 px-4 py-3 text-center text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
                    >
                      🔗 Copy Link
                    </button>
                    <button
                      onClick={() => handleDeleteSurvey(survey.id)}
                      className="w-full rounded-full border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
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
