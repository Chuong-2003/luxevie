import { Router } from "express";
import { chatWithAi } from "../controllers/aiChatController.js";

const router = Router();

router.post("/", chatWithAi);

export default router;
