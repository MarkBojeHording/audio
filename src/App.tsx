import React, { Suspense, lazy } from 'react';
import { Headphones, Loader2 } from 'lucide-react';

// Dynamically import the Audio Chambers component
const AudioChambers = lazy(() => 
  import('../microapps/audio-chambers/src/AudioChambers').then(module => ({
    default: module.default
  }))
);

// Loading component with proper styling
const LoadingSpinner = () => (
  <div className="min-h-screen bg-gradient-to-br from-oxford-navy via-blue-900 to-oxford-navy flex items-center justify-center">
    <div className="text-center">
      <div className="flex items-center justify-center gap-3 mb-4">
        <Headphones className="w-8 h-8 text-manuscript-gold animate-pulse" />
        <Loader2 className="w-6 h-6 text-manuscript-gold animate-spin" />
      </div>
      <h2 className="text-2xl font-playfair font-semibold text-white mb-2">Loading Audio Chambers</h2>
      <p className="text-blue-200 font-inter">Preparing your audiobook studio...</p>
    </div>
  </div>
);

// Error boundary component with proper styling
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Audio Chambers loading error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-red-900 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Headphones className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-2xl font-playfair font-semibold text-white mb-4">Unable to Load Audio Chambers</h2>
            <p className="text-red-200 font-inter mb-6">
              There was an error loading the Audio Chambers application. Please check your setup and try again.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-inter font-medium transition-colors duration-200"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingSpinner />}>
        <AudioChambers />
      </Suspense>
    </ErrorBoundary>
  );
}

export default App;