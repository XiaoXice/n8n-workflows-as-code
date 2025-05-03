# n8n Workflows as Code

This project helps manage n8n workflows as code, allowing version control and collaborative workflow management through Git. It provides scripts to pull workflows from your n8n instance and store them as JSON files.

## Setup

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root directory with your n8n credentials:

   ```
   N8N_API_URL=your_n8n_instance_url
   N8N_API_KEY=your_n8n_api_key

   # Workflow Backup Configuration
   BACKUP_WORKFLOWS_ON_PULL=false
   BACKUP_WORKFLOWS_ON_PUSH=false
   ```

## Available Scripts

### Pull Workflow

Pulls a specific workflow from your n8n instance and saves it as JSON in the workflows directory.

```bash
npm run pull <workflow-name>
```

#### Features:

- Creates a directory for each workflow using a slugified version of the workflow name
- Saves the workflow as `workflow.json` in its dedicated directory
- Case-insensitive workflow name matching
- Prevents overwriting existing workflow files
- Shows available workflows if the specified workflow is not found
- Optionally creates backups when enabled in .env configuration

#### Example:

```bash
npm run pull "My Workflow"
```

This will:

1. Connect to your n8n instance
2. Find the workflow named "My Workflow"
3. Create a directory `workflows/my-workflow/`
4. Save the workflow as `workflows/my-workflow/workflow.json`
5. If backup is enabled, create a backup in the workflow's `backups` folder

### Push Workflow

Pushes a workflow from your local files to your n8n instance.

```bash
npm run push <workflow-name>
```

#### Features:

- Updates an existing workflow or creates a new one if it doesn't exist
- Handles the cleaning of workflow data for API compatibility
- Optionally creates backups before pushing when enabled in .env configuration

## Workflow Backup System

This project includes an automatic backup system for workflows during push and pull operations.

### How Backups Work

- When enabled, the system creates a `backups` folder inside each workflow's directory
- Each backup is versioned with an incremental number stored in `backup_version.json`
- Pull operations create backups named `workflow_backup_v<NUMBER>_PULL.json`
- Push operations create backups named `workflow_backup_v<NUMBER>_PUSH.json`

### Enabling Backups

To enable the backup functionality, set the following variables in your `.env` file:

```
BACKUP_WORKFLOWS_ON_PULL=true
BACKUP_WORKFLOWS_ON_PUSH=true
```

## Project Structure

```
.
├── workflows/                 # Directory containing workflow files
│   ├── workflow-name/         # Each workflow in its own directory
│   │   ├── workflow.json      # The workflow definition file
│   │   └── backups/           # Backup storage directory (when enabled)
│   │       ├── backup_version.json
│   │       ├── workflow_backup_v1_PULL.json
│   │       └── workflow_backup_v2_PUSH.json
├── scripts/                   # Automation scripts
│   ├── pull.js                # Script to pull workflows from n8n
│   └── push.js                # Script to push workflows to n8n
└── .env                       # Environment variables
```
