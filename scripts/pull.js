#!/usr/bin/env node

import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs-extra';
import slugify from 'slugify';

// Load environment variables from .env file
dotenv.config();

// Check if N8N_API_URL and N8N_API_KEY are set
if (!process.env.N8N_API_URL || !process.env.N8N_API_KEY) {
  console.error('Error: N8N_API_URL and N8N_API_KEY must be set in .env file');
  process.exit(1);
}

// Get workflow identifier from command line arguments (can be ID or name)
const workflowIdentifier = process.argv[2];
if (!workflowIdentifier) {
  console.error('Error: Workflow identifier (ID or name) argument is required');
  console.log('Usage: npm run pull <workflow-id-or-name>');
  process.exit(1);
}

// Set up API client with auth header
const apiClient = axios.create({
  baseURL: process.env.N8N_API_URL,
  headers: {
    'X-N8N-API-KEY': process.env.N8N_API_KEY,
  },
});

/**
 * Attempts to fetch a workflow by its ID
 * @param {string} id The workflow ID to fetch
 * @returns {Promise<Object|null>} The workflow data or null if not found
 */
async function fetchWorkflowById(id) {
  try {
    const response = await apiClient.get(`/workflows/${id}`);
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      return null;
    }
    throw error;
  }
}

/**
 * Fetches all workflows from n8n
 * @returns {Promise<Array>} Array of workflows
 */
async function fetchAllWorkflows() {
  try {
    const response = await apiClient.get('/workflows');
    return response.data.data;
  } catch (error) {
    console.error('Error fetching workflows:', error.message);
    if (error.response) {
      console.error('API response:', error.response.data);
    }
    process.exit(1);
  }
}

/**
 * Backup workflow file before pulling
 * @param {Object} workflow The workflow data to backup
 * @param {string} folderPath Path to the workflow folder
 */
async function backupWorkflow(workflow, folderPath) {
  // Check if backup is enabled - handle both string 'true' and boolean true
  const shouldBackup =
    process.env.BACKUP_WORKFLOWS_ON_PULL === 'true' ||
    process.env.BACKUP_WORKFLOWS_ON_PULL === true;
  if (!shouldBackup) return;

  try {
    // Create backups directory if it doesn't exist inside the workflow folder
    const backupsDir = path.join(folderPath, 'backups');
    await fs.ensureDir(backupsDir);

    // Get version history or create new
    const backupsFilePath = path.join(backupsDir, 'backups.json');
    let backupsData = { versions: [] };

    if (await fs.pathExists(backupsFilePath)) {
      backupsData = await fs.readJson(backupsFilePath);
      // Ensure versions array exists
      if (!backupsData.versions) {
        backupsData.versions = [];
      }
    }

    // Calculate new version number
    const version =
      backupsData.versions.length > 0
        ? Math.max(...backupsData.versions.map(v => v.version)) + 1
        : 1;

    // Create backup file name
    const backupFileName = `workflow_backup_v${version}_PULL.json`;
    const backupFilePath = path.join(backupsDir, backupFileName);

    // Save backup
    await fs.writeJson(backupFilePath, workflow, { spaces: 2 });

    // Add version info to backups.json
    backupsData.versions.push({
      version,
      file: backupFileName,
      datetime: new Date().toISOString(),
    });

    // Save updated backups data
    await fs.writeJson(backupsFilePath, backupsData, { spaces: 2 });

    console.log(`Workflow backup saved to ${backupFilePath}`);
  } catch (error) {
    console.error(`Error backing up workflow: ${error.message}`);
    // Continue with regular save even if backup fails
  }
}

/**
 * Saves workflow to file
 * @param {Object} workflow The workflow data to save
 * @param {string} name The name of the workflow (used for folder name)
 */
async function saveWorkflow(workflow, name) {
  // Create folder name from the workflow name
  const folderName = slugify(name, { lower: true });
  const folderPath = path.join(process.cwd(), 'workflows', folderName);
  const filePath = path.join(folderPath, 'workflow.json');

  try {
    // Create directory if it doesn't exist
    await fs.ensureDir(folderPath);

    // Backup workflow if enabled
    await backupWorkflow(workflow, folderPath);

    // Save workflow data to file
    await fs.writeJson(filePath, workflow, { spaces: 2 });
    console.log(`Workflow saved successfully to ${filePath}`);
  } catch (error) {
    console.error(`Error saving workflow file: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Main function to pull a workflow by ID or name
 * @param {string} identifier The workflow ID or name to pull
 */
async function pullWorkflow(identifier) {
  try {
    console.log(`Looking up workflow with identifier: "${identifier}"...`);

    // First try to fetch by ID
    let workflow = await fetchWorkflowById(identifier);

    // If not found by ID, try to find by name
    if (!workflow) {
      console.log('Identifier not found as ID, searching by name...');
      const workflows = await fetchAllWorkflows();

      // Try to find workflow by exact name or slugified name match
      workflow = workflows.find(
        w =>
          w.name.toLowerCase() === identifier.toLowerCase() ||
          slugify(w.name, { lower: true }) === slugify(identifier, { lower: true })
      );

      if (!workflow) {
        console.error(
          `Workflow not found with ID or name: "${identifier}". Available workflows: ${workflows
            .map(w => `\n- ${w.name} (ID: ${w.id})`)
            .join('')}`
        );
        process.exit(1);
      }
    }

    console.log(`Found workflow: "${workflow.name}" (ID: ${workflow.id})`);

    // Save the workflow using its name from the API response
    await saveWorkflow(workflow, workflow.name);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Execute the pull function with the workflow identifier
pullWorkflow(workflowIdentifier);
