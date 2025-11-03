#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import slugify from 'slugify';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class WorkflowUnpacker {
    constructor(workflowPath, outputDir) {
        this.workflowPath = workflowPath;
        this.outputDir = outputDir;
        this.workflow = null;
    }

    async unpack() {
        console.log(`解包工作流: ${this.workflowPath}`);
        
        // 1. 读取并解析工作流文件
        await this.loadWorkflow();
        
        // 2. 创建输出目录结构
        await this.createDirectoryStructure();
        
        // 3. 生成主配置文件
        await this.generateMainConfig();
        
        // 4. 分离节点定义
        await this.extractNodes();
        
        // 5. 分离连接定义
        await this.extractConnections();
        
        // 6. 分离设置配置
        await this.extractSettings();
        
        // 7. 分离数据文件
        await this.extractData();
        
        // 8. 生成 package.json
        await this.generatePackageJson();
        
        console.log(`解包完成: ${this.outputDir}`);
    }

    async loadWorkflow() {
        try {
            const content = fs.readFileSync(this.workflowPath, 'utf8');
            this.workflow = JSON.parse(content);
        } catch (error) {
            throw new Error(`无法读取工作流文件: ${error.message}`);
        }
    }

    async createDirectoryStructure() {
        const dirs = [
            this.outputDir,
            path.join(this.outputDir, 'nodes'),
            path.join(this.outputDir, 'nodes', 'triggers'),
            path.join(this.outputDir, 'nodes', 'processors'),
            path.join(this.outputDir, 'nodes', 'integrations'),
            path.join(this.outputDir, 'nodes', 'ai'),
            path.join(this.outputDir, 'connections'),
            path.join(this.outputDir, 'settings'),
            path.join(this.outputDir, 'credentials'),
            path.join(this.outputDir, 'data'),
            path.join(this.outputDir, 'data', 'static'),
            path.join(this.outputDir, 'data', 'pinned'),
            path.join(this.outputDir, 'scripts'),
            path.join(this.outputDir, 'docs')
        ];

        dirs.forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }

    async generateMainConfig() {
        const config = {
            metadata: {
                id: this.workflow.id,
                name: this.workflow.name,
                description: `工作流: ${this.workflow.name}`,
                version: "1.0.0",
                author: "n8n-workflows-as-code",
                tags: this.workflow.tags || [],
                created_at: this.workflow.createdAt,
                updated_at: this.workflow.updatedAt,
                active: this.workflow.active || false,
                archived: this.workflow.isArchived || false,
                trigger_count: this.workflow.triggerCount || 0
            },
            includes: {
                nodes: "./nodes/**/*.yaml",
                connections: "./connections/**/*.yaml", 
                settings: "./settings/**/*.yaml",
                credentials: "./credentials/credential-mappings.yaml",
                data: {
                    static: "./data/static/**/*.yaml",
                    pinned: "./data/pinned/**/*.yaml"
                }
            },
            build: {
                output: "./workflow.json",
                validate: true,
                minify: false
            }
        };

        const yamlContent = yaml.dump(config, { 
            defaultFlowStyle: false, 
            lineWidth: -1,
            indent: 2
        });
        
        fs.writeFileSync(
            path.join(this.outputDir, 'workflow.yaml'), 
            yamlContent
        );
    }

    async extractNodes() {
        if (!this.workflow.nodes || !Array.isArray(this.workflow.nodes)) {
            return;
        }

        const credentialsUsed = new Set();

        this.workflow.nodes.forEach(node => {
            // 分类节点
            const category = this.categorizeNode(node.type);
            const nodeDir = path.join(this.outputDir, 'nodes', category);
            
            // 清理节点名称作为文件名
            const fileName = this.sanitizeFileName(node.name) + '.yaml';
            const filePath = path.join(nodeDir, fileName);

            // 收集凭据信息
            if (node.credentials) {
                Object.keys(node.credentials).forEach(credType => {
                    credentialsUsed.add(credType);
                });
            }

            // 构建节点配置
            const nodeConfig = {
                node: {
                    id: node.id,
                    name: node.name,
                    description: this.getNodeDescription(node.type),
                    type: node.type,
                    type_version: node.typeVersion,
                    position: {
                        x: node.position[0],
                        y: node.position[1]
                    },
                    parameters: node.parameters || {},
                    settings: {
                        disabled: node.disabled || false,
                        continue_on_fail: node.continueOnFail || false,
                        always_output_data: node.alwaysOutputData || false,
                        execute_once: node.executeOnce || false,
                        retry_on_fail: node.retryOnFail || false,
                        max_tries: node.maxTries || 3,
                        wait_between_tries: node.waitBetweenTries || 1000
                    },
                    notes: node.notes || "",
                    color: node.color || "",
                    tags: this.getNodeTags(node.type),
                    category: category
                }
            };

            // 添加凭据信息
            if (node.credentials) {
                nodeConfig.node.credentials = node.credentials;
            }

            // 添加 webhookId
            if (node.webhookId) {
                nodeConfig.node.webhookId = node.webhookId;
            }

            const yamlContent = yaml.dump(nodeConfig, {
                defaultFlowStyle: false,
                lineWidth: -1,
                indent: 2
            });

            fs.writeFileSync(filePath, yamlContent);
        });

        // 生成凭据映射文件
        await this.generateCredentialMappings(credentialsUsed);
    }

    categorizeNode(nodeType) {
        // 触发器节点
        if (nodeType.includes('trigger') || nodeType.includes('webhook') || nodeType.includes('cron')) {
            return 'triggers';
        }
        
        // AI 相关节点
        if (nodeType.includes('langchain') || nodeType.includes('openai') || nodeType.includes('anthropic')) {
            return 'ai';
        }
        
        // 第三方集成节点
        const integrations = ['google', 'slack', 'gmail', 'notion', 'airtable', 'sheets', 'firecrawl'];
        if (integrations.some(integration => nodeType.toLowerCase().includes(integration))) {
            return 'integrations';
        }
        
        // 默认为处理器节点
        return 'processors';
    }

    getNodeDescription(nodeType) {
        const descriptions = {
            'n8n-nodes-base.manualTrigger': '手动触发工作流执行',
            'n8n-nodes-base.webhook': 'Webhook 触发器',
            'n8n-nodes-base.cron': '定时触发器',
            'n8n-nodes-base.set': '设置/编辑字段',
            'n8n-nodes-base.code': '代码执行节点',
            'n8n-nodes-base.function': '函数节点',
            'n8n-nodes-base.if': '条件判断',
            'n8n-nodes-base.httpRequest': 'HTTP 请求',
            'n8n-nodes-base.googleSheets': 'Google Sheets 集成',
            'n8n-nodes-base.slack': 'Slack 集成',
            'n8n-nodes-base.splitInBatches': '批量分割处理',
            'n8n-nodes-base.wait': '等待节点',
            'n8n-nodes-base.noOp': '无操作节点',
            'n8n-nodes-base.stickyNote': '便签节点',
            '@n8n/n8n-nodes-langchain.openAi': 'OpenAI 集成',
            '@mendable/n8n-nodes-firecrawl.firecrawl': 'Firecrawl 网站抓取'
        };
        
        return descriptions[nodeType] || `节点类型: ${nodeType}`;
    }

    getNodeTags(nodeType) {
        if (nodeType.includes('trigger')) return ['trigger'];
        if (nodeType.includes('langchain') || nodeType.includes('openai')) return ['ai'];
        if (nodeType.includes('google') || nodeType.includes('slack')) return ['integration'];
        return ['processor'];
    }

    sanitizeFileName(name) {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
    }

    async extractConnections() {
        if (!this.workflow.connections) {
            return;
        }

        const mainFlow = {
            connections: {
                description: "主要数据处理流程",
                flows: []
            }
        };

        Object.keys(this.workflow.connections).forEach(sourceNode => {
            const outputs = this.workflow.connections[sourceNode];
            
            Object.keys(outputs).forEach(outputType => {
                if (Array.isArray(outputs[outputType])) {
                    outputs[outputType].forEach((outputArray, outputIndex) => {
                        if (Array.isArray(outputArray)) {
                            outputArray.forEach(connection => {
                                if (connection && connection.node) {
                                    const flow = {
                                        name: `${this.sanitizeFileName(sourceNode)}_to_${this.sanitizeFileName(connection.node)}`,
                                        description: `从 ${sourceNode} 到 ${connection.node}`,
                                        source: {
                                            node: sourceNode,
                                            output: outputType,
                                            index: outputIndex
                                        },
                                        target: {
                                            node: connection.node,
                                            input: connection.type || "main",
                                            index: connection.index || 0
                                        }
                                    };
                                    
                                    mainFlow.connections.flows.push(flow);
                                }
                            });
                        }
                    });
                }
            });
        });

        const yamlContent = yaml.dump(mainFlow, {
            defaultFlowStyle: false,
            lineWidth: -1,
            indent: 2
        });

        fs.writeFileSync(
            path.join(this.outputDir, 'connections', 'main-flow.yaml'),
            yamlContent
        );
    }

    async extractSettings() {
        // 执行设置
        const executionSettings = {
            execution: {
                order: this.workflow.settings?.executionOrder || "v1",
                timezone: "UTC",
                save_manual_executions: this.workflow.settings?.saveManualExecutions || true,
                data_retention: {
                    success: this.workflow.settings?.saveDataSuccessExecution || "all",
                    error: this.workflow.settings?.saveDataErrorExecution || "all"
                },
                timeout: {
                    workflow: 3600,
                    node: 300
                }
            }
        };

        // 错误处理设置
        const errorSettings = {
            error_handling: {
                error_workflow: this.workflow.settings?.errorWorkflow || null,
                caller_policy: this.workflow.settings?.callerPolicy || "workflowsFromSameOwner",
                default_retry: {
                    enabled: false,
                    max_tries: 3,
                    wait_between_tries: 1000
                },
                notifications: {
                    on_error: true,
                    on_success: false,
                    channels: ["email"]
                }
            }
        };

        const executionYaml = yaml.dump(executionSettings, {
            defaultFlowStyle: false,
            lineWidth: -1,
            indent: 2
        });

        const errorYaml = yaml.dump(errorSettings, {
            defaultFlowStyle: false,
            lineWidth: -1,
            indent: 2
        });

        fs.writeFileSync(
            path.join(this.outputDir, 'settings', 'execution.yaml'),
            executionYaml
        );

        fs.writeFileSync(
            path.join(this.outputDir, 'settings', 'error-handling.yaml'),
            errorYaml
        );
    }

    async extractData() {
        // 固定数据
        if (this.workflow.pinData && Object.keys(this.workflow.pinData).length > 0) {
            const pinnedData = {
                pinned_data: this.workflow.pinData
            };

            const yamlContent = yaml.dump(pinnedData, {
                defaultFlowStyle: false,
                lineWidth: -1,
                indent: 2
            });

            fs.writeFileSync(
                path.join(this.outputDir, 'data', 'pinned', 'test-data.yaml'),
                yamlContent
            );
        }

        // 静态数据
        if (this.workflow.staticData && Object.keys(this.workflow.staticData).length > 0) {
            const staticData = {
                static_data: this.workflow.staticData
            };

            const yamlContent = yaml.dump(staticData, {
                defaultFlowStyle: false,
                lineWidth: -1,
                indent: 2
            });

            fs.writeFileSync(
                path.join(this.outputDir, 'data', 'static', 'workflow-data.yaml'),
                yamlContent
            );
        }
    }

    async generateCredentialMappings(credentialsUsed) {
        const mappings = {
            credentials: {},
            environment_variables: []
        };

        credentialsUsed.forEach(credType => {
            const credName = this.getCredentialName(credType);
            mappings.credentials[credName] = {
                type: credType,
                name: credName,
                description: `${credName} 凭据配置`,
                required_for: []
            };
        });

        const yamlContent = yaml.dump(mappings, {
            defaultFlowStyle: false,
            lineWidth: -1,
            indent: 2
        });

        fs.writeFileSync(
            path.join(this.outputDir, 'credentials', 'credential-mappings.yaml'),
            yamlContent
        );

        // 生成环境变量示例文件
        const envExample = Array.from(credentialsUsed)
            .map(cred => `# ${this.getCredentialName(cred)}\n${cred.toUpperCase()}_KEY=your_${cred}_key_here`)
            .join('\n\n');

        fs.writeFileSync(
            path.join(this.outputDir, 'credentials', '.env.example'),
            envExample
        );
    }

    getCredentialName(credType) {
        const names = {
            'googleSheetsOAuth2Api': 'Google Sheets API',
            'openAiApi': 'OpenAI API',
            'firecrawlApi': 'Firecrawl API',
            'slackOAuth2Api': 'Slack API'
        };
        
        return names[credType] || credType;
    }

    async generatePackageJson() {
        const packageJson = {
            name: this.sanitizeFileName(this.workflow.name || 'n8n-workflow'),
            version: "1.0.0",
            description: `n8n 工作流: ${this.workflow.name}`,
            type: "module",
            scripts: {
                build: "node ../scripts/pack.js",
                validate: "node ../scripts/validate.js",
                deploy: "echo 'Deploy script not implemented yet'"
            },
            dependencies: {
                "js-yaml": "^4.1.0"
            }
        };

        fs.writeFileSync(
            path.join(this.outputDir, 'package.json'),
            JSON.stringify(packageJson, null, 2)
        );

        // 生成 README.md
        const readme = `# ${this.workflow.name}

${this.workflow.name || '未命名工作流'}

## 工作流信息

- **ID**: ${this.workflow.id}
- **状态**: ${this.workflow.active ? '激活' : '未激活'}
- **节点数量**: ${this.workflow.nodes?.length || 0}
- **创建时间**: ${this.workflow.createdAt || '未知'}
- **更新时间**: ${this.workflow.updatedAt || '未知'}

## 使用方法

### 构建工作流
\`\`\`bash
npm run build
\`\`\`

### 验证配置
\`\`\`bash
npm run validate
\`\`\`

### 部署工作流
\`\`\`bash
npm run deploy
\`\`\`

## 文件结构

- \`workflow.yaml\` - 主配置文件
- \`nodes/\` - 节点定义
- \`connections/\` - 连接配置
- \`settings/\` - 工作流设置
- \`credentials/\` - 凭据配置
- \`data/\` - 数据文件

## 注意事项

请确保在部署前配置好所需的凭据信息。
`;

        fs.writeFileSync(
            path.join(this.outputDir, 'README.md'),
            readme
        );
    }
}

