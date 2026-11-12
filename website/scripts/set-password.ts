import { createInterface } from 'node:readline';
import { setPasswordHashForAdmin } from '../server/db';
import { hashPassword } from '../server/password';

const arg = process.argv[2];

async function promptPassword(): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stderr });
  return new Promise((resolve) => {
    rl.question('Admin password: ', (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

const password = arg ?? (await promptPassword());
if (!password || password.length < 4) {
  console.error('Password must be at least 4 characters.');
  process.exit(1);
}

setPasswordHashForAdmin(hashPassword(password));
console.log('Admin password saved to data/admin.db');