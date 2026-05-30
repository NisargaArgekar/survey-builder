import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useAuth } from '../../stores/authContext'
import type { Question, QuestionType, Survey } from '../../types'
import { questionsApi, surveysApi } from '../../utils/api'

const QUESTION_TYPES: { value: QuestionType; label: string }[] = [
  { value: 'short_text', label: 'Short Text' },
  { value: 'long_text', label: 'Long Text' },
  { value: 'multiple_choice', label: 'Multiple Choice' },
  { value: 'rating', label: '1-5 Rating' },
  { value: 'email', label: 'Email' },
  { value: 'date', label: 'Date' },
]

export const Route = createFileRoute('/dashboard/builder')({
  component: SurveyBuilderPage,
})

interface EditingQuestion extends Question {
  optionsArray?: string[]
}

function SurveyBuilderPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { surveyId } = Route.useParams()

  const [survey, setSurvey] = useState<Survey | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<EditingQuestion | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!user) {
      navigate({ to: '/auth/login' })
      return
    }
    fetchSurveyData()
  }, [surveyId, user])

  const fetchSurveyData = async () => {
    try {
      const surveyData = await surveysApi.get(user!.id, surveyId)
      setSurvey(surveyData.survey)

      const questionsData = await questionsApi.list(surveyId)
      setQuestions(questionsData.questions || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load survey')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddQuestion = async () => {
    if (!survey) return
    setIsSaving(true)
    try {
      const newQuestion = await questionsApi.create(user!.id, surveyId, {
        type: 'short_text',
        label: 'New Question',
        is_required: true,
        order_index: questions.length,
      })
      setQuestions([...questions, newQuestion.question])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add question')
    } finally {
      setIsSaving(false)
    }
  }

  const handleEditQuestion = (question: Question) => {
    setEditingQuestionId(question.id)
    setEditForm({
      ...question,
      optionsArray: question.options ? JSON.parse(question.options) : [],
    })
  }

  const handleSaveQuestion = async () => {
    if (!editForm || !editingQuestionId) return
    setIsSaving(true)
    try {
      const updateData: Record<string, any> = {
        label: editForm.label,
        description: editForm.description,
        type: editForm.type,
        is_required: editForm.is_required,
      }

      if (editForm.type === 'multiple_choice' && editForm.optionsArray) {
        updateData.options = JSON.stringify(editForm.optionsArray)
      }

      const result = await questionsApi.update(user!.id, surveyId, editingQuestionId, updateData)

      setQuestions(
        questions.map((q) => (q.id === editingQuestionId ? result.question : q))
      )
      setEditingQuestionId(null)
      setEditForm(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save question')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('Delete this question?')) return
    setIsSaving(true)
    try {
      await questionsApi.delete(user!.id, surveyId, questionId)
      setQuestions(questions.filter((q) => q.id !== questionId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete question')
    } finally {
      setIsSaving(false)
    }
  }

  const handleMoveQuestion = async (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= questions.length) return

    const newOrder = [...questions]
    ;[newOrder[index], newOrder[newIndex]] = [newOrder[newIndex], newOrder[index]]

    try {
      const questionIds = newOrder.map((q) => q.id)
      await questionsApi.reorder(user!.id, surveyId, questionIds)
      setQuestions(newOrder)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reorder')
    }
  }

  const handleBranding = () => {
    navigate({
      to: '/dashboard/$surveyId/branding',
      params: { surveyId },
    })
  }

  const handleViewResponses = () => {
    navigate({
      to: '/dashboard/$surveyId/responses',
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

        {survey && (
          <>
            {/* Header */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900">{survey.title}</h1>
                  <p className="text-slate-600 mt-1">{questions.length} questions</p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleBranding}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-semibold text-sm"
                  >
                    🎨 Branding
                  </button>
                  <button
                    onClick={handleViewResponses}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold text-sm"
                  >
                    📊 Responses
                  </button>
                </div>
              </div>
            </div>

            {/* Questions List */}
            <div className="space-y-4">
              {questions.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
                  <p className="text-slate-600 mb-4">No questions yet</p>
                  <button
                    onClick={handleAddQuestion}
                    disabled={isSaving}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition font-semibold"
                  >
                    + Add First Question
                  </button>
                </div>
              ) : (
                <>
                  {questions.map((question, index) => (
                    <div
                      key={question.id}
                      className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
                    >
                      {editingQuestionId === question.id && editForm ? (
                        // Edit Mode
                        <div className="p-6 bg-blue-50 border-l-4 border-blue-500">
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-semibold text-slate-900 mb-2">
                                Question Type
                              </label>
                              <select
                                value={editForm.type}
                                onChange={(e) =>
                                  setEditForm({
                                    ...editForm,
                                    type: e.target.value as QuestionType,
                                  })
                                }
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                {QUESTION_TYPES.map((t) => (
                                  <option key={t.value} value={t.value}>
                                    {t.label}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-sm font-semibold text-slate-900 mb-2">
                                Question
                              </label>
                              <input
                                type="text"
                                value={editForm.label}
                                onChange={(e) =>
                                  setEditForm({ ...editForm, label: e.target.value })
                                }
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter question text"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-semibold text-slate-900 mb-2">
                                Description
                              </label>
                              <input
                                type="text"
                                value={editForm.description || ''}
                                onChange={(e) =>
                                  setEditForm({ ...editForm, description: e.target.value })
                                }
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Optional description"
                              />
                            </div>

                            {editForm.type === 'multiple_choice' && (
                              <div>
                                <label className="block text-sm font-semibold text-slate-900 mb-2">
                                  Options (one per line)
                                </label>
                                <textarea
                                  value={editForm.optionsArray?.join('\n') || ''}
                                  onChange={(e) =>
                                    setEditForm({
                                      ...editForm,
                                      optionsArray: e.target.value
                                        .split('\n')
                                        .filter((o) => o.trim()),
                                    })
                                  }
                                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  rows={4}
                                  placeholder="Option 1&#10;Option 2&#10;Option 3"
                                />
                              </div>
                            )}

                            <label className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={editForm.is_required}
                                onChange={(e) =>
                                  setEditForm({ ...editForm, is_required: e.target.checked })
                                }
                                className="w-4 h-4 rounded border-slate-300"
                              />
                              <span className="text-sm font-medium text-slate-700">Required</span>
                            </label>

                            <div className="flex gap-2 pt-2">
                              <button
                                onClick={handleSaveQuestion}
                                disabled={isSaving}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition font-semibold"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => {
                                  setEditingQuestionId(null)
                                  setEditForm(null)
                                }}
                                className="flex-1 px-4 py-2 bg-slate-300 text-slate-900 rounded-lg hover:bg-slate-400 transition font-semibold"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        // View Mode
                        <div className="p-6 flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="text-sm font-semibold text-slate-500">
                                Q{index + 1}
                              </span>
                              <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs font-semibold">
                                {QUESTION_TYPES.find((t) => t.value === question.type)?.label ||
                                  question.type}
                              </span>
                              {question.is_required && (
                                <span className="text-red-600 font-bold">*</span>
                              )}
                            </div>
                            <p className="text-lg font-semibold text-slate-900">
                              {question.label}
                            </p>
                            {question.description && (
                              <p className="text-slate-600 text-sm mt-1">{question.description}</p>
                            )}
                            {question.type === 'multiple_choice' && question.options && (
                              <div className="mt-3 space-y-2">
                                {JSON.parse(question.options).map((opt: string) => (
                                  <div key={opt} className="flex items-center gap-2 text-slate-700">
                                    <input
                                      type="radio"
                                      disabled
                                      className="w-4 h-4"
                                    />
                                    <span>{opt}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="flex gap-2 ml-4">
                            {index > 0 && (
                              <button
                                onClick={() => handleMoveQuestion(index, 'up')}
                                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition"
                                title="Move up"
                              >
                                ⬆️
                              </button>
                            )}
                            {index < questions.length - 1 && (
                              <button
                                onClick={() => handleMoveQuestion(index, 'down')}
                                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition"
                                title="Move down"
                              >
                                ⬇️
                              </button>
                            )}
                            <button
                              onClick={() => handleEditQuestion(question)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded transition"
                              title="Edit"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleDeleteQuestion(question.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                              title="Delete"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  <button
                    onClick={handleAddQuestion}
                    disabled={isSaving}
                    className="w-full px-6 py-3 border-2 border-dashed border-slate-300 text-slate-700 rounded-lg hover:border-blue-500 hover:bg-blue-50 disabled:opacity-50 transition font-semibold"
                  >
                    + Add Question
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
