import HomePage from '@/components/HomePage';

// Without this, Next.js treats this page as fully static with no
// revalidation (Cache-Control: s-maxage=31536000 — one year, unaffected by a
// revalidate export in this Next version's standalone server). Any CDN/proxy
// in front of the deployment would then keep serving a stale copy — old JS
// bundle included — for up to a year after each redeploy, since redeploying
// the origin doesn't purge a CDN's cache on its own. The page has no
// server-side data anyway (bootstrap loads client-side), so there's no
// upside to prerendering it statically.
export const dynamic = 'force-dynamic';

export default function Page() {
  return <HomePage />;
}