/**
 * Resolves workflow name to file paths
 * @param {string} workflowName The workflow name or path
 * @returns {Object} Object containing workflowPath and outputDir
 */
function resolveWorkflowPaths(workflowName) {
    // If it looks like a full path (contains .json), use it as is
    if (workflowName.includes('.json')) {
        if (process.argv.length < 4) {
            console.error('用法: node unpack.js <workflow.json> <output-directory>');
            console.error('示例: node unpack.js ./workflows/my-workflow/workflow.json ./workflows/my-workflow-modular');
            process.exit(1);
        }
        return {
            workflowPath: workflowName,
            outputDir: process.argv[3]
        };
    }
    
    // Otherwise treat it as a workflow name
    const slugifiedName = slugify(workflowName, { lower: true });
    const workflowDir = path.join(process.cwd(), 'workflows', slugifiedName);
    const workflowPath = path.join(workflowDir, 'workflow.json');
    const outputDir = workflowDir; // Unpack in the same directory
    
    return { workflowPath, outputDir };
}

// 命令行接口
if (process.argv.length < 3) {
    console.error('用法: node unpack.js <workflow-name-or-path> [output-directory]');
    console.error('示例: ');
    console.error('  node unpack.js "My Workflow"  # 拆分 workflows/my-workflow/workflow.json 到同目录');
    console.error('  node unpack.js ./workflows/my-workflow/workflow.json ./custom-output  # 自定义路径');
    process.exit(1);
}

const workflowIdentifier = process.argv[2];
const { workflowPath, outputDir } = resolveWorkflowPaths(workflowIdentifier);

// 检查输入文件是否存在
if (!fs.existsSync(workflowPath)) {
    console.error(`错误: 工作流文件不存在: ${workflowPath}`);
    console.error(`提示: 请确保工作流存在于 workflows/ 目录中，或使用完整路径`);
    process.exit(1);
}

console.log(`输入文件: ${workflowPath}`);
console.log(`输出目录: ${outputDir}`);

// 执行解包
const unpacker = new WorkflowUnpacker(workflowPath, outputDir);
unpacker.unpack().catch(error => {
    console.error('解包失败:', error.message);
    process.exit(1);
});