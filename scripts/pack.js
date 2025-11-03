#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import slugify from 'slugify';
import { glob } from 'glob';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class WorkflowPacker {
    constructor(projectDir) {
        this.projectDir = projectDir;
        this.workflow = {
            nodes: [],
            connections: {},
            settings: {},
            meta: {},
            pinData: {},
            staticData: {}
        };
        this.config = null;
    }

    async pack() {
        console.log(`打包工作流项目: ${this.projectDir}`);
        
        // 1. 加载主配置
        await this.loadMainConfig();
        
        // 2. 加载节点定义
        await this.loadNodes();
        
        // 3. 加载连接定义
        await this.loadConnections();
        
        // 4. 加载设置配置
        await this.loadSettings();
        
        // 5. 加载数据文件
        await this.loadData();
        
        // 6. 验证配置
        this.validate();
        
        // 7. 生成最终文件
        await this.generateOutput();
        
        console.log('打包完成!');
    }

    async loadMainConfig() {
        const configPath = path.join(this.projectDir, 'workflow.yaml');
        
        if (!fs.existsSync(configPath)) {
            throw new Error(`主配置文件不存在: ${configPath}`);
        }

        try {
            const content = fs.readFileSync(configPath, 'utf8');
            this.config = yaml.load(content);
        } catch (error) {
            throw new Error(`无法解析主配置文件: ${error.message}`);
        }

        // 设置工作流基础信息
        const metadata = this.config.metadata || {};
        this.workflow.id = metadata.id;
        this.workflow.name = metadata.name;
        this.workflow.active = metadata.active || false;
        this.workflow.tags = metadata.tags || [];
        this.workflow.createdAt = metadata.created_at;
        this.workflow.updatedAt = metadata.updated_at;
        this.workflow.isArchived = metadata.archived || false;
        this.workflow.triggerCount = metadata.trigger_count || 0;
        
        // 设置版本ID
        this.workflow.versionId = metadata.version_id || this.generateVersionId();
    }

    async loadNodes() {
        console.log('加载节点定义...');
        
        const nodeFiles = await glob('nodes/**/*.yaml', { 
            cwd: this.projectDir,
            absolute: true 
        });

        for (const nodeFile of nodeFiles) {
            try {
                const content = fs.readFileSync(nodeFile, 'utf8');
                const nodeConfig = yaml.load(content);
                
                if (nodeConfig && nodeConfig.node) {
                    const node = this.convertNodeConfig(nodeConfig.node);
                    this.workflow.nodes.push(node);
                }
            } catch (error) {
                console.warn(`警告: 无法加载节点文件 ${nodeFile}: ${error.message}`);
            }
        }

        console.log(`已加载 ${this.workflow.nodes.length} 个节点`);
    }

    convertNodeConfig(nodeConfig) {
        const node = {
            id: nodeConfig.id,
            name: nodeConfig.name,
            type: nodeConfig.type,
            position: [
                nodeConfig.position?.x || 0,
                nodeConfig.position?.y || 0
            ],
            parameters: nodeConfig.parameters || {},
            typeVersion: nodeConfig.type_version || 1
        };

        // 添加可选字段
        if (nodeConfig.credentials) {
            node.credentials = nodeConfig.credentials;
        }

        if (nodeConfig.webhookId) {
            node.webhookId = nodeConfig.webhookId;
        }

        // 添加设置字段
        const settings = nodeConfig.settings || {};
        if (settings.disabled) node.disabled = settings.disabled;
        if (settings.continue_on_fail) node.continueOnFail = settings.continue_on_fail;
        if (settings.always_output_data) node.alwaysOutputData = settings.always_output_data;
        if (settings.execute_once) node.executeOnce = settings.execute_once;
        if (settings.retry_on_fail) node.retryOnFail = settings.retry_on_fail;
        if (settings.max_tries) node.maxTries = settings.max_tries;
        if (settings.wait_between_tries) node.waitBetweenTries = settings.wait_between_tries;

        // 添加其他字段
        if (nodeConfig.notes) node.notes = nodeConfig.notes;
        if (nodeConfig.color) node.color = nodeConfig.color;

        return node;
    }

    async loadConnections() {
        console.log('加载连接定义...');
        
        const connectionFiles = await glob('connections/**/*.yaml', { 
            cwd: this.projectDir,
            absolute: true 
        });

        const connections = {};

        for (const connectionFile of connectionFiles) {
            try {
                const content = fs.readFileSync(connectionFile, 'utf8');
                const connectionConfig = yaml.load(content);
                
                if (connectionConfig && connectionConfig.connections && connectionConfig.connections.flows) {
                    for (const flow of connectionConfig.connections.flows) {
                        const sourceNode = flow.source.node;
                        const outputType = flow.source.output || 'main';
                        const outputIndex = flow.source.index || 0;

                        // 初始化连接结构
                        if (!connections[sourceNode]) {
                            connections[sourceNode] = {};
                        }
                        if (!connections[sourceNode][outputType]) {
                            connections[sourceNode][outputType] = [];
                        }
                        
                        // 确保输出索引数组存在
                        while (connections[sourceNode][outputType].length <= outputIndex) {
                            connections[sourceNode][outputType].push([]);
                        }

                        // 添加连接
                        const connection = {
                            node: flow.target.node,
                            type: flow.target.input || 'main',
                            index: flow.target.index || 0
                        };

                        connections[sourceNode][outputType][outputIndex].push(connection);
                    }
                }
            } catch (error) {
                console.warn(`警告: 无法加载连接文件 ${connectionFile}: ${error.message}`);
            }
        }

        this.workflow.connections = connections;
        console.log(`已加载 ${Object.keys(connections).length} 个节点的连接配置`);
    }

    async loadSettings() {
        console.log('加载设置配置...');
        
        const settingsFiles = await glob('settings/**/*.yaml', { 
            cwd: this.projectDir,
            absolute: true 
        });

        const settings = {};

        for (const settingsFile of settingsFiles) {
            try {
                const content = fs.readFileSync(settingsFile, 'utf8');
                const settingsConfig = yaml.load(content);
                
                // 合并执行设置
                if (settingsConfig.execution) {
                    if (settingsConfig.execution.order) {
                        settings.executionOrder = settingsConfig.execution.order;
                    }
                    if (settingsConfig.execution.save_manual_executions !== undefined) {
                        settings.saveManualExecutions = settingsConfig.execution.save_manual_executions;
                    }
                    if (settingsConfig.execution.data_retention) {
                        if (settingsConfig.execution.data_retention.success) {
                            settings.saveDataSuccessExecution = settingsConfig.execution.data_retention.success;
                        }
                        if (settingsConfig.execution.data_retention.error) {
                            settings.saveDataErrorExecution = settingsConfig.execution.data_retention.error;
                        }
                    }
                }

                // 合并错误处理设置
                if (settingsConfig.error_handling) {
                    if (settingsConfig.error_handling.error_workflow) {
                        settings.errorWorkflow = settingsConfig.error_handling.error_workflow;
                    }
                    if (settingsConfig.error_handling.caller_policy) {
                        settings.callerPolicy = settingsConfig.error_handling.caller_policy;
                    }
                }
            } catch (error) {
                console.warn(`警告: 无法加载设置文件 ${settingsFile}: ${error.message}`);
            }
        }

        this.workflow.settings = settings;
        console.log('设置配置加载完成');
    }

    async loadData() {
        console.log('加载数据文件...');
        
        // 加载固定数据
        const pinnedFiles = await glob('data/pinned/**/*.yaml', { 
            cwd: this.projectDir,
            absolute: true 
        });

        let pinData = {};
        for (const pinnedFile of pinnedFiles) {
            try {
                const content = fs.readFileSync(pinnedFile, 'utf8');
                const data = yaml.load(content);
                if (data && data.pinned_data) {
                    pinData = { ...pinData, ...data.pinned_data };
                }
            } catch (error) {
                console.warn(`警告: 无法加载固定数据文件 ${pinnedFile}: ${error.message}`);
            }
        }
        this.workflow.pinData = pinData;

        // 加载静态数据
        const staticFiles = await glob('data/static/**/*.yaml', { 
            cwd: this.projectDir,
            absolute: true 
        });

        let staticData = {};
        for (const staticFile of staticFiles) {
            try {
                const content = fs.readFileSync(staticFile, 'utf8');
                const data = yaml.load(content);
                if (data && data.static_data) {
                    staticData = { ...staticData, ...data.static_data };
                }
            } catch (error) {
                console.warn(`警告: 无法加载静态数据文件 ${staticFile}: ${error.message}`);
            }
        }
        this.workflow.staticData = staticData;

        console.log('数据文件加载完成');
    }

    validate() {
        console.log('验证工作流配置...');
        
        const errors = [];
        
        // 验证必需字段
        if (!this.workflow.id) {
            errors.push('缺少工作流 ID');
        }
        if (!this.workflow.name) {
            errors.push('缺少工作流名称');
        }
        if (!Array.isArray(this.workflow.nodes) || this.workflow.nodes.length === 0) {
            errors.push('工作流必须包含至少一个节点');
        }
        
        // 验证节点
        const nodeNames = new Set();
        const nodeIds = new Set();
        
        this.workflow.nodes.forEach((node, index) => {
            if (!node.id) {
                errors.push(`节点 ${index} 缺少 ID`);
            } else if (nodeIds.has(node.id)) {
                errors.push(`重复的节点 ID: ${node.id}`);
            } else {
                nodeIds.add(node.id);
            }
            
            if (!node.name) {
                errors.push(`节点 ${index} 缺少名称`);
            } else if (nodeNames.has(node.name)) {
                errors.push(`重复的节点名称: ${node.name}`);
            } else {
                nodeNames.add(node.name);
            }
            
            if (!node.type) {
                errors.push(`节点 ${node.name || index} 缺少类型`);
            }
            
            if (!Array.isArray(node.position) || node.position.length !== 2) {
                errors.push(`节点 ${node.name || index} 的位置格式无效`);
            }
        });
        
        // 验证连接
        Object.keys(this.workflow.connections).forEach(sourceNode => {
            if (!nodeNames.has(sourceNode)) {
                errors.push(`连接中引用了不存在的源节点: ${sourceNode}`);
            }
            
            const outputs = this.workflow.connections[sourceNode];
            Object.keys(outputs).forEach(outputType => {
                if (Array.isArray(outputs[outputType])) {
                    outputs[outputType].forEach(outputArray => {
                        if (Array.isArray(outputArray)) {
                            outputArray.forEach(connection => {
                                if (connection && connection.node && !nodeNames.has(connection.node)) {
                                    errors.push(`连接中引用了不存在的目标节点: ${connection.node}`);
                                }
                            });
                        }
                    });
                }
            });
        });
        
        if (errors.length > 0) {
            console.error('验证失败:');
            errors.forEach(error => console.error(`- ${error}`));
            throw new Error(`工作流验证失败，发现 ${errors.length} 个错误`);
        }
        
        console.log('工作流验证通过');
    }

    async generateOutput() {
        const outputPath = this.config.build?.output || './workflow.json';
        const fullOutputPath = path.resolve(this.projectDir, outputPath);
        
        // 确保输出目录存在
        const outputDir = path.dirname(fullOutputPath);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        
        // 生成最终的工作流 JSON
        const finalWorkflow = {
            id: this.workflow.id,
            name: this.workflow.name,
            active: this.workflow.active,
            nodes: this.workflow.nodes,
            connections: this.workflow.connections,
            settings: this.workflow.settings,
            tags: this.workflow.tags,
            pinData: this.workflow.pinData,
            staticData: this.workflow.staticData,
            versionId: this.workflow.versionId
        };

        // 添加时间戳
        if (this.workflow.createdAt) {
            finalWorkflow.createdAt = this.workflow.createdAt;
        }
        if (this.workflow.updatedAt) {
            finalWorkflow.updatedAt = this.workflow.updatedAt;
        }
        if (this.workflow.isArchived !== undefined) {
            finalWorkflow.isArchived = this.workflow.isArchived;
        }
        if (this.workflow.triggerCount !== undefined) {
            finalWorkflow.triggerCount = this.workflow.triggerCount;
        }

        // 清理空对象
        Object.keys(finalWorkflow).forEach(key => {
            if (typeof finalWorkflow[key] === 'object' && 
                finalWorkflow[key] !== null && 
                !Array.isArray(finalWorkflow[key]) && 
                Object.keys(finalWorkflow[key]).length === 0) {
                delete finalWorkflow[key];
            }
        });

        const jsonContent = this.config.build?.minify 
            ? JSON.stringify(finalWorkflow)
            : JSON.stringify(finalWorkflow, null, 2);
            
        fs.writeFileSync(fullOutputPath, jsonContent);
        
        console.log(`工作流已生成: ${fullOutputPath}`);
        console.log(`- 节点数量: ${this.workflow.nodes.length}`);
        console.log(`- 连接数量: ${Object.keys(this.workflow.connections).length}`);
        console.log(`- 文件大小: ${Math.round(jsonContent.length / 1024)} KB`);
    }

    generateVersionId() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
}

