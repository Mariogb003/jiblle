import express from 'express';
import expressLoader from './loaders/express.js';

const createApp = () => {
  const app = express();
  expressLoader(app);
  return app;
};

export default createApp;