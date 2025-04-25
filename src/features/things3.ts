/**
 * Things 3 API using JavaScript for Automation (JXA)
 * Focused on retrieving tasks with specific tags
 */

import { exec } from "child_process";
import { promisify } from "util";
import logger from "./logger";

const execAsync = promisify(exec);

export interface Things3Task {
  id: string;
  name: string;
  status: string;
  tags: string[];
  dueDate?: string;
  notes?: string;
}

/**
 * Execute JavaScript for Automation (JXA) code
 * @param script - The JXA script to execute
 * @returns The parsed result of the script execution
 */
async function executeJxa(script: string): Promise<any> {
  try {
    const { stdout } = await execAsync(
      `osascript -l JavaScript -e "JSON.stringify((function(){${script}})())"`,
      {
        maxBuffer: 1024 * 1024 * 10, // 10MB buffer for large responses
      }
    );

    return JSON.parse(stdout);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    logger.error("Error executing JXA script:", errorMessage);
    if (errorMessage.includes("Application can't be found")) {
      throw new Error(
        "Things 3 application not found. Make sure it is running."
      );
    }
    throw error;
  }
}

/**
 * Search for todos with a specific tag
 * @param tag - The tag to search for
 * @returns Array of matching todo objects
 */
export async function searchByTag(tag: string): Promise<Things3Task[]> {
  logger.info(`Searching Things3 for tasks with tag: ${tag}`);
  return executeJxa(`
    const things = Application('Things3');
    let matchingTodos = [];
    
    const todos = things.lists.byName('Today').toDos();
    for (const todo of todos) {
      const tags = todo.tagNames();
        if (tags && tags.includes('${tag}')) {
          matchingTodos.push({
            id: todo.id(),
            name: todo.name(),
            status: todo.status(),
            tags: tags,
            dueDate: todo.dueDate() && todo.dueDate().toISOString(),
            notes: todo.notes()
          });
        }
      }
    
    return matchingTodos;
  `);
}
