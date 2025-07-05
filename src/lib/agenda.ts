import Agenda from 'agenda';
import path from 'path';
import dotenv from 'dotenv';

const projectRoot = path.resolve(__dirname, '../../');
const envPath = path.join(projectRoot, '.env.local');
dotenv.config({ path: envPath });

const mongoConnectionString = process.env.MONGODB_URI!;

const agenda = new Agenda({
  db: { address: mongoConnectionString, collection: 'agendaJobs' },
  processEvery: '30 seconds',
});

export async function startAgenda() {
  try {
    await agenda.start();
    console.log('Agenda started successfully');
    return agenda;
  } catch (error) {
    console.error('Failed to start Agenda:', error);
    throw error;
  }
}

export { agenda }; 