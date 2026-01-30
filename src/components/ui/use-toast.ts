// Minimal toast hook implementation.
// The app uses this for non-blocking UI notifications; on server builds it just needs to exist.

export type ToastOptions = {
  title?: string
  description?: string
  variant?: 'default' | 'destructive'
}

export function useToast() {
  return {
    toast: (_opts: ToastOptions) => {
      // no-op (replace with real toast provider if/when added)
    },
  }
}
