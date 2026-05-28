import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useAuth } from '../../../stores/authContext'
import type { Question, Survey } from '../../../types'
import { questionsApi, surveysApi } from '../../../utils/api'

export const Route = createFileRoute('/dashboard/$surveyId/builder')({
  component: SurveyBuilderPage,
})

function SurveyBuilderPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { surveyId } = Route.useParams()
  const [survey, setSurvey] = useState<Survey | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [title, setTitle] = useState('')
  const [primaryColor, setPrimaryColor] = useState('#007BFF')

  useEffect(() => {
    if (!user) return
    fetchSurvey()
  }, [user, surveyId])

  const fetchSurvey = async () => {
    if (!user) return

    try {
      const data = await surveysApi.get(user.id, surveyId)
      setSurvey(data.survey)
      setTitle(data.survey.title)
      setPrimaryColor(data.survey.primary_color)

      const questionsData = await questionsApi.list(surveyId)
      setQuestions(questionsData.questions || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load survey')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateSurvey = async () => {
    if (!user || !survey) return

    try {
      await surveysApi.update(user.id, survey.id, {
        title,
        primary_color: primaryColor,
      })
      setSurvey({ ...survey, title, primary_color: primaryColor })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update survey')
    }
  }

  const handleAddQuestion = async () => {
    if (!user || !survey) return

    try {
      const newQuestion = await questionsApi.create(user.id, survey.id, {
        type: 'short_text',
        label: 'New Question',
        order_index: questions.length,
      })
      setQuestions([...questions, newQuestion.question])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add question')
    }
  }

  const handleDeleteQuestion = async (questionId: string) => {
    if (!user || !survey) return

    try {
      await questionsApi.delete(user.id, survey.id, questionId)
      setQuestions(questions.filter((q) => q.id !== questionId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete question')
    }
  }

  if (isLoading) return <div>Loading survey...</div>
  if (!survey) return <div>Survey not found</div>

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-6">Survey Builder</h1>

        {error && <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">{error}</div>}

        {/* Survey Settings */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Survey Settings</h2>

          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-2">Survey Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-2">Primary Color</label>
            <input
              type="color"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="w-16 h-10 border rounded"
            />
          </div>

          <button
            onClick={handleUpdateSurvey}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Save Settings
          </button>
        </div>

        {/* Questions */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Questions</h2>
            <button
              onClick={handleAddQuestion}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              + Add Question
            </button>
          </div>

          {questions.length === 0 ? (
            <p className="text-gray-600">No questions yet. Add one to get started!</p>
          ) : (
            <div className="space-y-4">
              {questions.map((question, index) => (
                <div key={question.id} className="border p-4 rounded">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold">
                        {index + 1}. {question.label}
                      </p>
                      <p className="text-sm text-gray-600">{question.type}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteQuestion(question.id)}
                      className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mt-8">
          <button
            onClick={() => navigate({ to: '/dashboard' })}
            className="flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Back to Dashboard
          </button>
          <button
            onClick={() =>
              navigate({
                to: `/survey/$surveyId`,
                params: { surveyId: survey.id },
              })
            }
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Preview Survey
          </button>
        </div>
      </div>
    </div>
  )
}
