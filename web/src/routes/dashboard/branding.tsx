import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useAuth } from '../../stores/authContext'
import type { Survey } from '../../types'
import { surveysApi } from '../../utils/api'

export const Route = createFileRoute('/dashboard/branding')({
  component: BrandingPage,
})

function BrandingPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { surveyId } = Route.useParams()

  const [survey, setSurvey] = useState<Survey | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [primaryColor, setPrimaryColor] = useState('#007BFF')
  const [logoUrl, setLogoUrl] = useState('')

  useEffect(() => {
    if (!user) {
      navigate({ to: '/auth/login' })
      return
    }
    fetchSurvey()
  }, [surveyId, user])

  const fetchSurvey = async () => {
    try {
      const data = await surveysApi.get(user!.id, surveyId)
      setSurvey(data.survey)
      setPrimaryColor(data.survey.primary_color || '#007BFF')
      setLogoUrl(data.survey.logo_url || '')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load survey')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveBranding = async () => {
    if (!survey) return
    setIsSaving(true)
    setError('')
    setSuccess('')

    try {
      const updated = await surveysApi.update(user!.id, surveyId, {
        primary_color: primaryColor,
        logo_url: logoUrl,
      })
      setSurvey(updated.survey)
      setSuccess('Branding saved successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save branding')
    } finally {
      setIsSaving(false)
    }
  }

  const handleGoBack = () => {
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
      <div className="max-w-4xl mx-auto">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Controls */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Branding</h1>
              <p className="text-slate-600">Customize how your survey looks</p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <label className="block text-sm font-semibold text-slate-900 mb-3">
                Primary Color
              </label>
              <div className="flex gap-3">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-20 h-12 rounded-lg border border-slate-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  placeholder="#007BFF"
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>
              <p className="text-xs text-slate-500 mt-2">
                This color will be used for buttons, headers, and accents
              </p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <label className="block text-sm font-semibold text-slate-900 mb-3">Logo URL</label>
              <input
                type="url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://example.com/logo.png"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-slate-500 mt-2">
                Paste a URL to your logo (PNG, JPG, or SVG). It will appear at the top of your
                survey.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSaveBranding}
                disabled={isSaving}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition font-semibold"
              >
                {isSaving ? 'Saving...' : '💾 Save Branding'}
              </button>
              <button
                onClick={handleGoBack}
                className="flex-1 px-6 py-3 bg-slate-200 text-slate-900 rounded-lg hover:bg-slate-300 transition font-semibold"
              >
                ← Back
              </button>
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sticky top-8">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Preview</h2>
              <div
                className="rounded-lg border-2 border-slate-200 p-6 bg-white"
                style={{ borderTopColor: primaryColor, borderTopWidth: '4px' }}
              >
                {logoUrl && (
                  <div className="mb-4 flex items-center justify-center">
                    <img
                      src={logoUrl}
                      alt="Logo"
                      className="max-h-16 max-w-full object-contain"
                      onError={(e) => {
                        ;(e.target as HTMLImageElement).style.display = 'none'
                      }}
                    />
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-3">{survey?.title}</h3>
                    {survey?.description && (
                      <p className="text-slate-600 text-sm mb-4">{survey.description}</p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Sample Question
                      </label>
                      <input
                        type="text"
                        placeholder="What is your name?"
                        disabled
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Multiple Choice Example
                      </label>
                      <div className="space-y-2">
                        {['Option 1', 'Option 2', 'Option 3'].map((opt) => (
                          <label key={opt} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              disabled
                              className="w-4 h-4"
                              style={{ accentColor: primaryColor }}
                            />
                            <span className="text-sm text-slate-700">{opt}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <button
                      disabled
                      className="w-full py-2 rounded-lg text-white font-semibold transition"
                      style={{ backgroundColor: primaryColor }}
                    >
                      Submit
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
