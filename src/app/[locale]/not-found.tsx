import { NotFoundPage } from '@/components/StatusPage';

// Also rendered for unknown paths under a locale, via the [...rest] route
export default function NotFound() {
  return <NotFoundPage />;
}
