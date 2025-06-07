// src/index.ts
import express from 'express';
import authRoutes from './routes/authRoute';
import { errorHandler } from './middleware/errorHandler';

const app = express();
app.use(express.json());

// mount routers
app.use('/api/auth', authRoutes);

// health-check
app.get('/', (req, res) => {
  res.send('Hello, world!');
});

// error-handler (must come after all routes)
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
