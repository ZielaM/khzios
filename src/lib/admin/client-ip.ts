/**
 * Client address for rate limiting and the login log. Behind the reverse
 * proxy the last X-Forwarded-For entry is the one the proxy itself added
 * (nginx: $proxy_add_x_forwarded_for), so a client cannot spoof it by
 * sending its own header.
 */
export function getClientIp(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    const last = forwarded.split(',').pop()?.trim();
    if (last) return last;
  }
  return headers.get('x-real-ip')?.trim() || 'unknown';
}
