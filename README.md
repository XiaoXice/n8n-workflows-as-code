# n8n Workflows as Code

[![中文文档](https://img.shields.io/badge/docs-中文-blue.svg)](./README_CN.md)

This project helps manage n8n workflows as code, enabling version control and collaborative workflow management through Git. It provides comprehensive tools for both traditional workflow management and advanced modular workflow organization.

## Key Features

- 🔄 **Bidirectional Conversion**: Convert between monolithic JSON workflows and modular project structures
- 📁 **Modular Organization**: Organize nodes by function (triggers, processors, integrations, AI)
- 🤖 **AI-Friendly**: Semantic naming, YAML format, rich documentation
- ✅ **Configuration Validation**: Built-in validation tools ensure configuration correctness
- 🎯 **Version Control Optimized**: Avoid large file conflicts, support granular version management
- 🔌 **n8n API Integration**: Pull/push workflows directly from/to your n8n instance

## Documentation

- 📖 **[中文文档](./README_CN.md)** - Complete Chinese documentation
- 📋 **[n8n JSON Format Specification](./n8n-json-format-specification.md)** - Detailed n8n workflow JSON format analysis
- 🏗️ **[Modular Project Structure](./n8n-modular-project-structure.md)** - AI-friendly modular project structure specification

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

### Modular Workflow Management (NEW!)

These new commands allow you to work with workflows in a modular, AI-friendly format that's optimized for version control and team collaboration.

#### Unpack Workflow

Convert a monolithic n8n workflow JSON file into a modular project structure:

```bash
# Using workflow name (recommended)
npm run unpack <workflow-name>

# Using full file path (if needed)
npm run unpack <workflow.json> <output-directory>

# Using node directly
node scripts/unpack.js <workflow-name-or-path>
```

**Examples:**
```bash
# Unpack by workflow name (unpacks to the same directory)
npm run unpack "My Workflow"

# Unpack with custom paths
npm run unpack workflows/my-workflow/workflow.json workflows/custom-output
```

**Features:**
- Automatically categorizes nodes by function (triggers, processors, integrations, AI)
- Creates semantic file names and directory structure
- Extracts connections, settings, and data into separate YAML files
- Generates project documentation and package.json
- AI-friendly with rich metadata and comments

#### Pack Workflow

Convert a modular project structure back into a n8n-compatible JSON workflow:

```bash
# Using workflow name (recommended)
npm run pack <workflow-name>

# Using custom directory path
npm run pack <project-directory>

# Using node directly
node scripts/pack.js <workflow-name-or-directory>
```

**Examples:**
```bash
# Pack by workflow name
npm run pack "My Workflow"

# Pack with custom directory
npm run pack workflows/my-custom-workflow
```

**Features:**
- Rebuilds complete workflow structure from modular components
- Validates configuration integrity during build process
- Generates standard n8n JSON format
- Preserves all workflow functionality and metadata

#### Validate Configuration

Validate the integrity and correctness of a modular workflow project:

```bash
# Using workflow name (recommended)
npm run validate <workflow-name>

# Using custom directory path
npm run validate <project-directory>

# Using node directly
node scripts/validate.js <workflow-name-or-directory>
```

**Examples:**
```bash
# Validate by workflow name
npm run validate "My Workflow"

# Validate with custom directory
npm run validate workflows/my-custom-workflow
```

**Features:**
- Checks required files and directory structure
- Validates node configuration formats
- Verifies connection reference integrity
- Validates credential mappings

### Traditional Workflow Management

#### Pull Workflow

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

### Traditional Workflow Structure
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
│   ├── push.js                # Script to push workflows to n8n
│   ├── unpack.js              # Script to unpack workflows to modular structure
│   ├── pack.js                # Script to pack modular structure to JSON
│   └── validate.js            # Script to validate modular configurations
└── .env                       # Environment variables
```

### Modular Workflow Structure

When using the modular workflow commands, each workflow is organized as follows:

```
workflows/my-workflow-modular/
├── README.md                          # Project documentation
├── workflow.yaml                      # Main workflow configuration
├── package.json                       # Project dependencies and scripts
├── nodes/                             # Node definitions by category
│   ├── triggers/                      # Trigger nodes
│   │   ├── manual-trigger.yaml
│   │   └── webhook-trigger.yaml
│   ├── processors/                    # Data processing nodes
│   │   ├── http-request.yaml
│   │   └── data-transform.yaml
│   ├── integrations/                  # Third-party service integrations
│   │   ├── google-sheets.yaml
│   │   └── slack-notification.yaml
│   └── ai/                           # AI and LangChain nodes
│       ├── openai-chat.yaml
│       └── vector-search.yaml
├── connections/                       # Connection definitions
│   ├── main-flow.yaml                # Primary data flow
│   └── error-handling.yaml           # Error handling flow
├── settings/                          # Workflow settings
│   ├── execution.yaml                # Execution settings
│   └── error-handling.yaml           # Error handling settings
├── credentials/                       # Credential configurations
│   ├── credential-mappings.yaml      # Credential mappings
│   └── .env.example                  # Environment variable examples
├── data/                             # Data files
│   ├── static/                       # Static data
│   └── pinned/                       # Pinned test data
└── workflow.json                     # Generated workflow file (after packing)
```

For detailed information about the modular structure, see the [Modular Project Structure Documentation](./n8n-modular-project-structure.md).
