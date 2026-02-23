import jibbleService from '../services/jibbleService.js';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const handleError = (res, error) => {
  const status = error.response?.status || 500;
  res.status(status).json({
    success: false,
    message: error.message,
    jibbleError: error.response?.data || null,
    url: error.config?.url || null,
  });
};

// GET /debug/token  — verifica que la autenticación funciona
const debugToken = async (req, res) => {
  try {
    const token = await jibbleService.getAuthToken();
    res.json({ success: true, token: token?.substring(0, 20) + '...' });
  } catch (error) {
    handleError(res, error);
  }
};

// GET /employees
const getEmployees = async (req, res) => {
  try {
    const employees = await jibbleService.getEmployees();
    res.json({ success: true, data: employees });
  } catch (error) {
    handleError(res, error);
  }
};

// POST /employees  body: { fullName, email }
const createEmployee = async (req, res) => {
  try {
    const { fullName, email } = req.body;
    if (!fullName || !email)
      return res.status(400).json({ success: false, message: 'fullName y email son requeridos' });

    const result = await jibbleService.createEmployee({ FullName: fullName, Email: email });
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    handleError(res, error);
  }
};

// POST /clock-in  body: { personId, activityId? }
const clockIn = async (req, res) => {
  try {
    const { personId, activityId } = req.body;
    if (!personId) return res.status(400).json({ success: false, message: 'personId es requerido' });

    const result = await jibbleService.clockIn(personId, activityId);
    res.json({ success: true, data: result });
  } catch (error) {
    handleError(res, error);
  }
};

// POST /clock-out  body: { personId }
const clockOut = async (req, res) => {
  try {
    const { personId } = req.body;
    if (!personId) return res.status(400).json({ success: false, message: 'personId es requerido' });

    const result = await jibbleService.clockOut(personId);
    res.json({ success: true, data: result });
  } catch (error) {
    const code = error.response?.data?.error?.code;
    if (code === 'invalid_interval_out_out') {
      return res.json({ success: true, message: 'El empleado ya tenía la salida registrada.' });
    }
    handleError(res, error);
  }
};

// POST /break-in  body: { personId }
const breakIn = async (req, res) => {
  try {
    const { personId } = req.body;
    if (!personId) return res.status(400).json({ success: false, message: 'personId es requerido' });

    const result = await jibbleService.breakIn(personId);
    res.json({ success: true, data: result });
  } catch (error) {
    handleError(res, error);
  }
};

// POST /break-out  body: { personId }
const breakOut = async (req, res) => {
  try {
    const { personId } = req.body;
    if (!personId) return res.status(400).json({ success: false, message: 'personId es requerido' });

    const result = await jibbleService.breakOut(personId);
    res.json({ success: true, data: result });
  } catch (error) {
    handleError(res, error);
  }
};

// GET /attendance?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
const getAttendance = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate || !DATE_RE.test(startDate) || !DATE_RE.test(endDate))
      return res.status(400).json({ success: false, message: 'startDate y endDate son requeridos en formato YYYY-MM-DD' });
    if (startDate > endDate)
      return res.status(400).json({ success: false, message: 'startDate no puede ser posterior a endDate' });

    const result = await jibbleService.getAttendance(startDate, endDate);
    res.json({ success: true, data: result });
  } catch (error) {
    handleError(res, error);
  }
};

// GET /activities
const getActivities = async (req, res) => {
  try {
    const activities = await jibbleService.getActivities();
    res.json({ success: true, data: activities });
  } catch (error) {
    handleError(res, error);
  }
};

// GET /status — consulta Jibble para ver quién tiene entrada sin salida hoy
const getStatus = async (req, res) => {
  try {
    const horaActual = new Date().toLocaleTimeString('es-ES', {
      timeZone: 'Europe/Madrid',
      hour: '2-digit',
      minute: '2-digit',
    });
    const activos = await jibbleService.getActiveClockedIn();
    res.json({
      success: true,
      horaActual,
      autoClockOut: '16:00 (L-V, Europe/Madrid)',
      empleadosSinSalida: activos,
    });
  } catch (error) {
    handleError(res, error);
  }
};

// POST /clock-in-all — fuerza clock-in a todos los que no tienen entrada hoy
const clockInAll = async (req, res) => {
  try {
    const pendientes = await jibbleService.getEmployeesNotClockedIn();
    if (pendientes.length === 0) {
      return res.json({ success: true, message: 'Todos los empleados ya tienen entrada hoy.', fichados: [] });
    }
    const resultados = [];
    for (const emp of pendientes) {
      try {
        await jibbleService.clockIn(emp.personId);
        resultados.push({ fullName: emp.fullName, ok: true });
        await sleep(500);
      } catch (error) {
        const code = error.response?.data?.error?.code;
        if (code === 'invalid_interval_in_in') {
          resultados.push({ fullName: emp.fullName, ok: true, nota: 'ya estaba dentro' });
        } else {
          resultados.push({ fullName: emp.fullName, ok: false, error: error.response?.data || error.message });
        }
      }
    }
    res.json({ success: true, fichados: resultados });
  } catch (error) {
    handleError(res, error);
  }
};

export default { debugToken, getEmployees, createEmployee, clockIn, clockOut, breakIn, breakOut, getAttendance, getActivities, getStatus, clockInAll };