import express from 'express';
import { getMenuByTable } from '../controllers/publicController.js';

const router = express.Router();

// Lấy thông tin menu bằng Table ID
router.get('/menu/:tableId', getMenuByTable);

export default router;
