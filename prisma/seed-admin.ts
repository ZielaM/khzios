import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/admin/password';
import { DEV_ADMIN_ACCOUNTS } from './dev-admin-accounts';

/** Resets the admin panel tables and creates the development accounts. */
export async function seedAdmin() {
  console.log('Konta panelu administracyjnego...');
  await prisma.adminSession.deleteMany();
  await prisma.loginAttempt.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.securityEvent.deleteMany();
  await prisma.trashItem.deleteMany();
  await prisma.contentOverride.deleteMany();
  await prisma.siteSetting.deleteMany();
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
