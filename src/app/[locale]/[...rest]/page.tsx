import { notFound } from 'next/navigation';

// Unknown paths under a locale get the translated not-found page
export default function CatchAllPage() {
  notFound();
}
