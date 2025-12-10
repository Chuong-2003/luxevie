import { Router } from 'express';
import { authenticate, requireAdmin, optionalAuth } from '../middlewares/auth.js';
import {
  listReviews,
  createReview,
  adminListReviews,
  adminDeleteReview,
} from '../controllers/reviewController.js';

const router = Router();

/** Public */
router.get('/products/:idOrSlug/reviews', listReviews);
router.post('/products/:idOrSlug/reviews', optionalAuth, createReview);

/** Admin */
router.get('/admin/reviews', /* authenticate, requireAdmin, */ adminListReviews);
router.delete('/admin/reviews/:id', /* authenticate, requireAdmin, */ adminDeleteReview);

export default router;
