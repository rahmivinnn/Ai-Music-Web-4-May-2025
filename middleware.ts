import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// This middleware handles CORS and other request issues
export function middleware(request: NextRequest) {
  // Get the response
  const response = NextResponse.next()

  // Add CORS headers
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Authorization')

  // Add cache headers for audio files
  if (request.nextUrl.pathname.startsWith('/samples/') || 
      request.nextUrl.pathname.endsWith('.mp3') || 
      request.nextUrl.pathname.endsWith('.wav') || 
      request.nextUrl.pathname.endsWith('.ogg')) {
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable')
  }

  return response
}

// Configure the middleware to run for specific paths
export const config = {
  matcher: [
    // Apply to all API routes
    '/api/:path*',
    // Apply to all sample files
    '/samples/:path*',
    // Apply to all audio files
    '/(.*).mp3',
    '/(.*).wav',
    '/(.*).ogg',
  ],
}
