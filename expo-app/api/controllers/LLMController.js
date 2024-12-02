import { getEmbeddings, callLLM } from "../services/LLMService.js";
import { agentExecutor } from "../agents/agentExecutor.js";

// Get embeddings for a given text input
const getEmbeddingsFromLLM = async (req, res) => {
  try {
    const { inputText } = req.body;

    if (!inputText) {
      return res.status(400).json({ message: "Input text is required" });
    }

    // Call the LLM service to get embeddings
    const embeddings = await getEmbeddings(inputText);

    res.status(200).json({ embeddings });
  } catch (error) {
    res
      .status(500)
      .json({ message: `Failed to get embeddings: ${error.message}` });
  }
};

// Call the LLM for generating a response based on input text
const generateResponseFromLLM = async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ message: "Prompt is required" });
    }

    // Call the LLM service to get a response for the provided prompt
    const llmResponse = await callLLM(prompt);

    res.status(200).json({ response: llmResponse });
  } catch (error) {
    res.status(500).json({ message: `Failed to call LLM: ${error.message}` });
  }
};

// Ensure this is the correct path

export const interactWithAgent = async (req, res) => {
  try {
    const userId = req.user._id;
    const { prompt } = req.body; // User's prompt

    if (!prompt) {
      return res.status(400).json({ message: "prompt is required." });
    }

    // Pass the user prompt to the agentExecutor
    const response = await agentExecutor(prompt, userId);

    res.status(200).json({ result: response });
  } catch (error) {
    console.error(`Error interacting with agent: ${error.message}`);
    res.status(500).json({ message: "Failed to process query." });
  }
};

export { generateResponseFromLLM, getEmbeddingsFromLLM };
