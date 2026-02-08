import { Router } from 'express';

const router = Router();

router.get('/', (_req, res) => {
  res.send('Hello from Express + TypeScript!');
});

router.get('/health', (_req, res) => {
  res.send('App is Healthy');
});

router.get('/info', (_req, res) => {
  res.send('This is info endpoint ');
});


export default router;
