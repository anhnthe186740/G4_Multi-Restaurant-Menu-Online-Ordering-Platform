import express from 'express';
import { getMenuByTable, createServiceRequest } from '../controllers/publicController.js';

const router = express.Router();

// Lấy thông tin menu bằng Table ID
router.get('/menu/:tableId', getMenuByTable);

// Tạo yêu cầu phục vụ từ khách hàng (upsert logic)
router.post('/service-request', createServiceRequest);

export default router;
