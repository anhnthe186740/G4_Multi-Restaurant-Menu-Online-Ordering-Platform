
import express from "express";
import { getMenuByTable, getServerIP, createPublicOrder } from "../controllers/publicController.js";
import { createServiceRequest } from '../controllers/publicController.js';


const router = express.Router();

router.get("/menu/:tableId", getMenuByTable);
router.post("/order", createPublicOrder);
router.get("/server-ip", getServerIP);

// Tạo yêu cầu phục vụ từ khách hàng (upsert logic)
router.post('/service-request', createServiceRequest);

export default router;
