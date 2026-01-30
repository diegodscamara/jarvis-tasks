'use client'

import dynamic from 'next/dynamic'
import 'swagger-ui-react/swagger-ui.css'

const SwaggerUI = dynamic(() => import('swagger-ui-react'), { 
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-screen">Loading API documentation...</div>
})

export default function ApiDocsPage() {
  return (
    <div className="min-h-screen">
      <div className="bg-background border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">Jarvis Tasks API Documentation</h1>
          <p className="text-muted-foreground mt-2">
            Explore and test the API endpoints using the interactive documentation below.
          </p>
        </div>
      </div>
      <SwaggerUI url="/api/openapi.json" />
    </div>
  )
}