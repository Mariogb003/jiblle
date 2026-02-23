import cron from 'node-cron';
import jibbleService from '../src/services/jibbleService.js';
import logger from './logger.js';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Auto clock-IN a las 08:00 y auto clock-OUT a las 16:00, de lunes a viernes.
 * Consulta Jibble directamente — no depende de que los empleados usen nuestra API.
 * Todos los eventos quedan registrados en /logs/scheduler-YYYY-MM-DD.log
 */
const startScheduler = () => {

  //  AUTO CLOCK-IN a las 08:00 (L-V) 
  cron.schedule('0 8 * * 1-5', async () => {
    logger.info('Auto clock-IN iniciado');
    try {
      const pendientes = await jibbleService.getEmployeesNotClockedIn();
      if (pendientes.length === 0) {
        logger.info('Clock-IN: todos los empleados ya estan dentro.');
        return;
      }
      logger.info(`Clock-IN: ${pendientes.length} empleado(s) sin entrada: ${pendientes.map(e => e.fullName).join(', ')}`);
      for (const emp of pendientes) {
        try {
          await jibbleService.clockIn(emp.personId);
          logger.ok(`Clock-in automatico: ${emp.fullName}`);
          await sleep(500);
        } catch (error) {
          logger.error(`Clock-in fallido para ${emp.fullName}: ${JSON.stringify(error.response?.data || error.message)}`);
        }
      }
    } catch (error) {
      logger.error(`Clock-IN: error consultando Jibble: ${JSON.stringify(error.response?.data || error.message)}`);
    }
    logger.info('Auto clock-IN finalizado');
  }, { timezone: 'Europe/Madrid' });

  //  AUTO CLOCK-OUT a las 16:00 (L-V) 
  cron.schedule('0 16 * * 1-5', async () => {
    logger.info('Auto clock-OUT iniciado');
    try {
      const activos = await jibbleService.getActiveClockedIn();
      if (activos.length === 0) {
        logger.info('Clock-OUT: no hay empleados con entrada sin salida.');
        return;
      }
      logger.info(`Clock-OUT: ${activos.length} empleado(s) sin salida: ${activos.map(e => e.fullName).join(', ')}`);
      for (const emp of activos) {
        try {
          await jibbleService.clockOut(emp.personId);
          logger.ok(`Clock-out automatico: ${emp.fullName}`);
          await sleep(500);
        } catch (error) {
          const code = error.response?.data?.error?.code;
          if (code === 'invalid_interval_out_out') {
            logger.warn(`${emp.fullName} ya tenia salida registrada, se ignora.`);
          } else {
            logger.error(`Clock-out fallido para ${emp.fullName}: ${JSON.stringify(error.response?.data || error.message)}`);
          }
        }
      }
    } catch (error) {
      logger.error(`Clock-OUT: error consultando Jibble: ${JSON.stringify(error.response?.data || error.message)}`);
    }
    logger.info('Auto clock-OUT finalizado');
  }, { timezone: 'Europe/Madrid' });

  logger.info('Scheduler iniciado: clock-IN 08:00 y clock-OUT 16:00 (L-V, Europe/Madrid)');
};

export default startScheduler;
