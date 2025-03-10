/**
 * Test script for Things 3 tag query
 *
 * This script retrieves tasks from Things 3 with a specific tag
 * as specified in the project requirements.
 */

const readline = require("readline");
const things3Api = require("../dist/things3/api");

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

/**
 * Find and list all tasks with a specific tag
 * @param {string} tag - The tag to search for
 */
async function findTasksWithTag(tag) {
  console.log(`Searching for tasks with tag: "${tag}"...`);

  try {
    // Get tasks with the specified tag
    const tasks = await things3Api.searchByTag(tag);

    // Remove duplicates by ID (in case the same task appears in multiple lists)
    const uniqueTasks = Array.from(
      new Map(tasks.map((task) => [task.id, task])).values()
    );

    // Display results
    if (uniqueTasks.length === 0) {
      console.log(`No tasks found with tag "${tag}".`);
    } else {
      console.log(`\nFound ${uniqueTasks.length} tasks with tag "${tag}":`);
      uniqueTasks.forEach((task, index) => {
        console.log(`\n${index + 1}. ${task.name} (${task.status})`);
        if (task.notes) console.log(`   Notes: ${task.notes}`);
        if (task.dueDate)
          console.log(`   Due: ${new Date(task.dueDate).toLocaleDateString()}`);
      });
    }

    return uniqueTasks;
  } catch (error) {
    console.error("Error:", error.message);
    return [];
  }
}

// Main function
async function main() {
  rl.question(
    'Enter the tag to search for in Things 3 (default: "do the thing"): ',
    async (tag) => {
      if (!tag) {
        console.log('No tag provided. Using default tag "do the thing".');
        tag = "do the thing";
      }

      const tasks = await findTasksWithTag(tag);

      // Close the readline interface
      rl.close();

      // Return the tasks (useful if this script is imported elsewhere)
      return tasks;
    }
  );
}

// Run the main function if this script is executed directly
if (require.main === module) {
  main();
}

// Export the function for use in other modules
module.exports = {
  findTasksWithTag,
};
