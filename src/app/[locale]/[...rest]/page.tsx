'use client'; // A hack to bypass turbopack bug
// To be removed before production!

import { notFound } from 'next/navigation';

// catch-all route to handle invalid routes
export default function CatchAllPage() {
  notFound();
}
