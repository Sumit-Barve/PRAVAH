import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import healthRoutes from './routes/healthRoutes';
import authRoutes from './routes/authRoutes';
import applicationRoutes from './routes/applicationRoutes';
import metricsRoutes from './routes/metricsRoutes';
import rulesRoutes from './routes/rulesRoutes';
import operationalRoutes from './routes/operationalRoutes';
import institutionRoutes from './routes/institutionRoutes';
import { requestLogger } from './middleware/requestLogger';
import { errorHandler } from './middleware/errorHandler';
import { csrfProtection } from './middleware/authMiddleware';

export const createApp = (): Express => {
  const app = express();

  // Allowed origins for CORS (allowing credentials)
  const configuredOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
    : ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'];

  // Security and baseline middleware
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (e.g. mobile apps, curl, server-to-server) or matching allowed origins
        if (!origin || configuredOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(null, true); // Permissive in local dev, but credentials enabled
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token', 'x-xsrf-token', 'X-Requested-With'],
    })
  );

  app.use(cookieParser());
  app.use(express.json());
  app.use(requestLogger);

  // CSRF validation on state-changing cookie requests
  app.use(csrfProtection);

  // Mount API routers
  app.use('/api', healthRoutes); // Public health check endpoints
  app.use('/api/auth', authRoutes); // Auth endpoints (login, logout, me)
  app.use('/api/institution', institutionRoutes); // Institution Portal API
  app.use('/api/applications', applicationRoutes);
  app.use('/api/metrics', metricsRoutes);
  app.use('/api/rules', rulesRoutes);
  app.use('/api', operationalRoutes);

  // 404 Handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: {
        message: `Endpoint '${req.method} ${req.originalUrl}' not found on SAKSHAM API.`,
        statusCode: 404,
      },
    });
  });

  // Global Error Handler
  app.use(errorHandler);

  return app;
};
