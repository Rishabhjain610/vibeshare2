import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// 1. Define matching patterns for Admin-only routes
const isAdminRoute = createRouteMatcher([
  '/admin(.*)', 
  '/api/admin(.*)'
])

// 2. Define matching patterns for Public routes (accessible to anyone)
const isPublicRoute = createRouteMatcher([
  '/', 
  '/sign-in(.*)', 
  '/sign-up(.*)', 
  '/api/public(.*)',
  '/api/profile/(.*)',
  '/api/posts(.*)',
  '/api/search(.*)'
])

export default clerkMiddleware(async (auth, req) => {
  // A. Handle Admin Routes
  if (isAdminRoute(req)) {
    await auth.protect((has) => {
      // Restrict access to users who have either the 'admin' role OR specific permissions
      return has({ role: 'org:admin' }) || has({ permission: 'org:admin:access' })
    })
  }

  // B. Handle Authenticated User Routes (requires sign-in, but no admin role)
  // If it's not public and not admin, protect it.
  if (!isPublicRoute(req) && !isAdminRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
    // Always run for Clerk-specific frontend API routes
    '/__clerk/(.*)',
  ],
}
