import OpenAI from "openai";

const configuration = {
  apiKey: process.env.OPENAI_API_KEY, // Ensure your environment variable is set securely
};

const client = new OpenAI(configuration);

// Function to get embeddings for a given text
export const getEmbeddings = async (inputText) => {
  try {
    const response = await client.embeddings.create({
      model: "text-embedding-ada-002", // Replace with your preferred embedding model
      input: inputText,
    });

    if (response.data && response.data.length > 0) {
      return response.data[0].embedding;
    } else {
      throw new Error("Failed to generate embeddings");
    }
  } catch (error) {
    throw new Error(`Error generating embeddings: ${error.message}`);
  }
};

// Function to call the LLM and get a response based on input
export const callLLM = async (prompt) => {
  try {
    //   const stream = await client.beta.chat.completions.stream({
    //     model: "gpt-4",
    //     messages: [{ role: "user", content: prompt }],
    //     stream: true,
    //   });

    //   stream.on("content", (delta, snapshot) => {
    //     process.stdout.write(delta);
    //   });

    //   // or, equivalently:
    //   for await (const chunk of stream) {
    //     process.stdout.write(chunk.choices[0]?.delta?.content || "");
    //   }

    const chatCompletion = await client.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-3.5-turbo",
    });

    //   const response = await openai.createCompletion({
    //     model: "text-davinci-003", // Replace with your preferred LLM model
    //     prompt: prompt,
    //     max_tokens: 150, // Customize based on your requirement
    //     temperature: 0.7, // Adjust for creativity level
    //   });

    if (chatCompletion && chatCompletion.choices.length > 0) {
      return chatCompletion.choices[0].message.content.trim();
    } else {
      throw new Error("Failed to generate a response");
    }
  } catch (error) {
    throw new Error(`Error generating LLM response: ${error.message}`);
  }
};
