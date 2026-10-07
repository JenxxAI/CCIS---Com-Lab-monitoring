import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppShell as App } from './App'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

async function bootstrap() {
  // Demo builds only (VITE_DEMO_MODE=true at build time): serve in-memory mock data.
  if (import.meta.env.VITE_DEMO_MODE === 'true') {
    const { installDemoApi } = await import('./demo/mockApi')
    installDemoApi()
    document.title = `[DEMO] ${document.title}`
  }
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </React.StrictMode>,
  )
}

void bootstrap()
