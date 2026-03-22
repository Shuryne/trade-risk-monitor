import { Component, type ReactNode, type ErrorInfo } from 'react'
import { Button } from '@/components/ui/button'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex h-full items-center justify-center p-8">
          <div className="max-w-md space-y-4 text-center">
            <h2 className="text-lg font-semibold">页面出现错误</h2>
            <p className="text-sm text-muted-foreground">{this.state.error.message}</p>
            <Button variant="outline" onClick={() => this.setState({ error: null })}>
              重试
            </Button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
