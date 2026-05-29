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

  if (isLoading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Loading survey...</p>
      </div>
    )
  if (!survey)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Survey not found</p>
      </div>
    )

  if (isSubmitted) {
    return (
      <div
        className="min-h-screen flex items-center justify-center py-12 px-4"
        style={{
          backgroundColor: survey.primary_color + '15',
        }}
      >
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-12 text-center">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Thank You!</h2>
            <p className="text-gray-600 mb-6">Your response has been submitted successfully.</p>
            <p className="text-sm text-gray-500">We appreciate your feedback!</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen py-12 px-4"
      style={{
        backgroundColor: survey.primary_color + '10',
      }}
    >
      <div className="max-w-2xl mx-auto">
        {/* Survey Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-8">
          <div className="flex items-start gap-4 mb-4">
            {survey.logo_url && (
              <img src={survey.logo_url} alt="Logo" className="w-20 h-20 object-contain flex-shrink-0" />
            )}
            <div className="flex-1">
              <h1 className="text-4xl font-bold" style={{ color: survey.primary_color }}>
                {survey.title}
              </h1>
              {survey.description && <p className="text-gray-600 mt-3 text-lg">{survey.description}</p>}
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Survey Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {questions.map((question, index) => (
            <div key={question.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
              <label className="block font-semibold text-gray-900 mb-3 text-lg">
                {index + 1}. {question.label}
                {question.is_required && <span className="text-red-600 ml-1">*</span>}
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
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="Your answer..."
                />
              )}

              {question.type === 'long_text' && (
                <textarea
                  value={answers[question.id] || ''}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                  required={question.is_required}
                  rows={5}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="Your answer..."
                />
              )}

              {question.type === 'email' && (
                <input
                  type="email"
                  value={answers[question.id] || ''}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                  required={question.is_required}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="you@example.com"
                />
              )}

              {question.type === 'multiple_choice' && question.options && (
                <div className="space-y-3">
                  {JSON.parse(question.options).map((option: string) => (
                    <label key={option} className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition">
                      <input
                        type="radio"
                        name={question.id}
                        value={option}
                        checked={answers[question.id] === option}
                        onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                        className="w-4 h-4 cursor-pointer"
                      />
                      <span className="ml-3 text-gray-900 font-medium">{option}</span>
                    </label>
                  ))}
                </div>
              )}

              {question.type === 'rating' && (
                <div className="flex gap-3 justify-center">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => handleAnswerChange(question.id, String(rating))}
                      className={`w-14 h-14 rounded-full border-2 font-bold text-lg transition ${
                        answers[question.id] === String(rating)
                          ? `text-white border-0`
                          : 'bg-white text-gray-700 border-gray-300 hover:border-blue-500'
                      }`}
                      style={
                        answers[question.id] === String(rating)
                          ? {
                              backgroundColor: survey.primary_color,
                            }
                          : {}
                      }
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
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              )}
            </div>
          ))}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full px-6 py-3.5 text-white font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 transition text-lg"
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
