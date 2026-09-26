/**
 * Creates an admin panel account (there is no sign-up in the panel):
 *
 *   pnpm admin:create --login jan --name "Jan Kowalski" --role admin
 *
 * Asks for the password without echoing it (or reads ADMIN_PASSWORD, for
 * scripts). The account sets up two-factor sign-in at the first login.
 */
import 'dotenv/config';
import { parseArgs } from 'node:util';
import { createInterface } from 'node:readline';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import { hashPassword } from '../src/lib/admin/password';
import { passwordProblem } from '../src/lib/admin/password-rules';

function askHidden(question: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true,
    });
    // Print the question, then hide what is typed
    process.stdout.write(question);
    const write = (rl as unknown as { _writeToOutput: (s: string) => void })
      ._writeToOutput;
    (rl as unknown as { _writeToOutput: (s: string) => void })._writeToOutput =
      () => undefined;
    rl.question('', (answer) => {
      (
        rl as unknown as { _writeToOutput: (s: string) => void }
      )._writeToOutput = write;
      rl.close();
      process.stdout.write('\n');
      resolve(answer);
    });
  });
}

async function main() {
  const { values } = parseArgs({
    options: {
      login: { type: 'string' },
      name: { type: 'string' },
      role: { type: 'string', default: 'admin' },
    },
  });
  const login = values.login?.trim().toLowerCase();
  const role =
    values.role === 'editor'
      ? 'EDITOR'
      : values.role === 'admin'
        ? 'ADMIN'
        : null;

  if (!login || !/^[a-z0-9._-]{3,50}$/.test(login) || !values.name || !role) {
    console.error(
      'Użycie: pnpm admin:create --login <login> --name "<imię i nazwisko>" [--role admin|editor]\n' +
        'Login: 3–50 znaków (małe litery, cyfry, kropka, myślnik, podkreślenie).'
    );
    process.exit(1);
  }

  const password =
    process.env.ADMIN_PASSWORD ?? (await askHidden('Hasło (min. 12 znaków): '));
  const problem = passwordProblem(password);
  if (problem) {
    console.error(problem);
    process.exit(1);
  }
  if (!process.env.ADMIN_PASSWORD) {
    const repeated = await askHidden('Powtórz hasło: ');
    if (repeated !== password) {
      console.error('Hasła nie są takie same.');
      process.exit(1);
    }
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });
  try {
    const existing = await prisma.adminUser.findUnique({ where: { login } });
    if (existing) {
      console.error(`Konto "${login}" już istnieje.`);
      process.exit(1);
    }
    await prisma.adminUser.create({
      data: {
        login,
        name: values.name,
        role,
        passwordHash: await hashPassword(password),
      },
    });
    console.log(
      `Utworzono konto "${login}" (${role === 'ADMIN' ? 'administrator' : 'redaktor'}). ` +
        'Przy pierwszym logowaniu panel poprosi o włączenie logowania dwuskładnikowego.'
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
