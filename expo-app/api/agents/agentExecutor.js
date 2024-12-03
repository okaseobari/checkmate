import chalk from "chalk";
import { parseQuery } from "./queryParser.js";
import { resolveQueryDependencies } from "./queryDependencyResolver.js";
import { formatSupportingData } from "./formatSupportingData.js";
import { callLLM } from "../services/LLMService.js"; // callLLM only accepts a prompt

/**
 * Executes the user query by:
 * 1. Parsing the query to extract dependencies.
 * 2. Resolving dependencies from the parsed query.
 * 3. Formatting supporting data for the LLM.
 * 4. Constructing the final prompt and sending it to the LLM.
 *
 * Logs each stage of execution and handles errors gracefully.
 *
 * @param {string} userPrompt - The natural language query provided by the user.
 * @param {string} userId - The ID of the user making the request.
 * @returns {Object} - The response object with success status, message, and results.
 */
export const agentExecutor = async (userPrompt, userId) => {
  console.group(chalk.green.bold("[agentExecutor] Starting execution..."));
  console.log(
    chalk.blue("[agentExecutor] User Prompt:"),
    chalk.cyan(userPrompt)
  );

  try {
    // Step 1: Parse user query
    console.log(chalk.blue.bold("[agentExecutor] Parsing user query..."));
    const parsedQuery = await parseQuery(userPrompt);

    if (!Array.isArray(parsedQuery.dependencies)) {
      throw new Error(
        "Invalid query structure: 'dependencies' array is missing."
      );
    }

    // Step 2: Resolve dependencies
    console.log(chalk.blue.bold("[agentExecutor] Resolving dependencies..."));
    const resolvedDependencies = await resolveQueryDependencies(
      parsedQuery.dependencies,
      userId
    );

    // Step 3: Format supporting data
    console.log(
      chalk.blue.bold("[agentExecutor] Formatting supporting data...")
    );

    const supportingData = formatSupportingData({
      contactDetails: resolvedDependencies.contacts || [],
      conversationDetails: resolvedDependencies.conversations || [],
      scheduleDetails: resolvedDependencies.schedule || [],
    });

    console.log(
      chalk.yellow("[agentExecutor] Formatted Supporting Data:"),
      chalk.cyan(JSON.stringify(supportingData, null, 2))
    );

    // Step 4: Construct the final prompt and send to LLM
     // Step 4: Construct the final prompt and send to LLM
     const today = new Date().toISOString().split("T")[0]; // Get today's date in YYYY-MM-DD format
     const finalPrompt = `Date: ${today}\n\n${userPrompt}\n\nSupporting Data:\n${JSON.stringify(
       supportingData,
       null,
       2
     )}`;
    console.log(chalk.blue.bold("[agentExecutor] Sending prompt to LLM..."));
    const llmResponse = await callLLM(finalPrompt);

    console.log(
      chalk.green.bold("[agentExecutor] LLM output generated successfully.")
    );
    return {
      success: true,
      message: "LLM output generated successfully.",
      llmResponse,
    };
  } catch (error) {
    console.error(
      chalk.red.bold("[agentExecutor] Error during execution:"),
      error.message
    );
    return {
      success: false,
      message: "Failed to execute agent.",
      error: error.message,
    };
  } finally {
    console.groupEnd();
  }
};
