import createApp from './app.js';
import config from './config.js';
import startScheduler from '../utils/scheduler.js';
import logger from '../utils/logger.js';

const app = createApp();

app.listen(config.port, () => {
  logger.info(`Servidor corriendo en http://localhost:${config.port}`);
  startScheduler();
});