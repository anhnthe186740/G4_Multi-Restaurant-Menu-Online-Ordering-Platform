import express from 'express';
import {
  getAllReports,
  getReportStats,
  getReportById,
  updateReportStatus,
  addReportResponse
} from '../controllers/adminReportsController.js';
import { authenticateToken, requireAdmin } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Reports management routes - authenticateToken MUST come before requireAdmin
router.get('/reports', authenticateToken, requireAdmin, getAllReports);
router.get('/reports/stats', authenticateToken, requireAdmin, getReportStats);
router.get('/reports/:id', authenticateToken, requireAdmin, getReportById);
router.put('/reports/:id/status', authenticateToken, requireAdmin, updateReportStatus);
router.post('/reports/:id/response', authenticateToken, requireAdmin, addReportResponse);

export default router;
