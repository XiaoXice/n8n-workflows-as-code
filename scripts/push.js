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

// Get workflow name from command line arguments
const workflowName = process.argv[2];
if (!workflowName) {
  console.error('Error: Workflow name argument is required');
  console.log('Usage: npm run push <workflow-name>');
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
 * Removes read-only properties from workflow data before API request
 * @param {Object} workflowData The workflow data to clean
 * @returns {Object} Cleaned workflow data
 */
function cleanWorkflowData(workflowData) {
  // Only include properties explicitly defined in the API schema
  const cleanData = {
    name: workflowData.name,
    nodes: workflowData.nodes.map(node => ({
      name: node.name,
      type: node.type,
      typeVersion: node.typeVersion,
      position: node.position,
      parameters: node.parameters,
      ...(node.webhookId && { webhookId: node.webhookId }),
      ...(node.disabled !== undefined && { disabled: node.disabled }),
      ...(node.notesInFlow !== undefined && { notesInFlow: node.notesInFlow }),
      ...(node.notes && { notes: node.notes }),
      ...(node.continueOnFail !== undefined && { continueOnFail: node.continueOnFail }),
      ...(node.credentials && { credentials: node.credentials }),
      ...(node.alwaysOutputData && { alwaysOutputData: node.alwaysOutputData }),
      ...(node.onError && { onError: node.onError }),
    })),
    connections: workflowData.connections,
    settings: workflowData.settings || {},
    staticData: workflowData.staticData,
  };

  return cleanData;
}

/**
 * Creates a new workflow in n8n
 * @param {Object} workflowData The workflow data to create
 * @returns {Promise<Object>} The created workflow
 */
async function createWorkflowInN8n(workflowData) {
  try {
    // Clean workflow data before sending
    const cleanedData = cleanWorkflowData(workflowData);
    const response = await apiClient.post('/workflows', cleanedData);
    return response.data;
  } catch (error) {
    console.error('Error creating workflow:', error.message);
    if (error.response) {
      console.error('API response:', error.response.data);
    }
    process.exit(1);
  }
}

/**
 * Updates an existing workflow in n8n
 * @param {string} id The workflow ID
 * @param {Object} workflowData The workflow data to update
 * @returns {Promise<Object>} The updated workflow
 */
async function updateWorkflowInN8n(id, workflowData) {
  try {
    // Clean workflow data before sending
    const cleanedData = cleanWorkflowData(workflowData);
    const response = await apiClient.put(`/workflows/${id}`, cleanedData);
    return response.data;
  } catch (error) {
    console.error('Error updating workflow:', error.message);
    if (error.response) {
      console.error('API response:', error.response.data);
    }
    process.exit(1);
  }
}

/**
 * Backup workflow file before pushing
 * @param {Object} workflowData The workflow data to backup
 * @param {string} folderPath Path to the workflow folder
 */
async function backupWorkflow(workflowData, folderPath) {
  // Check if backup is enabled - handle both string 'true' and boolean true
  const shouldBackup =
    process.env.BACKUP_WORKFLOWS_ON_PUSH === 'true' ||
    process.env.BACKUP_WORKFLOWS_ON_PUSH === true;
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
    const backupFileName = `workflow_backup_v${version}_PUSH.json`;
    const backupFilePath = path.join(backupsDir, backupFileName);

    // Save backup
    await fs.writeJson(backupFilePath, workflowData, { spaces: 2 });

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
    // Continue with regular push even if backup fails
  }
}

/**
 * Updates the local workflow file with new data
 * @param {string} filePath Path to the workflow file
 * @param {Object} workflowData New workflow data
 */
async function updateWorkflowFile(filePath, workflowData) {
  try {
    await fs.writeJson(filePath, workflowData, { spaces: 2 });
    console.log('Local workflow file updated successfully');
  } catch (error) {
    console.error('Error updating workflow file:', error.message);
    process.exit(1);
  }
}

/**
 * Main function to push a workflow to n8n
 * @param {string} name The name of the workflow to push
 */
async function pushWorkflow(name) {
  try {
    // Create folder name from the workflow name
    const folderName = slugify(name, { lower: true });
    const folderPath = path.join(process.cwd(), 'workflows', folderName);
    const filePath = path.join(folderPath, 'workflow.json');

    // Check if the workflow folder exists
    const folderExists = await fs.pathExists(folderPath);
    if (!folderExists) {
      console.error(`Error: Workflow folder "${folderName}" not found`);
      process.exit(1);
    }

    // Read workflow data from file
    const workflowData = await fs.readJson(filePath);

    // Backup workflow before pushing
    await backupWorkflow(workflowData, folderPath);

    console.log(`Pushing workflow: "${workflowData.name}" to n8n...`);

    let updatedWorkflow;
    if (!workflowData.id) {
      // Create new workflow if no ID exists
      console.log('No workflow ID found, creating new workflow...');
      updatedWorkflow = await createWorkflowInN8n(workflowData);
      console.log(`New workflow created with ID: ${updatedWorkflow.id}`);
    } else {
      // Update existing workflow
      console.log(`Updating existing workflow with ID: ${workflowData.id}`);
      updatedWorkflow = await updateWorkflowInN8n(workflowData.id, workflowData);
    }

    // Make sure to preserve the ID in our local file
    updatedWorkflow.id = updatedWorkflow.id || workflowData.id;

    // Update local file with latest data from n8n
    await updateWorkflowFile(filePath, updatedWorkflow);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Execute the push function with the workflow name
pushWorkflow(workflowName);
