import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'
import { lazy, Suspense } from 'react'

const UploadPage = lazy(() => import('@/pages/UploadPage'))
const DashboardPage = lazy(() => import('@/pages/DashboardPage'))
const DetailPage = lazy(() => import('@/pages/DetailPage'))
const SettingsPage = lazy(() => import('@/pages/SettingsPage'))
const HistoryPage = lazy(() => import('@/pages/HistoryPage'))
const ReportPage = lazy(() => import('@/pages/ReportPage'))
const TrendPage = lazy(() => import('@/pages/TrendPage'))

function Loading() {
  return (
    <div className="flex h-full items-center justify-center">
      <p className="text-sm text-muted-foreground">加载中...</p>
    </div>
  )
}

function App() {
  return (
    <ErrorBoundary>
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Suspense fallback={<Loading />}><UploadPage /></Suspense>} />
          <Route path="/dashboard" element={<Suspense fallback={<Loading />}><DashboardPage /></Suspense>} />
          <Route path="/detail" element={<Suspense fallback={<Loading />}><DetailPage /></Suspense>} />
          <Route path="/settings" element={<Suspense fallback={<Loading />}><SettingsPage /></Suspense>} />
          <Route path="/history" element={<Suspense fallback={<Loading />}><HistoryPage /></Suspense>} />
          <Route path="/report" element={<Suspense fallback={<Loading />}><ReportPage /></Suspense>} />
          <Route path="/trends" element={<Suspense fallback={<Loading />}><TrendPage /></Suspense>} />
        </Route>
      </Routes>
    </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App
