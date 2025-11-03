# n8n 工作流模块化项目结构规范

[![返回主页](https://img.shields.io/badge/返回-主页-blue.svg)](./README_CN.md) [![English](https://img.shields.io/badge/docs-English-red.svg)](./README.md) [![JSON格式](https://img.shields.io/badge/查看-JSON格式规范-orange.svg)](./n8n-json-format-specification.md)

基于 n8n JSON 格式分析，本文档定义了一种 AI 友好的项目目录结构，将单体工作流文件拆分为独立的模块文件，便于版本控制、协作开发和 AI 工具理解。

> 🚀 **快速开始**: 使用 `npm run unpack` 和 `npm run pack` 命令来实现 JSON 工作流与模块化结构之间的转换。详见[主文档](./README_CN.md)。

## 1. 设计原则

### 1.1 AI 友好原则
- **语义化命名**: 文件名和目录结构清晰表达功能和用途
- **模块化分离**: 将不同类型的配置分离到独立文件
- **标准化格式**: 使用一致的 YAML/JSON 格式和注释规范
- **文档驱动**: 每个模块都有明确的文档说明

### 1.2 开发友好原则
- **版本控制友好**: 避免大文件，减少合并冲突
- **重用性**: 支持节点、连接、配置的重用
- **可维护性**: 清晰的模块边界和依赖关系
- **可扩展性**: 支持复杂工作流的组织管理

## 2. 项目目录结构

```
workflow-project/
├── README.md                          # 项目说明文档
├── workflow.yaml                      # 工作流主配置文件
├── package.json                       # 项目依赖和脚本
├── .gitignore                         # Git 忽略文件
├── docs/                              # 项目文档
│   ├── architecture.md                # 架构设计文档
│   ├── deployment.md                  # 部署说明
│   └── troubleshooting.md            # 故障排除指南
├── nodes/                             # 节点定义目录
│   ├── triggers/                      # 触发器节点
│   │   ├── manual-trigger.yaml
│   │   ├── webhook-trigger.yaml
│   │   └── cron-trigger.yaml
│   ├── processors/                    # 数据处理节点
│   │   ├── http-request.yaml
│   │   ├── data-transform.yaml
│   │   └── condition-check.yaml
│   ├── integrations/                  # 第三方集成节点
│   │   ├── google-sheets.yaml
│   │   ├── slack-notification.yaml
│   │   └── email-sender.yaml
│   └── ai/                           # AI 相关节点
│       ├── openai-chat.yaml
│       ├── langchain-agent.yaml
│       └── vector-search.yaml
├── connections/                       # 连接定义目录
│   ├── main-flow.yaml                # 主要数据流
│   ├── error-handling.yaml           # 错误处理流
│   └── ai-pipeline.yaml              # AI 处理管道
├── credentials/                       # 凭据配置目录
│   ├── credential-mappings.yaml       # 凭据映射配置
│   └── .env.example                   # 环境变量示例
├── settings/                          # 工作流设置目录
│   ├── execution.yaml                 # 执行设置
│   ├── error-handling.yaml           # 错误处理设置
│   └── performance.yaml              # 性能设置
├── data/                             # 数据文件目录
│   ├── static/                       # 静态数据
│   │   └── reference-data.yaml
│   ├── pinned/                       # 固定测试数据
│   │   └── test-data.yaml
│   └── schemas/                      # 数据模式定义
│       └── api-schemas.yaml
├── scripts/                          # 构建和部署脚本
│   ├── build.js                      # 构建脚本
│   ├── deploy.js                     # 部署脚本
│   └── validate.js                   # 验证脚本
└── dist/                             # 构建输出目录
    └── workflow.json                 # 最终生成的工作流文件
```

## 3. 文件格式规范

### 3.1 工作流主配置 (workflow.yaml)

```yaml
# n8n 工作流主配置
metadata:
  id: "4CnUOZExvXMQTGEB"
  name: "Website Summary Workflow"
  description: "自动获取网站内容并生成个性化摘要"
  version: "1.0.0"
  author: "开发团队"
  tags: ["automation", "ai", "web-scraping"]
  
  # 时间戳信息
  created_at: "2025-10-28T15:12:39.276Z"
  updated_at: "2025-10-31T12:45:21.533Z"
  
  # 状态信息
  active: false
  archived: false
  trigger_count: 1

# 引用其他配置文件
includes:
  nodes: "./nodes/**/*.yaml"
  connections: "./connections/**/*.yaml"
  settings: "./settings/**/*.yaml"
  credentials: "./credentials/credential-mappings.yaml"
  data:
    static: "./data/static/**/*.yaml"
    pinned: "./data/pinned/**/*.yaml"

# 构建配置
build:
  output: "./dist/workflow.json"
  validate: true
  minify: false
```

### 3.2 节点定义格式 (nodes/*.yaml)

```yaml
# 节点配置文件: nodes/triggers/manual-trigger.yaml
node:
  # 基础信息
  id: "6791eccd-206f-46db-b2a0-fd22eddcbaab"
  name: "Manual Trigger"
  description: "手动触发工作流执行"
  type: "n8n-nodes-base.manualTrigger"
  type_version: 1
  
  # 位置信息
  position:
    x: -992
    y: -80
  
  # 参数配置
  parameters: {}
  
  # 高级设置
  settings:
    disabled: false
    continue_on_fail: false
    always_output_data: false
    execute_once: false
    retry_on_fail: false
    max_tries: 3
    wait_between_tries: 1000
  
  # 文档信息
  notes: "工作流的入口点，用户手动触发执行"
  color: "#FF6B6B"
  
  # 标签和分类
  tags: ["trigger", "manual"]
  category: "triggers"
```

### 3.3 连接定义格式 (connections/*.yaml)

```yaml
# 连接配置文件: connections/main-flow.yaml
connections:
  description: "主要数据处理流程"
  
  flows:
    - name: "trigger_to_fetch"
      description: "从手动触发到数据获取"
      source:
        node: "Manual Trigger"
        output: "main"
        index: 0
      target:
        node: "Fetch website URL from sheet"
        input: "main"
        index: 0
    
    - name: "fetch_to_loop"
      description: "从数据获取到循环处理"
      source:
        node: "Fetch website URL from sheet"
        output: "main"
        index: 0
      target:
        node: "Loop over URLs"
        input: "main"
        index: 0
    
    # AI 处理管道
    - name: "scrape_to_ai"
      description: "从内容抓取到AI处理"
      source:
        node: "Scrape website and get its content"
        output: "main"
        index: 0
      target:
        node: "Personalize Message"
        input: "main"
        index: 0
      
      # 数据转换配置
      transform:
        enabled: true
        mapping:
          content: "{{ $json.markdown }}"
          url: "{{ $json.url }}"
```

### 3.4 设置配置格式 (settings/*.yaml)

```yaml
# 执行设置: settings/execution.yaml
execution:
  order: "v1"
  timezone: "UTC"
  save_manual_executions: true
  
  # 数据保存策略
  data_retention:
    success: "all"
    error: "all"
    
  # 超时设置
  timeout:
    workflow: 3600  # 1小时
    node: 300       # 5分钟
```

```yaml
# 错误处理设置: settings/error-handling.yaml
error_handling:
  # 全局错误工作流
  error_workflow: null
  
  # 调用者策略
  caller_policy: "workflowsFromSameOwner"
  
  # 重试策略
  default_retry:
    enabled: false
    max_tries: 3
    wait_between_tries: 1000
  
  # 通知设置
  notifications:
    on_error: true
    on_success: false
    channels: ["email", "slack"]
```

### 3.5 凭据映射 (credentials/credential-mappings.yaml)

```yaml
# 凭据配置映射
credentials:
  google_sheets_api:
    type: "googleSheetsOAuth2Api"
    name: "Google Sheets API"
    description: "Google Sheets 集成凭据"
    required_for:
      - "Fetch website URL from sheet"
      - "Update sheet with personalized message"
  
  openai_api:
    type: "openAiApi" 
    name: "OpenAI API"
    description: "OpenAI GPT 模型凭据"
    required_for:
      - "Personalize Message"
  
  firecrawl_api:
    type: "firecrawlApi"
    name: "Firecrawl API"
    description: "网站内容抓取服务凭据"
    required_for:
      - "Scrape website and get its content"

# 环境变量映射
environment_variables:
  - name: "OPENAI_API_KEY"
    credential: "openai_api"
    required: true
  
  - name: "FIRECRAWL_API_KEY"
    credential: "firecrawl_api"
    required: true
```

## 4. AI 友好特性

### 4.1 语义化结构
- **功能分组**: 按功能将节点分组到不同目录
- **清晰命名**: 文件名直接反映功能用途
- **类型标识**: 通过目录结构明确节点类型

### 4.2 文档驱动
```yaml
# 每个配置文件都包含丰富的元数据
metadata:
  description: "详细的功能描述"
  purpose: "在整个工作流中的作用"
  dependencies: ["依赖的其他节点"]
  data_flow: "数据流描述"
  
# 内联注释
parameters:
  url: "https://api.example.com"  # API 端点地址
  method: "GET"                   # HTTP 请求方法
  timeout: 30                     # 请求超时时间（秒）
```

### 4.3 标准化模式
```yaml
# 统一的节点配置模式
node:
  # 1. 标识信息
  id: "uuid"
  name: "显示名称"
  type: "节点类型"
  
  # 2. 位置信息
  position: {x: 0, y: 0}
  
  # 3. 功能配置
  parameters: {}
  
  # 4. 行为设置
  settings: {}
  
  # 5. 文档信息
  description: "功能描述"
  notes: "使用说明"
```

## 5. 构建和部署

### 5.1 构建脚本 (scripts/build.js)

```javascript
#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { glob } from 'glob';

class WorkflowBuilder {
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
    }
    
    async build() {
        console.log('构建 n8n 工作流...');
        
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
        
        console.log('构建完成!');
    }
    
    // 实现各个加载方法...
}

// 执行构建
const builder = new WorkflowBuilder(process.cwd());
builder.build().catch(console.error);
```

### 5.2 验证脚本 (scripts/validate.js)

```javascript
#!/usr/bin/env node

import fs from 'fs';
import yaml from 'js-yaml';

class WorkflowValidator {
    constructor(workflowPath) {
        this.workflowPath = workflowPath;
        this.errors = [];
        this.warnings = [];
    }
    
    validate() {
        console.log('验证工作流配置...');
        
        // 1. 验证文件结构
        this.validateFileStructure();
        
        // 2. 验证节点配置
        this.validateNodes();
        
        // 3. 验证连接完整性
        this.validateConnections();
        
        // 4. 验证凭据映射
        this.validateCredentials();
        
        // 输出结果
        this.reportResults();
    }
    
    // 实现各个验证方法...
}

// 执行验证
const validator = new WorkflowValidator(process.argv[2]);
validator.validate();
```

## 6. 使用示例

### 6.1 创建新节点

```bash
# 使用脚本创建新节点
npm run create-node --type=processor --name=data-filter

# 或手动创建文件 nodes/processors/data-filter.yaml
```

### 6.2 修改连接关系

```yaml
# 在 connections/main-flow.yaml 中添加新连接
- name: "filter_to_output"
  description: "过滤后数据输出"
  source:
    node: "Data Filter"
    output: "main"
    index: 0
  target:
    node: "Output Results"
    input: "main"
    index: 0
```

### 6.3 构建和部署

```bash
# 安装依赖
npm install

# 验证配置
npm run validate

# 构建工作流
npm run build

# 部署到 n8n
npm run deploy
```

## 7. 最佳实践

### 7.1 文件组织
- 按功能而非技术分组节点
- 保持文件名简洁且有意义
- 使用一致的命名约定

### 7.2 配置管理
- 将敏感信息存储在环境变量中
- 使用有意义的描述和注释
- 维护版本控制历史

### 7.3 团队协作
- 明确模块责任边界
- 使用标准化的代码审查流程
- 维护更新日志

## 8. 工具支持

### 8.1 VS Code 扩展
创建专门的 VS Code 扩展，提供：
- 语法高亮和自动补全
- 实时配置验证
- 可视化工作流预览
- 节点和连接的智能建议

### 8.2 AI 助手集成
- 支持自然语言描述生成配置
- 智能推荐节点类型和参数
- 自动优化工作流结构
- 生成文档和注释

这种模块化结构使得 AI 工具能够更好地理解和操作工作流配置，同时为开发者提供了清晰的项目组织方式。

---

## 相关文档

- 📖 **[项目主页](./README_CN.md)** - 完整使用指南和命令说明
- 📋 **[n8n JSON 格式规范](./n8n-json-format-specification.md)** - 基于 1568 个工作流的深度分析
- 📄 **[English Documentation](./README.md)** - English version of the main documentation

## 实用工具

使用项目提供的命令来实现模块化结构：

```bash
# 将 JSON 工作流拆分为模块化结构（推荐使用工作流名称）
npm run unpack "我的工作流"

# 验证模块化配置
npm run validate "我的工作流"

# 将模块化结构打包回 JSON
npm run pack "我的工作流"

# 也可以使用完整路径（兼容旧版本）
npm run unpack workflows/my-workflow/workflow.json workflows/my-workflow-modular
npm run validate workflows/my-workflow-modular
npm run pack workflows/my-workflow-modular
```