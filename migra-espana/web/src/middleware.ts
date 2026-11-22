import { NextResponse, type NextRequest } from 'next/server';

const LOCALES = ['es', 'en', 'fr', 'ar'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (LOCALES.some((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`))) return NextResponse.next();
  const cookie = req.cookies.get('locale')?.value;
  const accept = req.headers.get('accept-language')?.split(',').map((p) => p.trim().slice(0, 2).toLowerCase()) ?? [];
  const locale = LOCALES.includes(cookie ?? '') ? cookie! : accept.find((a) => LOCALES.includes(a)) ?? 'es';
  const url = req.nextUrl.clone();
  url.pathname = `/${locale}${pathname === '/' ? '' : pathname}`;
  return NextResponse.redirect(url);
}
export const config = { matcher: ['/((?!api|_next|.*\\..*).*)'] };
