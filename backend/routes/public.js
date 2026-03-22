
import express from "express";
import { getMenuByTable, getServerIP, createPublicOrder, createServiceRequest, getPublicOrderByTable } from "../controllers/publicController.js";

const router = express.Router();

router.get("/menu/:tableId",          getMenuByTable);
router.post("/order",                 createPublicOrder);
router.get("/server-ip",             getServerIP);
router.post("/service-request",      createServiceRequest);
router.get("/table/:tableId/order",  getPublicOrderByTable);

export default router;
