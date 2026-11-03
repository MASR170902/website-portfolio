import bcrypt from 'bcryptjs';

function readHidden(prompt) {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    throw new Error('Run this command from an interactive terminal.');
  }

  process.stdout.write(prompt);
  process.stdin.setRawMode(true);
  process.stdin.resume();

  return new Promise((resolve, reject) => {
    let value = '';
    const finish = (error) => {
      process.stdin.off('data', onData);
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdout.write('\n');
      if (error) reject(error);
      else resolve(value);
    };
    const onData = (chunk) => {
      for (const character of chunk.toString()) {
        if (character === '\u0003') {
          finish(new Error('Password setup cancelled.'));
          return;
        }
        if (character === '\r' || character === '\n') {
          finish();
          return;
        }
        if (character === '\u007f' || character === '\b') {
          value = value.slice(0, -1);
        } else if (character >= ' ') {
          value += character;
        }
      }
    };
    process.stdin.on('data', onData);
  });
}

try {
  const password = await readHidden('New admin password (minimum 10 characters): ');
  if (password.length < 10 || Buffer.byteLength(password) > 72) {
    throw new Error('Password must contain at least 10 characters and no more than 72 bytes.');
  }
  const confirmation = await readHidden('Confirm admin password: ');
  if (password !== confirmation) throw new Error('Passwords do not match.');
  console.log(`ADMIN_PASSWORD_HASH=${await bcrypt.hash(password, 12)}`);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
