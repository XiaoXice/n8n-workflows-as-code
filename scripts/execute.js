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

// Get workflow identifier from command line arguments
const workflowIdentifier = process.argv[2];
if (!workflowIdentifier) {
  console.error('Error: Workflow identifier (ID, name, or slugified name) is required');
  console.log('Usage: npm run execute <workflow-identifier>');
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
 * Finds webhook trigger node and returns its webhook path
 * @param {Object} workflow The workflow data
 * @returns {string|null} Webhook path if found, null otherwise
 */
function findWebhookPath(workflow) {
  const webhookNode = workflow.nodes.find(
    node => node.type === 'n8n-nodes-base.webhook' || node.type === 'n8n-nodes-base.webhookTrigger'
  );

  return webhookNode?.parameters?.path || null;
}

/**
 * Executes a workflow by its ID
 * @param {string} id The workflow ID to execute
 * @param {Object} workflow The workflow data
 * @returns {Promise<Object>} The execution result
 */
async function executeWorkflow(id, workflow) {
  try {
    const webhookPath = findWebhookPath(workflow);

    if (webhookPath) {
      // Extract base URL from N8N_API_URL
      const baseUrl = process.env.N8N_API_URL.split('/api/')[0];
      const webhookUrl = `${baseUrl}/webhook/${webhookPath}`;

      console.log('Activating workflow...');
      await apiClient.post(`/workflows/${id}/activate`);

      console.log(`Executing webhook workflow at: ${webhookUrl}`);

      try {
        // Execute the webhook using axios
        const response = await axios.get(webhookUrl);
        const result = response.data;
        return result;
      } catch (error) {
        if (error.response) {
          console.error('Webhook execution error:', error.response.data);
          throw error;
        }
        throw error;
      }
    } else {
      // Handle manual trigger or other types
      const response = await apiClient.post(`/workflows/${id}/trigger`, {
        workflowData: {
          startNodes: ['Manual'],
        },
      });
      console.log('Workflow triggered successfully');
      return response.data;
    }
  } catch (error) {
    console.error('Error executing workflow:', error.message);
    if (error.response) {
      console.error('API response:', error.response.data);
    }
    throw error;
  }
}

/**
 * Main function to execute a workflow using various identifiers
 * @param {string} identifier The workflow ID, name, or slugified name
 */
async function executeWorkflowByIdentifier(identifier) {
  try {
    console.log(`Looking up workflow with identifier: "${identifier}"...`);

    // First try to fetch by ID directly
    let workflow = await fetchWorkflowById(identifier);

    // If not found by ID, try to find by name or slugified name
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
        // Try to find by looking up the workflow.json file
        const folderName = slugify(identifier, { lower: true });
        const filePath = path.join(process.cwd(), 'workflows', folderName, 'workflow.json');

        try {
          workflow = await fs.readJson(filePath);
          if (workflow.id) {
            const remoteWorkflow = await fetchWorkflowById(workflow.id);
            if (remoteWorkflow) {
              workflow = remoteWorkflow;
            }
          }
        } catch (err) {
          // If file doesn't exist or can't be read, continue with error
        }

        if (!workflow) {
          console.error(
            `Workflow not found with ID, name, or slug: "${identifier}". Available workflows: ${workflows
              .map(w => `\n- ${w.name} (ID: ${w.id})`)
              .join('')}`
          );
          process.exit(1);
        }
      }
    }

    console.log(`Found workflow: "${workflow.name}" (ID: ${workflow.id})`);

    // Execute the workflow
    console.log('Executing workflow...');
    const result = await executeWorkflow(workflow.id, workflow);
    console.log('Execution completed successfully');
    if (result) {
      console.log('Result:', JSON.stringify(result, null, 2));
    }
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Execute the workflow with the provided identifier
executeWorkflowByIdentifier(workflowIdentifier);
