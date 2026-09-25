import { getStudentSchedule } from '@/lib/student-queries';
import { createLogger } from '@/lib/logger';

const log = createLogger('student-schedule');

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const schedule = await getStudentSchedule();
    return Response.json(schedule, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (err) {
    log.error({ err }, 'Failed to load the student schedule');
    return Response.json(
      { error: 'Schedule unavailable' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
