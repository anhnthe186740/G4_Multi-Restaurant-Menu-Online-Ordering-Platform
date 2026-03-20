import express from "express";
import { getMenuByTable, getServerIP, createPublicOrder } from "../controllers/publicController.js";

const router = express.Router();

router.get("/menu/:tableId", getMenuByTable);
router.post("/order", createPublicOrder);
router.get("/server-ip", getServerIP);

export default router;
