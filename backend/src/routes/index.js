

import { Router } from 'express';
import authRoutes from './authRoutes.js';
import productRoutes from './productRoutes.js';
import adminUserRoutes from './adminUserRoutes.js';
import userRoutes from './userRoutes.js';
import categoryRoutes from './categoryRoutes.js';
import reviewRoutes from './reviewRoutes.js';
import orderRoutes from './orderRoutes.js';
import adminOrderRoutes from './adminOrderRoutes.js';
import adminDashboardRoutes from './adminDashboardRoutes.js';
import couponRoutes from './couponRoutes.js';
import metaRoutes from './metaRoutes.js';
import uploadRoutes from './uploadRoutes.js';
import bannerRoutes from './bannerRoutes.js';
import brandSectionRoutes from './brandSectionRoutes.js';
import brandRoutes from './brandRoutes.js';
import momoRoutes from './momoRoutes.js';
import reportRoutes from './reportRoutes.js';
import aiChatRoutes from './aiChatRoutes.js';

const router = Router();
router.get('/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));
router.use('/auth', authRoutes);
router.use('/ai-chat', aiChatRoutes);


// public + admin products
router.use('/', productRoutes);
router.use('/', reviewRoutes);
router.use('/', categoryRoutes);
router.use('/', orderRoutes);
router.use('/', couponRoutes);
router.use('/', momoRoutes);
router.use('/meta', metaRoutes);
router.use('/', uploadRoutes);
router.use('/', bannerRoutes);
router.use('/', brandSectionRoutes);
router.use('/', brandRoutes);
// admin users
router.use('/', adminUserRoutes);
router.use('/', adminOrderRoutes);
router.use('/admin/dashboard', adminDashboardRoutes);
router.use('/report', reportRoutes);
// me/profile
router.use('/', userRoutes);
export default router;