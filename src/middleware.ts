import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  matcher: [
    // Apply to all routes except API, admin, _next, static files
    '/((?!api|admin|_next|_vercel|.*\\..*).*)'
  ]
};
