import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  matcher: [
    // Barcha yo'llar, API, admin, media (R2), cdn-cgi, _next va statik fayllardan tashqari
    '/((?!api|admin|media|cdn-cgi|_next|.*\\..*).*)',
  ],
};
