import { withAuth } from 'next-auth/middleware';

export default withAuth({
  callbacks: {
    authorized: ({ token }) => !!token,
  },
});

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/editor/:path*',
    '/new-book/:path*',
    '/api/books/:path*',
    '/api/generate-bible',
    '/api/generate-outline',
    '/api/generate-chapter',
  ],
};