/**
 * Resolves workflow name to project directory
 * @param {string} workflowName The workflow name or path
 * @returns {string} The project directory path
 */
function resolveProjectDirectory(workflowName) {
    // If it looks like a directory path (contains slash or doesn't look like a workflow name)
    if (workflowName.includes('/') || workflowName.includes('\\')) {
        return workflowName;
    }
    
    // Otherwise treat it as a workflow name
    const slugifiedName = slugify(workflowName, { lower: true });
    const projectDir = path.join(process.cwd(), 'workflows', slugifiedName);
    
    return projectDir;
}

// 命令行接口
if (process.argv.length < 3) {
    console.error('用法: node pack.js <workflow-name-or-directory>');
    console.error('示例: ');
    console.error('  node pack.js "My Workflow"  # 打包 workflows/my-workflow/ 目录');
    console.error('  node pack.js ./workflows/my-workflow-custom  # 使用自定义目录路径');
    process.exit(1);
}

const workflowIdentifier = process.argv[2];
const projectDir = resolveProjectDirectory(workflowIdentifier);

console.log(`项目目录: ${projectDir}`);

// 检查项目目录是否存在
if (!fs.existsSync(projectDir)) {
    console.error(`错误: 项目目录不存在: ${projectDir}`);
    console.error(`提示: 请确保工作流目录存在于 workflows/ 中，或使用完整路径`);
    process.exit(1);
}

// 检查主配置文件是否存在
const configPath = path.join(projectDir, 'workflow.yaml');
if (!fs.existsSync(configPath)) {
    console.error(`错误: 主配置文件不存在: ${configPath}`);
    console.error('请确保项目目录包含 workflow.yaml 文件');
    console.error('提示: 使用 npm run unpack 命令先将工作流拆分为模块化结构');
    process.exit(1);
}

// 执行打包
const packer = new WorkflowPacker(projectDir);
packer.pack().catch(error => {
    console.error('打包失败:', error.message);
    process.exit(1);
});