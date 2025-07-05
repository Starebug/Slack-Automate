import Agenda from 'agenda';
import dotenv from 'dotenv';
import path from 'path';

const projectRoot = path.resolve(__dirname, '.');
const envPath = path.join(projectRoot, '.env.local');
dotenv.config({ path: envPath });

const agenda = new Agenda({
  db: { address: process.env.MONGODB_URI!, collection: 'agendaJobs' },
  processEvery: '10 seconds',
});

agenda.on('ready', () => {
  console.log('[Test] Agenda ready!');
});
agenda.on('error', (err) => {
  console.error('[Test] Agenda error:', err);
});

(async () => {
  console.log('[Test] About to start Agenda...');
  try {
    const startPromise = agenda.start();
    const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Agenda start timed out')), 10000));
    await Promise.race([startPromise, timeout]);
    console.log('[Test] Agenda started');
  } catch (err) {
    console.error('[Test] Agenda failed to start:', err);
  }
})(); 