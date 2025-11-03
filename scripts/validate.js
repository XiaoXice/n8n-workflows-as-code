#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import slugify from 'slugify';
import { glob } from 'glob';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class WorkflowValidator {
    constructor(projectDir) {
        this.projectDir = projectDir;
        this.errors = [];
        this.warnings = [];
        this.config = null;
    }

    validate() {
        console.log(`验证工作流项目: ${this.projectDir}`);
        
        try {
            // 1. 验证文件结构
            this.validateFileStructure();
            
            // 2. 验证主配置
            this.validateMainConfig();
            
            // 3. 验证节点配置
            this.validateNodes();
            
            // 4. 验证连接完整性
            this.validateConnections();
            
            // 5. 验证凭据映射
            this.validateCredentials();
            
            // 输出结果
            this.reportResults();
            
        } catch (error) {
            console.error(`验证失败: ${error.message}`);
            process.exit(1);
        }
    }

    validateFileStructure() {
        const requiredFiles = [
            'workflow.yaml',
            'package.json'
        ];

        const requiredDirs = [
            'nodes',
            'connections', 
            'settings',
            'credentials'
        ];

        requiredFiles.forEach(file => {
            const filePath = path.join(this.projectDir, file);
            if (!fs.existsSync(filePath)) {
                this.errors.push(`缺少必需文件: ${file}`);
            }
        });

        requiredDirs.forEach(dir => {
            const dirPath = path.join(this.projectDir, dir);
            if (!fs.existsSync(dirPath)) {
                this.errors.push(`缺少必需目录: ${dir}`);
            }
        });
    }

    validateMainConfig() {
        const configPath = path.join(this.projectDir, 'workflow.yaml');
        
        if (!fs.existsSync(configPath)) {
            return;
        }

        try {
            const content = fs.readFileSync(configPath, 'utf8');
            this.config = yaml.load(content);
        } catch (error) {
            this.errors.push(`主配置文件格式错误: ${error.message}`);
            return;
        }

        // 验证必需字段
        if (!this.config.metadata) {
            this.errors.push('主配置缺少 metadata 部分');
        } else {
            if (!this.config.metadata.id) {
                this.errors.push('主配置缺少工作流 ID');
            }
            if (!this.config.metadata.name) {
                this.errors.push('主配置缺少工作流名称');
            }
        }

        if (!this.config.includes) {
            this.warnings.push('主配置缺少 includes 部分');
        }
    }

    async validateNodes() {
        const nodeFiles = await glob('nodes/**/*.yaml', { 
            cwd: this.projectDir,
            absolute: true 
        });

        if (nodeFiles.length === 0) {
            this.errors.push('未找到任何节点配置文件');
            return;
        }

        const nodeNames = new Set();
        const nodeIds = new Set();

        for (const nodeFile of nodeFiles) {
            try {
                const content = fs.readFileSync(nodeFile, 'utf8');
                const nodeConfig = yaml.load(content);
                
                if (!nodeConfig || !nodeConfig.node) {
                    this.errors.push(`节点文件格式错误: ${path.relative(this.projectDir, nodeFile)}`);
                    continue;
                }

                const node = nodeConfig.node;
                
                // 验证必需字段
                if (!node.id) {
                    this.errors.push(`节点缺少 ID: ${path.relative(this.projectDir, nodeFile)}`);
                } else if (nodeIds.has(node.id)) {
                    this.errors.push(`重复的节点 ID: ${node.id}`);
                } else {
                    nodeIds.add(node.id);
                }

                if (!node.name) {
                    this.errors.push(`节点缺少名称: ${path.relative(this.projectDir, nodeFile)}`);
                } else if (nodeNames.has(node.name)) {
                    this.errors.push(`重复的节点名称: ${node.name}`);
                } else {
                    nodeNames.add(node.name);
                }

                if (!node.type) {
                    this.errors.push(`节点缺少类型: ${node.name || path.relative(this.projectDir, nodeFile)}`);
                }

                if (!node.position || !node.position.x === undefined || !node.position.y === undefined) {
                    this.warnings.push(`节点位置配置可能有误: ${node.name}`);
                }

            } catch (error) {
                this.errors.push(`无法解析节点文件 ${path.relative(this.projectDir, nodeFile)}: ${error.message}`);
            }
        }

        console.log(`验证了 ${nodeFiles.length} 个节点文件`);
    }

    async validateConnections() {
        const connectionFiles = await glob('connections/**/*.yaml', { 
            cwd: this.projectDir,
            absolute: true 
        });

        if (connectionFiles.length === 0) {
            this.warnings.push('未找到连接配置文件');
            return;
        }

        for (const connectionFile of connectionFiles) {
            try {
                const content = fs.readFileSync(connectionFile, 'utf8');
                const connectionConfig = yaml.load(content);
                
                if (connectionConfig && connectionConfig.connections && connectionConfig.connections.flows) {
                    for (const flow of connectionConfig.connections.flows) {
                        if (!flow.source || !flow.target) {
                            this.errors.push(`连接配置不完整: ${path.relative(this.projectDir, connectionFile)}`);
                            continue;
                        }

                        if (!flow.source.node || !flow.target.node) {
                            this.errors.push(`连接缺少节点信息: ${path.relative(this.projectDir, connectionFile)}`);
                        }
                    }
                }
            } catch (error) {
                this.errors.push(`无法解析连接文件 ${path.relative(this.projectDir, connectionFile)}: ${error.message}`);
            }
        }

        console.log(`验证了 ${connectionFiles.length} 个连接文件`);
    }

    async validateCredentials() {
        const credentialPath = path.join(this.projectDir, 'credentials', 'credential-mappings.yaml');
        
        if (!fs.existsSync(credentialPath)) {
            this.warnings.push('未找到凭据映射文件');
            return;
        }

        try {
            const content = fs.readFileSync(credentialPath, 'utf8');
            const credConfig = yaml.load(content);
            
            if (credConfig && credConfig.credentials) {
                const credCount = Object.keys(credConfig.credentials).length;
                console.log(`验证了 ${credCount} 个凭据配置`);
            }
        } catch (error) {
            this.errors.push(`无法解析凭据配置文件: ${error.message}`);
        }
    }

    reportResults() {
        console.log('\n=== 验证结果 ===');
        
        if (this.errors.length === 0 && this.warnings.length === 0) {
            console.log('✅ 验证通过，未发现问题');
            return;
        }

        if (this.errors.length > 0) {
            console.log(`\n❌ 发现 ${this.errors.length} 个错误:`);
            this.errors.forEach((error, index) => {
                console.log(`${index + 1}. ${error}`);
            });
        }

        if (this.warnings.length > 0) {
            console.log(`\n⚠️  发现 ${this.warnings.length} 个警告:`);
            this.warnings.forEach((warning, index) => {
                console.log(`${index + 1}. ${warning}`);
            });
        }

        if (this.errors.length > 0) {
            console.log('\n请修复错误后重新验证');
            process.exit(1);
        } else {
            console.log('\n验证完成，只有警告项目');
        }
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
    console.error('用法: node validate.js <workflow-name-or-directory>');
    console.error('示例: ');
    console.error('  node validate.js "My Workflow"  # 验证 workflows/my-workflow/ 目录');
    console.error('  node validate.js ./workflows/my-workflow-custom  # 使用自定义目录路径');
    process.exit(1);
}

const workflowIdentifier = process.argv[2];
const projectDir = resolveProjectDirectory(workflowIdentifier);

console.log(`验证目录: ${projectDir}`);

// 检查项目目录是否存在
if (!fs.existsSync(projectDir)) {
    console.error(`错误: 项目目录不存在: ${projectDir}`);
    console.error(`提示: 请确保工作流目录存在于 workflows/ 中，或使用完整路径`);
    process.exit(1);
}

// 执行验证
const validator = new WorkflowValidator(projectDir);
validator.validate();