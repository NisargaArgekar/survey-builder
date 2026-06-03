import { createRootRoute, Link, Outlet } from '@tanstack/react-router'
import { AuthProvider, useAuth } from '../stores/authContext'

function RootLayout() {
  const { user, logout } = useAuth()
  const isPublicSurveyPage = typeof window !== 'undefined' && window.location.pathname.startsWith('/survey/')

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-black border-b border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="text-2xl font-bold text-white font-mono">
                Survey Builder
              </Link>
            </div>
            <div className="flex items-center gap-6">
              {!isPublicSurveyPage ? (
                user ? (
                  <>
                    <div className="text-sm">
                      <p className="text-slate-400">Signed in as</p>
                      <p className="font-semibold text-white">{user.email}</p>
                    </div>
                    <Link to="/dashboard" className="text-white font-semibold hover:text-slate-300 transition">
                      Dashboard
                    </Link>
                    <button
                      onClick={logout}
                      className="px-4 py-2 text-white font-semibold hover:bg-slate-800 rounded-lg transition"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/auth/login" className="text-white font-semibold hover:text-slate-300 transition">
                      Login
                    </Link>
                    <Link
                      to="/auth/signup"
                      className="px-4 py-2 bg-white text-black font-semibold rounded-lg hover:bg-slate-200 transition"
                    >
                      Sign Up
                    </Link>
                  </>
                )
              ) : null}
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  )
}

export const Route = createRootRoute({
  component: () => (
    <AuthProvider>
      <RootLayout />
    </AuthProvider>
  ),
})
