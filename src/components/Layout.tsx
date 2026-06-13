import { type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { USE_FIREBASE } from '../lib/firebase'

export default function Layout({ children }: { children: ReactNode }) {
  const { user, loading, signIn, signOut } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-100 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="When Cham We Meet" className="h-10" />
          </Link>
          {USE_FIREBASE && !loading && (
            <div className="flex items-center gap-3">
              {user ? (
                <>
                  <div className="flex items-center gap-2">
                    {user.photoURL && (
                      <img
                        src={user.photoURL}
                        alt=""
                        className="h-7 w-7 rounded-full"
                        referrerPolicy="no-referrer"
                      />
                    )}
                    <span className="hidden text-sm text-gray-600 sm:inline">
                      {user.displayName}
                    </span>
                  </div>
                  <button
                    onClick={() => signOut()}
                    className="text-xs text-gray-400 hover:text-gray-600"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <button
                  onClick={() => signIn()}
                  className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
                >
                  Admin login
                </button>
              )}
            </div>
          )}
        </div>
      </header>
      <main>{children}</main>
    </div>
  )
}
