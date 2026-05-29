import { createRootRoute, Link, Outlet } from '@tanstack/react-router'
import { AuthProvider, useAuth } from '../stores/authContext'

function RootLayout() {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="text-2xl font-bold text-blue-600 font-mono">
                SB
              </Link>
            </div>
            <div className="flex items-center gap-6">
              {user ? (
                <>
                  <div className="text-sm">
                    <p className="text-gray-600">Signed in as</p>
                    <p className="font-semibold text-gray-900">{user.email}</p>
                  </div>
                  <Link to="/dashboard" className="text-gray-700 font-semibold hover:text-blue-600 transition">
                    Dashboard
                  </Link>
                  <button
                    onClick={logout}
                    className="px-4 py-2 text-gray-700 font-semibold hover:bg-gray-100 rounded-lg transition"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/auth/login" className="text-gray-700 font-semibold hover:text-blue-600 transition">
                    Login
                  </Link>
                  <Link
                    to="/auth/signup"
                    className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
                  >
                    Sign Up
                  </Link>
                </>
              )}
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
