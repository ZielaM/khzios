import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/admin/password';
import { DEV_ADMIN_ACCOUNTS } from './dev-admin-accounts';

/**
 * Resets the panel's content tables and, outside production, the accounts.
 * The development accounts have public passwords and TOTP secrets, so a
 * demo seed on the server (NODE_ENV=production) must never create them.
 */
export async function seedAdmin() {
  console.log('Panel administracyjny...');
  await prisma.trashItem.deleteMany();
  await prisma.contentOverride.deleteMany();
  await prisma.siteSetting.deleteMany();

  // Example: production leaves the publication date empty until launch
  await prisma.siteSetting.create({
    data: { key: 'accessibility', value: { published: '2026-10-01' } },
  });

  if (process.env.NODE_ENV === 'production') {
    console.log(
      'Konta panelu bez zmian (pierwsze konto: pnpm admin:create, patrz README).'
    );
    return;
  }

  await prisma.adminSession.deleteMany();
  await prisma.loginAttempt.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.securityEvent.deleteMany();
  await prisma.adminUser.deleteMany();
  for (const account of Object.values(DEV_ADMIN_ACCOUNTS)) {
    await prisma.adminUser.create({
      data: {
        login: account.login,
        name: account.name,
        role: account.role,
        passwordHash: await hashPassword(account.password),
        totpSecret: account.totpSecret,
      },
    });
  }
}
