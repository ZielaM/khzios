-- Ten skrypt należy uruchomić TYLKO na serwerze produkcyjnym, 
-- aby włączyć automatyczne usuwanie ogłoszeń starszych niż 7 dni.

CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
    'cleanup-student-announcements',
    '0 2 * * *',
    $$ DELETE FROM "StudentAnnouncement" WHERE "date" < CURRENT_DATE - INTERVAL '7 days' $$
);
