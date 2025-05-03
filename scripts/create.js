#!/usr/bin/env node

import path from 'path';
import fs from 'fs-extra';
import slugify from 'slugify';
import axios from 'axios';
import dotenv from 'dotenv';

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
  console.log('Usage: npm run create <workflow-name>');
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
 * Creates a new workflow in n8n
 * @param {Object} workflowData The workflow data to create
 * @returns {Promise<Object>} The created workflow
 */
async function createWorkflowInN8n(workflowData) {
  try {
    // Prepare the request body according to n8n API schema
    const requestBody = {
      name: workflowData.name,
      nodes: [],
      connections: {},
      settings: {},
      staticData: null,
    };

    const response = await apiClient.post('/workflows', requestBody);
    console.log('n8n API Response:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('Error creating workflow in n8n:', error.message);
    if (error.response) {
      console.error('API response:', error.response.data);
    }
    process.exit(1);
  }
}

/**
 * Creates a new workflow locally and in n8n
 * @param {string} name The name of the workflow to create
 */
async function createWorkflow(name) {
  try {
    // Create folder name from the workflow name
    const folderName = slugify(name, { lower: true });
    const folderPath = path.join(process.cwd(), 'workflows', folderName);
    const filePath = path.join(folderPath, 'workflow.json');

    // Check if the folder already exists
    const folderExists = await fs.pathExists(folderPath);
    if (folderExists) {
      console.error(`Error: Workflow folder "${folderName}" already exists`);
      process.exit(1);
    }

    // Create directory
    await fs.ensureDir(folderPath);

    // Create basic workflow metadata
    const workflowData = {
      name: name,
      active: false,
      nodes: [],
      connections: {},
      settings: {},
      staticData: null,
    };

    // Create workflow in n8n
    console.log('Creating workflow in n8n...');
    const n8nWorkflow = await createWorkflowInN8n(workflowData);

    // Add id to our local data
    workflowData.id = n8nWorkflow.id;

    // Save workflow data to file
    await fs.writeJson(filePath, workflowData, { spaces: 2 });
    console.log(
      `Created new workflow at ${filePath} - Link: https://YOUR_BASE_URL/workflow/${workflowData.id}`
    );
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Execute the create function with the workflow name
createWorkflow(workflowName);
