import chalk from "chalk";
import { callLLM } from "../services/LLMService.js";
import { schemaRegistry } from "../utils/schemaRegistry.js";

export const parseQuery = async (userPrompt) => {
  console.log(chalk.green.bold(`[QueryParser] — Starting query Parsing`));

  const prompt = `
You are a smart assistant that extracts dependencies needed to fulfill a user's query.
Given the following schema:
${JSON.stringify(schemaRegistry, null, 2)}

**User Query**: "${userPrompt}"

Your task is to determine the necessary dependencies to fulfill this query. 
For each dependency, identify:
- The relevant collection (e.g., "contacts", "conversations", "schedule").
- The fields to retrieve from that collection (e.g., "name", "lastCheckInDate").
- Any filters required (e.g., "date: yesterday" for conversations).
- Optional sorting or limits (e.g., "sort by lastCheckInDate descending, limit 1").

Always format your response as JSON, like this:

{
  "dependencies": [
    {
      "collection": "<collection>",
      "fields": ["<fields>"],
      "filters": { <optional_filters> },
      "sort": { <optional_sorting> },
      "limit": <optional_limit>
    }
  ]
}

### Examples:

1. Query: "When is Ruth's birthday?"
Response:
{
  "dependencies": [
    {
      "collection": "contacts",
      "fields": ["name", "recurringEvents"],
      "filters": { "name": "Ruth", "recurringEvents.eventName": "Birthday" },
      "limit": 1
    }
  ]
}

2. Query: "What events are coming up for my contacts?"
Response:
{
  "dependencies": [
    {
      "collection": "contacts",
      "fields": ["name", "importantEvents", "recurringEvents"]
    },
    {
      "collection": "schedule",
      "fields": ["entries"],
      "filters": { "dateRange": "upcoming" }
    }
  ]
}

3. Query: "What did John and Jane say yesterday?"
Response:
{
  "dependencies": [
    {
      "collection": "conversations",
      "fields": ["checkInDetails.note"],
      "filters": { "contactName": ["John", "Jane"], "date": "yesterday" }
    }
  ]
}

4. Query: "Who was the last person I checked on?"
Response:
{
  "dependencies": [
    {
      "collection": "contacts",
      "fields": ["name", "lastCheckInDate"],
      "sort": { "lastCheckInDate": -1 },
      "limit": 1
    }
  ]
}
`;

  console.time(chalk.green(`[QueryParser] — Parsing Duration`));

  try {
    console.log(chalk.cyan.bold(`[QueryParser] — Sending Request to LLM`));
    const response = await callLLM(prompt);

    console.log(chalk.blue.bold(`[QueryParser] — Received Response from LLM`));
    const parsedResponse = JSON.parse(response);

    console.log(chalk.green.bold(`[QueryParser] — Parsed Response`));
    console.log(chalk.white(JSON.stringify(parsedResponse, null, 2)));

    // Validate the structure of the parsed response
    if (!Array.isArray(parsedResponse?.dependencies)) {
      throw new Error("Parsed response is missing 'dependencies'.");
    }

    console.timeEnd(chalk.green(`[QueryParser] — Parsing Duration`));
    console.log(chalk.green.bold(`[QueryParser] — Parsing Complete`));
    return parsedResponse;
  } catch (error) {
    console.timeEnd(chalk.red(`[QueryParser] — Parsing Duration`));
    console.error(chalk.red.bold(`[QueryParser] — Error Parsing query`));
    console.error(chalk.red(`[QueryParser] — ${error.message}`));

    return {
      dependencies: [],
      error: "Failed to parse user query. Please try again.",
    };
  }
};
