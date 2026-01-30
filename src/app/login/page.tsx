'use client'

import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { GitHubLogoIcon } from '@radix-ui/react-icons'
import { FlashLightIcon } from '@/components/icons'
import { useSearchParams } from 'next/navigation'

export default function LoginPage() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const callbackUrl = searchParams.get('callbackUrl') || '/'

  const handleSignIn = () => {
    signIn('github', { callbackUrl })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-950 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
              <FlashLightIcon size={32} className="text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Welcome to Jarvis Tasks</CardTitle>
          <CardDescription>
            Sign in to manage your tasks and boost productivity
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-500 bg-red-500/10 rounded-md text-center">
              {error === 'OAuthSignin' && 'Failed to sign in with GitHub'}
              {error === 'OAuthCallback' && 'Failed to handle OAuth callback'}
              {error === 'OAuthCreateAccount' && 'Failed to create account'}
              {error === 'Verification' && 'Verification failed'}
              {error === 'Default' && 'An error occurred during sign in'}
            </div>
          )}
          
          <Button
            onClick={handleSignIn}
            className="w-full"
            size="lg"
            variant="default"
          >
            <GitHubLogoIcon className="mr-2 h-5 w-5" />
            Sign in with GitHub
          </Button>
          
          <div className="text-center text-sm text-muted-foreground">
            <p>By signing in, you agree to our</p>
            <p>
              <a href="#" className="underline hover:text-primary">Terms of Service</a>
              {' and '}
              <a href="#" className="underline hover:text-primary">Privacy Policy</a>
            </p>
          </div>
        </CardContent>
      </Card>
      
      <div className="absolute bottom-4 text-center text-xs text-muted-foreground">
        Powered by Jarvis AI ⚡
      </div>
    </div>
  )
}