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
  const { surveyId } = Route.useParams<{ surveyId: string }>()
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
  const [copied, setCopied] = useState(false)
  const [showAddMenu, setShowAddMenu] = useState(false)

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
      setEditingQuestionId(null)
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
    const currentQuestion = newQuestions[index]
    const targetQuestion = newQuestions[newIndex]

    if (!currentQuestion || !targetQuestion) {
      return
    }

    newQuestions[index] = targetQuestion
    newQuestions[newIndex] = currentQuestion

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

  const handleCopyLink = async () => {
    if (!surveyLink) return
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(surveyLink)
      } else {
        // Fallback
        const ta = document.createElement('textarea')
        ta.value = surveyLink
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
      }
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (e) {
      console.error('Copy failed', e)
      setError('Failed to copy link')
    }
  }

  if (isLoading) return <div className="flex items-center justify-center min-h-screen">Loading survey...</div>
  if (!survey) return <div className="flex items-center justify-center min-h-screen">Survey not found</div>

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/60">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-700">Survey Builder</p>
              <h1 className="mt-3 text-4xl font-bold tracking-tight text-black">{survey.title || 'Untitled Survey'}</h1>
              {survey.description ? (
                <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">{survey.description}</p>
              ) : (
                <p className="mt-3 max-w-2xl text-base leading-7 text-slate-500">Add a description to describe the survey experience.</p>
              )}
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-3xl bg-slate-100 p-4 text-center">
                <p className="text-sm text-slate-500">Survey link</p>
                <p className="mt-2 truncate text-sm font-semibold text-slate-900">{surveyLink}</p>
              </div>
              <div className="rounded-3xl bg-slate-100 p-4 text-center">
                <p className="text-sm text-slate-500">Brand color</p>
                <div className="mt-3 inline-flex items-center gap-3 rounded-full bg-white px-4 py-2 shadow-sm">
                  <span className="inline-block h-4 w-4 rounded-full" style={{ backgroundColor: survey.primary_color }} />
                  <span className="text-sm font-medium text-slate-900">{survey.primary_color}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl shadow-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.55fr_0.95fr] mb-6">
          <div className="bg-white/95 rounded-[1.75rem] border border-slate-200 p-8 shadow-xl shadow-slate-200/40">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">Survey Settings</h2>
                <p className="mt-2 text-sm text-slate-500">Brand your survey page and configure response details.</p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-700">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-sky-700" /> Live edit
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">Survey Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                  placeholder="Enter survey title"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">Description (Optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                  placeholder="Add a description for your survey"
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">Primary Color</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="h-12 w-12 rounded-3xl border border-slate-200 p-1 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="flex-1 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">Logo URL (Optional)</label>
                  <input
                    type="url"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                    placeholder="https://example.com/logo.png"
                  />
                </div>
              </div>

              <button
                onClick={handleUpdateSurvey}
                className="w-full rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-xl shadow-slate-900/10 transition hover:bg-slate-800"
              >
                Save Settings
              </button>
            </div>
          </div>

          <div className="bg-white/95 rounded-[1.75rem] border border-slate-200 p-6 shadow-xl shadow-slate-200/40">
            <div className="flex flex-col gap-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Share Survey</h3>
                <p className="mt-2 text-sm text-slate-500">Send this public link to respondents.</p>
              </div>

              <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 shadow-sm">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Public link</p>
                <p className="mt-3 truncate text-sm font-semibold text-slate-900">{surveyLink}</p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  onClick={handleCopyLink}
                  className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-800"
                >
                  Copy link
                </button>
                {copied && (
                  <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">
                    Copied
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Questions Section */}
        <div className="bg-white/95 rounded-[1.75rem] border border-slate-200 p-8 shadow-xl shadow-slate-200/40">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">Questions</h2>
              <p className="mt-2 text-sm text-slate-500">Create the questions respondents will see.</p>
            </div>
            <div className="relative">
              <button
                onClick={() => setShowAddMenu((s) => !s)}
                className="inline-flex items-center justify-center rounded-full bg-sky-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-600/20 transition hover:bg-sky-700"
              >
                + Add Question
              </button>

              {showAddMenu && (
                <div className="absolute right-0 mt-3 w-52 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
                  {QUESTION_TYPES.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => {
                        handleAddQuestion(type.value)
                        setShowAddMenu(false)
                      }}
                      className="block w-full px-4 py-3 text-left text-sm font-medium text-slate-900 transition hover:bg-slate-50"
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {questions.length === 0 ? (
            <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-12 text-center text-slate-500">
              No questions yet. Add one to get started!
            </div>
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
                  onCancel={() => setEditingQuestionId(null)}
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
            className="flex-1 px-4 py-2.5 bg-black text-white font-semibold rounded-lg hover:bg-slate-900 transition"
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
  onCancel: () => void
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
  onCancel,
}: QuestionCardProps) {
  const [label, setLabel] = useState(question.label)
  const [type, setType] = useState<QuestionType>(question.type)
  const [isRequired, setIsRequired] = useState(Boolean(question.is_required))

  // Sync local state when question prop changes (after save)
  useEffect(() => {
    setLabel(question.label)
    setType(question.type)
    setIsRequired(Boolean(question.is_required))
  }, [question.id, question.label, question.type, question.is_required])
  const optionsStr = question.editingOptions ?? (question.options ? (Array.isArray(question.options) ? question.options.join('\n') : (() => { try { return JSON.parse(question.options).join('\n') } catch { return String(question.options) } })()) : '')

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
          .map((o: string) => o.trim())
          .filter((o: string) => o)
        updates.options = JSON.stringify(options)
      } catch {
        alert('Invalid options format')
        return
      }
    }

    onUpdate(updates)
  }

  if (isEditing) {
    return (
      <div className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/40">
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">Question text</label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">Question type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as QuestionType)}
                className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
              >
                {QUESTION_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <label className="inline-flex items-center gap-3 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={isRequired}
                  onChange={(e) => setIsRequired(e.target.checked)}
                  className="h-4 w-4 rounded text-sky-600"
                />
                Required
              </label>
            </div>
          </div>

          {type === 'multiple_choice' && (
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">Options (one per line)</label>
              <textarea
                value={optionsStr}
                onChange={(e) => onEditingOptionsChange(e.target.value)}
                className="min-h-[140px] w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200 font-mono"
                rows={4}
                placeholder="Option 1&#10;Option 2&#10;Option 3"
              />
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              onClick={handleSave}
              className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-800"
            >
              Save changes
            </button>
            <button
              onClick={() => {
                setLabel(question.label)
                setType(question.type)
                setIsRequired(question.is_required)
                onCancel()
              }}
              className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-lg">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
              Q {index + 1}
            </div>
            <div className="inline-flex flex-wrap gap-2 text-xs font-medium text-slate-500">
              <span className="rounded-full bg-slate-100 px-2 py-1">{QUESTION_TYPES.find((t) => t.value === type)?.label}</span>
              {isRequired && <span className="rounded-full bg-emerald-100 px-2 py-1 text-emerald-700">Required</span>}
            </div>
          </div>
          <p className="text-lg font-semibold text-slate-900">{label}</p>
          <p className="mt-3 text-sm text-slate-500">This question will appear to respondents on your survey page.</p>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            onClick={onMoveUp}
            disabled={index === 0}
            className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Move up
          </button>
          <button
            onClick={onMoveDown}
            disabled={index === totalQuestions - 1}
            className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Move down
          </button>
          <button
            onClick={onEdit}
            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Edit
          </button>
          <button
            onClick={onDelete}
            className="rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}
