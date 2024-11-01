import express from "express";
import {
  getEmbeddings,
  callLLM,
  // analyzeText,
} from "../controllers/LLMController.js";
import { protect } from "../middleware/authMiddleware.js";

const LLMRouter = express.Router();

// Protect all routes under this router
LLMRouter.use(protect);

// Route for generating embeddings from input text
LLMRouter.post("/get-embeddings", getEmbeddings);

// Route for calling the LLM to generate a response based on input prompt
LLMRouter.post("/call-llm", callLLM);

// Analyze text
// LLMRouter.post("/analyzeText", analyzeText);

export default LLMRouter;
