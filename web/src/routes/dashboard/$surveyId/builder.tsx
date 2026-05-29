import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useAuth } from '../../../stores/authContext'
import type { Question, QuestionType, Survey } from '../../../types'
import { questionsApi, surveysApi } from '../../../utils/api'

export const Route = createFileRoute('/dashboard/$surveyId/builder')({
  component: SurveyBuilderPage,
})

const QUESTION_TYPES: { value: QuestionType; label: string }[] = [
  { value: 'short_text', label: 'Short Text' },
  { value: 'long_text', label: 'Long Text' },
  { value: 'multiple_choice', label: 'Multiple Choice' },
  { value: 'rating', label: '1-5 Rating' },
  { value: 'email', label: 'Email' },
  { value: 'date', label: 'Date' },
]

interface QuestionEditState extends Question {
  editingOptions?: string
}

function SurveyBuilderPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { surveyId } = Route.useParams()
  const [survey, setSurvey] = useState<Survey | null>(null)
  const [questions, setQuestions] = useState<QuestionEditState[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [primaryColor, setPrimaryColor] = useState('#007BFF')
  const [logoUrl, setLogoUrl] = useState('')
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null)
  const [surveyLink, setSurveyLink] = useState('')

  useEffect(() => {
    if (!user) return
    fetchSurvey()
  }, [user, surveyId])

  useEffect(() => {
    if (survey) {
      setSurveyLink(`${window.location.origin}/survey/${survey.id}`)
    }
  }, [survey])

  const fetchSurvey = async () => {
    if (!user) return

    try {
      const data = await surveysApi.get(user.id, surveyId)
      setSurvey(data.survey)
      setTitle(data.survey.title)
      setDescription(data.survey.description || '')
      setPrimaryColor(data.survey.primary_color)
      setLogoUrl(data.survey.logo_url || '')

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
        description,
        primary_color: primaryColor,
        logo_url: logoUrl,
      })
      setSurvey({
        ...survey,
        title,
        description,
        primary_color: primaryColor,
        logo_url: logoUrl,
      })
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update survey')
    }
  }

  const handleAddQuestion = async (type: QuestionType = 'short_text') => {
    if (!user || !survey) return

    try {
      const newQuestion = await questionsApi.create(user.id, survey.id, {
        type,
        label: 'New Question',
        order_index: questions.length,
        is_required: false,
      })
      setQuestions([...questions, newQuestion.question])
      setEditingQuestionId(newQuestion.question.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add question')
    }
  }

  const handleUpdateQuestion = async (questionId: string, updates: any) => {
    if (!user || !survey) return

    try {
      await questionsApi.update(user.id, survey.id, questionId, updates)
      setQuestions(
        questions.map((q) =>
          q.id === questionId ? { ...q, ...updates, editingOptions: undefined } : q,
        ),
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update question')
    }
  }

  const handleDeleteQuestion = async (questionId: string) => {
    if (!user || !survey || !confirm('Delete this question?')) return

    try {
      await questionsApi.delete(user.id, survey.id, questionId)
      setQuestions(questions.filter((q) => q.id !== questionId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete question')
    }
  }

  const handleMoveQuestion = async (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === questions.length - 1)
    ) {
      return
    }

    const newQuestions = [...questions]
    const newIndex = direction === 'up' ? index - 1 : index + 1
    ;[newQuestions[index], newQuestions[newIndex]] = [
      newQuestions[newIndex],
      newQuestions[index],
    ]

    setQuestions(newQuestions)

    // Update order on backend
    if (user && survey) {
      try {
        const questionIds = newQuestions.map((q) => q.id)
        await questionsApi.reorder(user.id, survey.id, questionIds)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to reorder questions')
        fetchSurvey() // Revert on error
      }
    }
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(surveyLink)
  }

  if (isLoading) return <div className="flex items-center justify-center min-h-screen">Loading survey...</div>
  if (!survey) return <div className="flex items-center justify-center min-h-screen">Survey not found</div>

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Survey Settings Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-6">
          <h2 className="text-2xl font-bold mb-6">Survey Settings</h2>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Survey Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="Enter survey title"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Description (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="Add a description for your survey"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Primary Color
                </label>
                <div className="flex gap-3">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-12 h-10 border border-gray-300 rounded-lg cursor-pointer"
                  />
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Logo URL (Optional)
                </label>
                <input
                  type="url"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="https://example.com/logo.png"
                />
              </div>
            </div>

            <button
              onClick={handleUpdateSurvey}
              className="w-full px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
            >
              Save Settings
            </button>
          </div>
        </div>

        {/* Survey Link Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Share Survey</h3>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={surveyLink}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
            />
            <button
              onClick={handleCopyLink}
              className="px-4 py-2 bg-gray-100 text-gray-900 font-semibold rounded-lg hover:bg-gray-200 transition"
            >
              Copy
            </button>
          </div>
        </div>

        {/* Questions Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Questions</h2>
            <div className="flex gap-2">
              <div className="relative group">
                <button className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition">
                  + Add Question
                </button>
                <div className="absolute right-0 hidden group-hover:block bg-white border border-gray-200 rounded-lg shadow-lg mt-2 min-w-48 z-10">
                  {QUESTION_TYPES.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => handleAddQuestion(type.value)}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-900 hover:bg-gray-100 first:rounded-t-lg last:rounded-b-lg"
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {questions.length === 0 ? (
            <p className="text-center text-gray-600 py-12">No questions yet. Add one to get started!</p>
          ) : (
            <div className="space-y-4">
              {questions.map((question, index) => (
                <QuestionCard
                  key={question.id}
                  question={question}
                  index={index}
                  totalQuestions={questions.length}
                  isEditing={editingQuestionId === question.id}
                  onEdit={() => setEditingQuestionId(question.id)}
                  onUpdate={(updates) => handleUpdateQuestion(question.id, updates)}
                  onDelete={() => handleDeleteQuestion(question.id)}
                  onMoveUp={() => handleMoveQuestion(index, 'up')}
                  onMoveDown={() => handleMoveQuestion(index, 'down')}
                  onEditingOptionsChange={(opts) =>
                    setQuestions(
                      questions.map((q) =>
                        q.id === question.id ? { ...q, editingOptions: opts } : q,
                      ),
                    )
                  }
                />
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mt-8">
          <button
            onClick={() => navigate({ to: '/dashboard' })}
            className="flex-1 px-4 py-2.5 bg-gray-200 text-gray-900 font-semibold rounded-lg hover:bg-gray-300 transition"
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
            className="flex-1 px-4 py-2.5 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition"
          >
            Preview Survey
          </button>
        </div>
      </div>
    </div>
  )
}

interface QuestionCardProps {
  question: QuestionEditState
  index: number
  totalQuestions: number
  isEditing: boolean
  onEdit: () => void
  onUpdate: (updates: any) => void
  onDelete: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  onEditingOptionsChange: (opts: string) => void
}

function QuestionCard({
  question,
  index,
  totalQuestions,
  isEditing,
  onEdit,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
  onEditingOptionsChange,
}: QuestionCardProps) {
  const [label, setLabel] = useState(question.label)
  const [type, setType] = useState<QuestionType>(question.type)
  const [isRequired, setIsRequired] = useState(question.is_required)
  const optionsStr = question.editingOptions ?? (question.options ? JSON.stringify(JSON.parse(question.options), null, 1) : '')

  const handleSave = () => {
    const updates: any = {
      label,
      type,
      is_required: isRequired,
    }

    if (type === 'multiple_choice' && optionsStr) {
      try {
        const options = optionsStr
          .split('\n')
          .map((o) => o.trim())
          .filter((o) => o)
        updates.options = options
      } catch {
        alert('Invalid options format')
        return
      }
    }

    onUpdate(updates)
  }

  if (isEditing) {
    return (
      <div className="border-2 border-blue-500 rounded-lg p-6 bg-blue-50">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Question Text</label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Question Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as QuestionType)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {QUESTION_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isRequired}
                  onChange={(e) => setIsRequired(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm font-semibold text-gray-900">Required</span>
              </label>
            </div>
          </div>

          {(type === 'multiple_choice' || type === 'rating') && type === 'multiple_choice' && (
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Options (one per line)
              </label>
              <textarea
                value={optionsStr}
                onChange={(e) => onEditingOptionsChange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                rows={4}
                placeholder="Option 1&#10;Option 2&#10;Option 3"
              />
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <button
              onClick={() => {
                handleSave()
              }}
              className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
            >
              Save
            </button>
            <button
              onClick={() => {
                setLabel(question.label)
                setType(question.type)
                setIsRequired(question.is_required)
              }}
              className="px-4 py-2 bg-gray-300 text-gray-900 font-semibold rounded-lg hover:bg-gray-400 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1">
          <p className="text-sm text-gray-600 font-semibold">Question {index + 1}</p>
          <p className="text-lg font-semibold text-gray-900">{label}</p>
          <p className="text-sm text-gray-500 mt-1">
            {QUESTION_TYPES.find((t) => t.value === type)?.label}
            {isRequired && ' • Required'}
          </p>
        </div>

        <div className="flex gap-1">
          <button
            onClick={onMoveUp}
            disabled={index === 0}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            title="Move up"
          >
            ↑
          </button>
          <button
            onClick={onMoveDown}
            disabled={index === totalQuestions - 1}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            title="Move down"
          >
            ↓
          </button>
          <button
            onClick={onEdit}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded font-semibold"
          >
            Edit
          </button>
          <button
            onClick={onDelete}
            className="p-2 text-red-600 hover:bg-red-50 rounded font-semibold"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}
