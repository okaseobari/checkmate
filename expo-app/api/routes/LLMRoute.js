import express from "express";
import {
  getEmbeddingsFromLLM,
  interactWithAgent,
} from "../controllers/LLMController.js";
import { protect } from "../middleware/authMiddleware.js";

const LLMRouter = express.Router();

// Protect all routes under this router
LLMRouter.use(protect);

// Route for generating embeddings from input text
LLMRouter.post("/get-embeddings", getEmbeddingsFromLLM);

// Route for calling the LLM to generate a response based on input prompt
LLMRouter.post("/interact", interactWithAgent);

export default LLMRouter;
