import axios from 'axios';
import config from '../config.js';

// Caché del token — se reutiliza hasta 5 minutos antes de que expire
let _tokenCache = null; // { token, expiresAt }

const getAuthToken = async () => {
  const now = Date.now();
  if (_tokenCache && now < _tokenCache.expiresAt) return _tokenCache.token;

  const response = await axios.post(
    config.jibble.authUrl,
    new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: config.jibble.apiKeyId,
      client_secret: config.jibble.apiKeySecret,
    }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );

  const ttl = (response.data.expires_in ?? 3600) * 1000;
  _tokenCache = { token: response.data.access_token, expiresAt: now + ttl - 5 * 60 * 1000 };
  return _tokenCache.token;
};

// Obtener lista de empleados
const getEmployees = async () => {
  const token = await getAuthToken();
  const response = await axios.get(`${config.jibble.workspaceUrl}/People`, {
    headers: { Authorization: `Bearer ${token}` },
    params: { '$select': 'id,fullName,email,groupId' },
  });
  return response.data;
};

// Crear/invitar un nuevo empleado
const createEmployee = async (data) => {
  const token = await getAuthToken();
  const response = await axios.post(`${config.jibble.workspaceUrl}/People`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

const PLATFORM = {
  clientVersion: 'api 1.0',
  os: 'Server',
  deviceModel: 'API',
  deviceName: 'JibbleBackend',
};

// Helper interno para crear una TimeEntry
const postTimeEntry = async (personId, type, activityId = null) => {
  const token = await getAuthToken();
  const payload = { personId, type, clientType: 'Web', platform: PLATFORM };
  if (activityId) payload.activityId = activityId;
  const response = await axios.post(
    `${config.jibble.timeTrackingUrl}/TimeEntries`,
    payload,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};

// Registrar entrada (clock in)
const clockIn = (personId, activityId = null) => postTimeEntry(personId, 'In', activityId);

// Registrar salida (clock out)
const clockOut = (personId) => postTimeEntry(personId, 'Out');

// Iniciar descanso → internamente es un clock-out
const breakIn = (personId) => postTimeEntry(personId, 'Out');

// Finalizar descanso → internamente es un clock-in
const breakOut = (personId, activityId = null) => postTimeEntry(personId, 'In', activityId);

// Devuelve true si el empleado tiene una sesión activa (entró hoy y no ha salido)
const isActiveSession = (ts) => {
  const day = ts.daily?.[0];
  return !!(day?.firstIn && !day?.endTime);
};

// Obtener empleados que AÚN NO están fichados (sin sesión activa ahora mismo)
const getEmployeesNotClockedIn = async () => {
  const token = await getAuthToken();
  const today = new Date().toISOString().slice(0, 10);

  // Obtener todos los empleados activos
  const peopleRes = await axios.get(`${config.jibble.workspaceUrl}/People`, {
    headers: { Authorization: `Bearer ${token}` },
    params: { '$select': 'id,fullName,status' },
  });
  const allPeople = (peopleRes.data.value || []).filter(p =>
    p.status === 'Joined' || p.status === 'Invited' || p.status === 'Active'
  );

  // Obtener timesheets de hoy
  const tsRes = await axios.get(`${config.jibble.attendanceUrl}/Timesheets`, {
    headers: { Authorization: `Bearer ${token}` },
    params: { date: today, period: 'Custom', endDate: today },
  });

  // Un empleado está activo si: tiene firstIn Y endTime es null
  const currentlyIn = new Set(
    (tsRes.data.value || [])
      .filter(isActiveSession)
      .map(ts => ts.personId)
  );

  // Devolver los que NO están activos ahora mismo
  return allPeople
    .filter(p => !currentlyIn.has(p.id))
    .map(p => ({ personId: p.id, fullName: p.fullName }));
};

// Obtener empleados que ficharon entrada HOY pero NO han fichado salida
const getActiveClockedIn = async () => {
  const token = await getAuthToken();
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const response = await axios.get(`${config.jibble.attendanceUrl}/Timesheets`, {
    headers: { Authorization: `Bearer ${token}` },
    params: { '$expand': 'person', date: today, period: 'Custom', endDate: today },
  });

  const timesheets = response.data.value || [];

  return timesheets
    .filter(isActiveSession)
    .map(ts => ({
      personId: ts.personId,
      fullName: ts.person?.fullName || 'Desconocido',
      firstIn: ts.daily?.[0]?.firstIn,
    }));
};

// Obtener registros de asistencia
const getAttendance = async (startDate, endDate) => {
  const token = await getAuthToken();
  const response = await axios.get(`${config.jibble.attendanceUrl}/Timesheets`, {
    headers: { Authorization: `Bearer ${token}` },
    params: { '$expand': 'person', date: startDate, period: 'Custom', endDate },
  });
  return response.data;
};

// Obtener lista de actividades
const getActivities = async () => {
  const token = await getAuthToken();
  const response = await axios.get(`${config.jibble.workspaceUrl}/Activities`, {
    headers: { Authorization: `Bearer ${token}` },
    params: { '$select': 'id,name,code' },
  });
  return response.data;
};

export default { getAuthToken, getEmployees, createEmployee, clockIn, clockOut, breakIn, breakOut, getAttendance, getActivities, getActiveClockedIn, getEmployeesNotClockedIn };