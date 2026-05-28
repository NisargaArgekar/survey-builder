import { createFileRoute, Link } from '@tanstack/react-router'
import { useAuth } from '../stores/authContext'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  const { user } = useAuth()

  return (
    <div className="space-y-12">
      {/* Hero */}
      <section className="text-center py-16">
        <h1 className="text-5xl font-bold mb-4">Survey Builder</h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Create beautiful surveys with drag-and-drop ease. Share with anyone. Collect responses
          instantly.
        </p>

        {user ? (
          <Link
            to="/dashboard"
            className="inline-block px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
          >
            Go to Dashboard
          </Link>
        ) : (
          <div className="flex gap-4 justify-center">
            <Link
              to="/auth/signup"
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
            >
              Sign Up Free
            </Link>
            <Link
              to="/auth/login"
              className="px-8 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-semibold"
            >
              Login
            </Link>
          </div>
        )}
      </section>

      {/* Features */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8 py-16">
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="text-4xl mb-4">🎨</div>
          <h3 className="text-xl font-semibold mb-2">Beautiful Branding</h3>
          <p className="text-gray-600">Customize your surveys with your brand colors and logo</p>
        </div>

        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="text-4xl mb-4">📊</div>
          <h3 className="text-xl font-semibold mb-2">Easy to Use</h3>
          <p className="text-gray-600">Simple drag-and-drop builder. No coding needed.</p>
        </div>

        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="text-4xl mb-4">🔗</div>
          <h3 className="text-xl font-semibold mb-2">Share & Collect</h3>
          <p className="text-gray-600">Get a shareable link. Collect responses instantly.</p>
        </div>
      </section>

      {/* CTA */}
      {!user && (
        <section className="bg-blue-50 rounded-lg p-12 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to create your first survey?</h2>
          <Link
            to="/auth/signup"
            className="inline-block px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
          >
            Get Started Now
          </Link>
        </section>
      )}
    </div>
  )
}
