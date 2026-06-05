import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import statsRoutes from './routes/stats';
import departmentRoutes from './routes/departments';
dotenv.config();

import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import courseRoutes from './routes/courses';
import questionRoutes from './routes/questions';
import paymentRoutes from './routes/payments';
import notificationRoutes from './routes/notifications';
import deviceRoutes from './routes/devices';
import studentRoutes from './routes/student';
import unlockRequestRoutes from './routes/unlock-requests';
import supportRoutes from './routes/support';


const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/unlock-requests', unlockRequestRoutes);
app.use('/api/support', supportRoutes);

app.get('/', (_req, res) => {
  res.json({
    message: 'Exora Backend is running',
    version: '1.0.0',
    docs: '/api',
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));