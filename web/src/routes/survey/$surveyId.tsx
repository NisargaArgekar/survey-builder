import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import type { Question, Survey } from '../../types'
import { questionsApi, responsesApi, surveysApi } from '../../utils/api'

export const Route = createFileRoute('/survey/$surveyId')({
  component: PublicSurveyPage,
})

function PublicSurveyPage() {
  const navigate = useNavigate()
  const { surveyId } = Route.useParams()
  const [survey, setSurvey] = useState<Survey | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  // Form state: { questionId: answer }
  const [answers, setAnswers] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchSurveyData()
  }, [surveyId])

  const fetchSurveyData = async () => {
    try {
      // Get survey (no auth needed for public surveys)
      const surveyData = await surveysApi.get('anonymous', surveyId)
      setSurvey(surveyData.survey)

      // Get questions
      const questionsData = await questionsApi.list(surveyId)
      setQuestions(questionsData.questions || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load survey')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      const submissionAnswers = questions.map((q) => ({
        question_id: q.id,
        answer_value: answers[q.id] || '',
      }))

      await responsesApi.submit(surveyId, submissionAnswers)
      setIsSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit response')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) return <div>Loading survey...</div>
  if (!survey) return <div>Survey not found</div>

  if (isSubmitted) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <div className="bg-green-100 border border-green-400 text-green-700 px-6 py-4 rounded">
          <h2 className="text-2xl font-bold mb-2">Thank You!</h2>
          <p>Your response has been submitted successfully.</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen py-8"
      style={{
        backgroundColor: survey.primary_color + '15',
      }}
    >
      <div className="max-w-2xl mx-auto">
        {/* Survey Header */}
        <div className="bg-white rounded-lg shadow p-8 mb-8">
          <div className="flex items-start gap-4 mb-4">
            {survey.logo_url && (
              <img src={survey.logo_url} alt="Logo" className="w-16 h-16 object-contain" />
            )}
            <div>
              <h1 className="text-3xl font-bold" style={{ color: survey.primary_color }}>
                {survey.title}
              </h1>
              {survey.description && <p className="text-gray-600 mt-2">{survey.description}</p>}
            </div>
          </div>
        </div>

        {error && <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">{error}</div>}

        {/* Survey Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {questions.map((question, index) => (
            <div key={question.id} className="bg-white rounded-lg shadow p-6">
              <label className="block font-semibold text-gray-900 mb-2">
                {index + 1}. {question.label}
                {question.is_required && <span className="text-red-600">*</span>}
              </label>

              {question.description && (
                <p className="text-gray-600 text-sm mb-4">{question.description}</p>
              )}

              {question.type === 'short_text' && (
                <input
                  type="text"
                  value={answers[question.id] || ''}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                  required={question.is_required}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Your answer..."
                />
              )}

              {question.type === 'long_text' && (
                <textarea
                  value={answers[question.id] || ''}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                  required={question.is_required}
                  rows={4}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Your answer..."
                />
              )}

              {question.type === 'email' && (
                <input
                  type="email"
                  value={answers[question.id] || ''}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                  required={question.is_required}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="your@email.com"
                />
              )}

              {question.type === 'multiple_choice' && question.options && (
                <div className="space-y-2">
                  {JSON.parse(question.options).map((option: string) => (
                    <label key={option} className="flex items-center">
                      <input
                        type="radio"
                        name={question.id}
                        value={option}
                        checked={answers[question.id] === option}
                        onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                        className="mr-2"
                      />
                      {option}
                    </label>
                  ))}
                </div>
              )}

              {question.type === 'rating' && (
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => handleAnswerChange(question.id, String(rating))}
                      className={`w-12 h-12 rounded-lg border-2 font-semibold ${
                        answers[question.id] === String(rating)
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-blue-600'
                      }`}
                    >
                      {rating}
                    </button>
                  ))}
                </div>
              )}

              {question.type === 'date' && (
                <input
                  type="date"
                  value={answers[question.id] || ''}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                  required={question.is_required}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}
            </div>
          ))}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full px-6 py-3 text-white font-semibold rounded-lg hover:opacity-90 disabled:opacity-50"
            style={{
              backgroundColor: survey.primary_color,
            }}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Survey'}
          </button>
        </form>
      </div>
    </div>
  )
}
