import chalk from "chalk";
import { fetchContacts } from "../utils/contactUtils.js";
import { fetchConversations } from "../utils/conversationUtils.js";
import { fetchSchedule } from "../utils/scheduleUtils.js";

const CLASS_NAME = "QueryResolver";

const handlers = {
  contacts: fetchContacts,
  conversations: fetchConversations,
  schedule: fetchSchedule,
};

/**
 * Resolves a single dependency.
 * @param {Object} dependency - The dependency to resolve.
 * @param {string} userId - The ID of the user making the request.
 * @param {Array} contactIds - Previously resolved contact IDs, if applicable.
 * @returns {Object} Resolved data for the dependency.
 */
const resolveDependency = async (dependency, userId, contactIds) => {
  const { collection, fields, filters, sort, limit } = dependency;

  if (!handlers[collection]) {
    throw new Error(`Unsupported collection: ${collection}`);
  }

  console.group(chalk.blue.bold(`[${CLASS_NAME}] Resolving ${collection}`));
  console.time(`[${CLASS_NAME}] Resolve ${collection}`);

  try {
    // Call the appropriate handler for the collection
    const data = await handlers[collection]({
      userId,
      fields: fields || [], // Default to empty array
      filters: {
        ...filters,
        ...(collection === "conversations" && contactIds?.length
          ? { contactIds }
          : {}),
      },
      sort: sort || {}, // Default to empty object
      limit: limit || 0, // Default to no limit
    });

    // console.log(chalk.green(`Resolved Data:`), data);
    return data;
  } catch (error) {
    console.error(
      chalk.red.bold(`[${CLASS_NAME}] Failed to Resolve ${collection}`),
      error.message
    );
    throw new Error(`Failed to resolve ${collection}: ${error.message}`);
  } finally {
    console.timeEnd(`[${CLASS_NAME}] Resolve ${collection}`);
    console.groupEnd();
  }
};

/**
 * Resolves all dependencies for a query.
 * @param {Array} dependencies - List of dependencies to resolve.
 * @param {string} userId - The ID of the user making the request.
 * @returns {Object} Resolved dependencies grouped by collection.
 */
export const resolveQueryDependencies = async (dependencies, userId) => {
  console.group(chalk.green.bold(`[${CLASS_NAME}] Resolving Query`));

  if (!Array.isArray(dependencies) || dependencies.length === 0) {
    console.error(chalk.red(`[${CLASS_NAME}] No dependencies to resolve.`));
    throw new Error("Dependencies structure is invalid or empty.");
  }

  const resolvedDependencies = {};
  let contactIds = []; // Track resolved contact IDs for reuse

  for (const dependency of dependencies) {
    const { collection } = dependency;

    if (!handlers[collection]) {
      console.error(
        chalk.red.bold(`[${CLASS_NAME}] Invalid collection: ${collection}`)
      );
      throw new Error(`Invalid collection: ${collection}`);
    }

    console.group(chalk.blue.bold(`[${CLASS_NAME}] Processing ${collection}`));
    try {
      const resolvedData = await resolveDependency(
        dependency,
        userId,
        contactIds
      );

      // Store resolved data
      resolvedDependencies[collection] = resolvedData;

      // Update contactIds if resolving contacts
      if (collection === "contacts" && Array.isArray(resolvedData)) {
        contactIds = resolvedData.map((item) => item._id.toString()); // Ensure IDs are strings
        console.log(
          chalk.yellow(`[${CLASS_NAME}] Updated contactIds:`),
          contactIds
        );
      }
    } catch (error) {
      console.error(
        chalk.red.bold(`[${CLASS_NAME}] Failed to Resolve ${collection}`),
        error.message
      );
      throw new Error(`Failed to process ${collection}: ${error.message}`);
    } finally {
      console.groupEnd();
    }
  }

  console.log(chalk.green.bold(`[${CLASS_NAME}] All Dependencies Resolved:`));
  // console.log(chalk.cyan(JSON.stringify(resolvedDependencies, null, 2)));

  console.groupEnd();
  return resolvedDependencies;
};
