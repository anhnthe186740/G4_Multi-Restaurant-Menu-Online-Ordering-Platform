import express from "express";
import { getMenuByTable, getServerIP } from "../controllers/publicController.js";

const router = express.Router();

router.get("/menu/:tableId", getMenuByTable);
router.get("/server-ip", getServerIP);

export default router;
