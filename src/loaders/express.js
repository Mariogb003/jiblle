import express from 'express';
import jibbleRoutes from '../routes/jibbleRoutes.js';

export default (app) => {
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check sin autenticación — útil para monitoreo/uptime
  app.get('/health', (_req, res) => res.json({ ok: true, ts: new Date().toISOString() }));

  app.use('/api/jibble', jibbleRoutes);

  app.use((err, req, res, next) => {
    res.status(err.status || 500).json({ success: false, message: err.message });
  });
};