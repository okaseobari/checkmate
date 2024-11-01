
import LLMService from "../services/LLMService.js";

// Get embeddings for a given text input
const getEmbeddings = async (req, res) => {
  try {
    const { inputText } = req.body;

    if (!inputText) {
      return res.status(400).json({ message: "Input text is required" });
    }

    // Call the LLM service to get embeddings
    const embeddings = await LLMService.getEmbeddings(inputText);

    res.status(200).json({ embeddings });
  } catch (error) {
    res
      .status(500)
      .json({ message: `Failed to get embeddings: ${error.message}` });
  }
};

// Call the LLM for generating a response based on input text
const callLLM = async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ message: "Prompt is required" });
    }

    // Call the LLM service to get a response for the provided prompt
    const llmResponse = await LLMService.callLLM(prompt);

    res.status(200).json({ response: llmResponse });
  } catch (error) {
    res.status(500).json({ message: `Failed to call LLM: ${error.message}` });
  }
};

export { callLLM, getEmbeddings };
