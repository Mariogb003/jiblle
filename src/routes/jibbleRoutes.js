import { Router } from 'express';
import jibbleController from '../controllers/jibbleController.js';
import authMiddleware from '../middlewares/auth.js';

const router = Router();
router.use(authMiddleware);

router.get('/debug/token', jibbleController.debugToken);
router.get('/status', jibbleController.getStatus);
router.get('/employees', jibbleController.getEmployees);
router.post('/employees', jibbleController.createEmployee);
router.get('/activities', jibbleController.getActivities);
router.post('/clock-in', jibbleController.clockIn);
router.post('/clock-out', jibbleController.clockOut);
router.post('/clock-in-all', jibbleController.clockInAll);
router.post('/break-in', jibbleController.breakIn);
router.post('/break-out', jibbleController.breakOut);
router.get('/attendance', jibbleController.getAttendance);

export default router;