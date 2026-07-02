import { RouterProvider } from 'react-router-dom'
import { Provider } from 'react-redux'
import { store } from '@/store/store'
import { router } from '@/app/router'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'
import { ThemeProvider } from '@/app/providers/ThemeProvider'
import { I18nProvider } from '@/app/providers/I18nProvider'
import { AuthProvider } from '@/app/providers/AuthProvider'
import { Toaster } from '@/components/ui/sonner'

export function App() {
  return (
    <ErrorBoundary>
      <Provider store={store}>
        <ThemeProvider>
          <I18nProvider>
            <AuthProvider>
              <RouterProvider router={router} />
              <Toaster />
            </AuthProvider>
          </I18nProvider>
        </ThemeProvider>
      </Provider>
    </ErrorBoundary>
  )
}
