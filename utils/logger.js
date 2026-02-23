import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOGS_DIR = path.join(__dirname, '..', 'logs');

// Crear el directorio de logs si no existe
fs.mkdirSync(LOGS_DIR, { recursive: true });

const getLogFile = () => {
  const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  return path.join(LOGS_DIR, `scheduler-${date}.log`);
};

const format = (level, message) => {
  const ts = new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' });
  return `[${ts}] [${level}] ${message}\n`;
};

const write = (level, message) => {
  const line = format(level, message);
  process.stdout.write(line); // sigue mostrando en consola
  fs.appendFileSync(getLogFile(), line, 'utf8');
};

const logger = {
  info:  (msg) => write('INFO ', msg),
  ok:    (msg) => write('OK   ', msg),
  warn:  (msg) => write('WARN ', msg),
  error: (msg) => write('ERROR', msg),
};

export default logger;
