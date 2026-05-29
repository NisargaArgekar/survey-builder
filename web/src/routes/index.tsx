import { createFileRoute, Link } from '@tanstack/react-router'
import { useAuth } from '../stores/authContext'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero */}
      <section className="py-24 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-6xl font-bold text-gray-900 mb-6">Build Surveys That Matter</h1>
          <p className="text-xl text-gray-600 mb-10 leading-relaxed">
            Create beautiful, branded surveys in minutes. Collect insights instantly. No coding needed.
          </p>

          {user ? (
            <Link
              to="/dashboard"
              className="inline-block px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-lg shadow-lg transition"
            >
              Go to Dashboard →
            </Link>
          ) : (
            <div className="flex gap-4 justify-center flex-wrap">
              <Link
                to="/auth/signup"
                className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-lg shadow-lg transition"
              >
                Sign Up Free
              </Link>
              <Link
                to="/auth/login"
                className="px-8 py-4 bg-white text-blue-600 border-2 border-blue-600 rounded-lg hover:bg-blue-50 font-semibold text-lg transition"
              >
                Login
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-14 text-gray-900">Why Choose Survey Builder?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center hover:shadow-md transition">
              <div className="text-5xl mb-4">🎨</div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">Beautiful Branding</h3>
              <p className="text-gray-600">Customize surveys with your brand colors, logo, and identity</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center hover:shadow-md transition">
              <div className="text-5xl mb-4">⚡</div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">Easy to Build</h3>
              <p className="text-gray-600">Intuitive drag-and-drop builder with 6 question types</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center hover:shadow-md transition">
              <div className="text-5xl mb-4">📊</div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">Instant Analytics</h3>
              <p className="text-gray-600">View and analyze responses in real-time</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features List */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-10 text-gray-900">Built-In Features</h2>
          <div className="space-y-4">
            {[
              '6 Question Types: Short text, long text, multiple choice, rating, email, and date',
              'Drag & Drop Reordering: Easily rearrange questions',
              'Optional & Required: Control which questions must be answered',
              'Public Survey Links: Share with anyone, no login needed',
              'CSV Export: Download all responses',
              'Unlimited Questions: Create surveys of any length',
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-blue-600 font-bold">✓</span>
                <p className="text-gray-700">{feature}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      {!user && (
        <section className="py-24 px-4">
          <div className="max-w-3xl mx-auto bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-12 text-center text-white">
            <h2 className="text-4xl font-bold mb-6">Ready to create your first survey?</h2>
            <p className="text-lg mb-8 opacity-90">Get started in seconds. Free forever.</p>
            <Link
              to="/auth/signup"
              className="inline-block px-8 py-4 bg-white text-blue-600 rounded-lg hover:bg-gray-100 font-semibold text-lg transition"
            >
              Sign Up Free →
            </Link>
          </div>
        </section>
      )}
    </div>
  )
}
