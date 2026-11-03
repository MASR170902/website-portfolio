import { createServer } from 'node:http';
import { createApp } from './app.js';

const apiOnly = process.argv.includes('--api-only');
const port = Number(process.env.PORT || (apiOnly ? 3001 : 3000));
const { app, db } = createApp();
const server = createServer(app);

server.listen(port, '0.0.0.0', () => {
  console.log(`Portfolio ${apiOnly ? 'API' : 'server'} listening on port ${port}`);
});

const pruneSessions = setInterval(() => {
  db.prepare('DELETE FROM admin_sessions WHERE expires_at <= ?').run(Date.now());
}, 60 * 60 * 1000);
pruneSessions.unref();

function shutdown() {
  clearInterval(pruneSessions);
  server.close(() => {
    db.close();
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
