# n8n 工作流代码化管理

[![English Documentation](https://img.shields.io/badge/docs-English-red.svg)](./README.md)

这个项目帮助您将 n8n 工作流进行代码化管理，通过 Git 实现版本控制和协作开发。提供了传统工作流管理和先进的模块化工作流组织的全面工具。

## 核心特性

- 🔄 **双向转换**: 支持单体 JSON 工作流与模块化项目结构之间的转换
- 📁 **模块化组织**: 按功能分类节点（触发器、处理器、集成、AI）
- 🤖 **AI 友好**: 语义化命名、YAML 格式、丰富文档
- ✅ **配置验证**: 内置验证工具确保配置正确性
- 🎯 **版本控制优化**: 避免大文件冲突，支持精细化版本管理
- 🔌 **n8n API 集成**: 直接从 n8n 实例拉取/推送工作流

## 文档目录

- 📖 **[English Documentation](./README.md)** - 完整英文文档
- 📋 **[n8n JSON 格式规范](./n8n-json-format-specification.md)** - 详细的 n8n 工作流 JSON 格式分析
- 🏗️ **[模块化项目结构规范](./n8n-modular-project-structure.md)** - AI 友好的模块化项目结构规范

## 安装配置

1. 克隆此仓库
2. 安装依赖：
   ```bash
   npm install
   ```
3. 在根目录创建 `.env` 文件并配置 n8n 凭据：

   ```
   N8N_API_URL=你的n8n实例地址
   N8N_API_KEY=你的n8n_API密钥

   # 工作流备份配置
   BACKUP_WORKFLOWS_ON_PULL=false
   BACKUP_WORKFLOWS_ON_PUSH=false
   ```

## 可用命令

### 模块化工作流管理（新功能！）

这些新命令允许您以模块化、AI 友好的格式处理工作流，优化了版本控制和团队协作。

#### 拆分工作流

将单体 n8n 工作流 JSON 文件转换为模块化项目结构：

```bash
# 使用工作流名称（推荐）
npm run unpack <工作流名称>

# 使用完整文件路径（如有需要）
npm run unpack <workflow.json> <输出目录>

# 直接使用 node
node scripts/unpack.js <工作流名称或路径>
```

**示例：**
```bash
# 按工作流名称拆分（拆分到同目录）
npm run unpack "我的工作流"

# 使用自定义路径
npm run unpack workflows/my-workflow/workflow.json workflows/custom-output
```

**功能特性：**
- 自动按功能分类节点（触发器、处理器、集成、AI）
- 创建语义化的文件名和目录结构
- 将连接、设置和数据提取到独立的 YAML 文件
- 生成项目文档和 package.json
- AI 友好的丰富元数据和注释

#### 打包工作流

将模块化项目结构转换回 n8n 兼容的 JSON 工作流：

```bash
# 使用工作流名称（推荐）
npm run pack <工作流名称>

# 使用自定义目录路径
npm run pack <项目目录>

# 直接使用 node
node scripts/pack.js <工作流名称或目录>
```

**示例：**
```bash
# 按工作流名称打包
npm run pack "我的工作流"

# 使用自定义目录
npm run pack workflows/my-custom-workflow
```

**功能特性：**
- 从模块化组件重建完整的工作流结构
- 在构建过程中验证配置完整性
- 生成标准的 n8n JSON 格式
- 保留所有工作流功能和元数据

#### 验证配置

验证模块化工作流项目的完整性和正确性：

```bash
# 使用工作流名称（推荐）
npm run validate <工作流名称>

# 使用自定义目录路径
npm run validate <项目目录>

# 直接使用 node
node scripts/validate.js <工作流名称或目录>
```

**示例：**
```bash
# 按工作流名称验证
npm run validate "我的工作流"

# 使用自定义目录
npm run validate workflows/my-custom-workflow
```

**功能特性：**
- 检查必需的文件和目录结构
- 验证节点配置格式
- 验证连接引用完整性
- 验证凭据映射配置

### 传统工作流管理

#### 拉取工作流

从 n8n 实例拉取指定工作流并保存为 JSON 文件到 workflows 目录。

```bash
npm run pull <工作流名称>
```

**功能特性：**

- 为每个工作流创建目录，使用工作流名称的 slug 版本
- 将工作流保存为专用目录中的 `workflow.json`
- 不区分大小写的工作流名称匹配
- 防止覆盖现有工作流文件
- 如果未找到指定工作流，显示可用工作流
- 启用时可选择创建备份

**示例：**

```bash
npm run pull "我的工作流"
```

这将：

1. 连接到您的 n8n 实例
2. 查找名为"我的工作流"的工作流
3. 创建目录 `workflows/my-workflow/`
4. 将工作流保存为 `workflows/my-workflow/workflow.json`
5. 如果启用备份，在工作流的 `backups` 文件夹中创建备份

#### 推送工作流

将工作流从本地文件推送到 n8n 实例。

```bash
npm run push <工作流名称>
```

**功能特性：**

- 更新现有工作流或创建新工作流（如果不存在）
- 处理工作流数据清理以确保 API 兼容性
- 启用时可选择在推送前创建备份

## 工作流备份系统

此项目包含在推送和拉取操作期间的自动工作流备份系统。

### 备份工作原理

- 启用时，系统在每个工作流目录内创建 `backups` 文件夹
- 每个备份都使用存储在 `backup_version.json` 中的增量编号进行版本控制
- 拉取操作创建名为 `workflow_backup_v<NUMBER>_PULL.json` 的备份
- 推送操作创建名为 `workflow_backup_v<NUMBER>_PUSH.json` 的备份

### 启用备份

要启用备份功能，请在 `.env` 文件中设置以下变量：

```
BACKUP_WORKFLOWS_ON_PULL=true
BACKUP_WORKFLOWS_ON_PUSH=true
```

## 项目结构

### 传统工作流结构
```
.
├── workflows/                 # 包含工作流文件的目录
│   ├── workflow-name/         # 每个工作流的独立目录
│   │   ├── workflow.json      # 工作流定义文件
│   │   └── backups/           # 备份存储目录（启用时）
│   │       ├── backup_version.json
│   │       ├── workflow_backup_v1_PULL.json
│   │       └── workflow_backup_v2_PUSH.json
├── scripts/                   # 自动化脚本
│   ├── pull.js                # 从 n8n 拉取工作流的脚本
│   ├── push.js                # 推送工作流到 n8n 的脚本
│   ├── unpack.js              # 拆分工作流到模块化结构的脚本
│   ├── pack.js                # 打包模块化结构到 JSON 的脚本
│   └── validate.js            # 验证模块化配置的脚本
└── .env                       # 环境变量
```

### 模块化工作流结构

使用模块化工作流命令时，每个工作流的组织结构如下：

```
workflows/my-workflow-modular/
├── README.md                          # 项目文档
├── workflow.yaml                      # 主工作流配置
├── package.json                       # 项目依赖和脚本
├── nodes/                             # 按类别分类的节点定义
│   ├── triggers/                      # 触发器节点
│   │   ├── manual-trigger.yaml
│   │   └── webhook-trigger.yaml
│   ├── processors/                    # 数据处理节点
│   │   ├── http-request.yaml
│   │   └── data-transform.yaml
│   ├── integrations/                  # 第三方服务集成
│   │   ├── google-sheets.yaml
│   │   └── slack-notification.yaml
│   └── ai/                           # AI 和 LangChain 节点
│       ├── openai-chat.yaml
│       └── vector-search.yaml
├── connections/                       # 连接定义
│   ├── main-flow.yaml                # 主数据流
│   └── error-handling.yaml           # 错误处理流
├── settings/                          # 工作流设置
│   ├── execution.yaml                # 执行设置
│   └── error-handling.yaml           # 错误处理设置
├── credentials/                       # 凭据配置
│   ├── credential-mappings.yaml      # 凭据映射
│   └── .env.example                  # 环境变量示例
├── data/                             # 数据文件
│   ├── static/                       # 静态数据
│   └── pinned/                       # 固定测试数据
└── workflow.json                     # 生成的工作流文件（打包后）
```

有关模块化结构的详细信息，请参阅[模块化项目结构文档](./n8n-modular-project-structure.md)。

## 使用工作流程

### 开发新的模块化工作流

```bash
# 1. 从现有工作流创建模板（使用工作流名称）
npm run unpack "模板工作流"

# 2. 修改配置文件
cd workflows/template-workflow
# 编辑 workflow.yaml, nodes/, connections/ 等

# 3. 验证配置
npm run validate "模板工作流"

# 4. 构建工作流
npm run pack "模板工作流"

# 5. 将生成的 workflow.json 导入到 n8n
```

### 修改现有工作流

```bash
# 1. 从 n8n 导出工作流或使用 pull 命令
npm run pull "我的工作流"

# 2. 拆分为模块化结构（直接在同目录）
npm run unpack "我的工作流"

# 3. 修改配置
# 编辑相关的 YAML 文件

# 4. 验证和构建
npm run validate "我的工作流"
npm run pack "我的工作流"

# 5. 推送回 n8n 或重新导入
npm run push "我的工作流"
```

### 团队协作示例

```bash
# 开发者 A
git clone <repository>
npm run pull "共享工作流"
npm run unpack "共享工作流"
# 修改 nodes/new-feature.yaml
git add . && git commit -m "添加新功能节点"

# 开发者 B
git pull
# 修改 connections/main-flow.yaml  
git add . && git commit -m "更新数据流"

# 合并时不会有 JSON 冲突，只有具体的 YAML 文件冲突
npm run pack "共享工作流"  # 生成最终工作流
```

## AI 友好特性

### 1. 语义化结构
- 按功能将节点分组到不同目录
- 文件名直接反映功能用途
- 通过目录结构明确节点类型

### 2. 文档驱动
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

### 3. 标准化模式
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

## 最佳实践

### 文件组织
- 按功能而非技术分组节点
- 保持文件名简洁且有意义
- 使用一致的命名约定

### 配置管理
- 将敏感信息存储在环境变量中
- 使用有意义的描述和注释
- 维护版本控制历史

### 团队协作
- 明确模块责任边界
- 使用标准化的代码审查流程
- 维护更新日志

## 故障排除

### 常见问题

1. **节点 ID 重复**
   ```bash
   npm run validate workflows/project
   # 检查输出中的错误信息，修改重复的节点 ID
   ```

2. **连接引用不存在的节点**
   ```bash
   # 检查 connections/*.yaml 中的节点名称是否与 nodes/*.yaml 中的节点名称匹配
   ```

3. **YAML 格式错误**
   ```bash
   # 使用 YAML 验证工具检查语法
   # 确保缩进使用空格而非制表符
   ```

4. **构建后的 JSON 与原始文件不匹配**
   ```bash
   # 这是正常的，因为：
   # - 字段顺序可能不同
   # - 新增了默认值字段
   # - 功能上应该是等价的
   ```

## 贡献指南

欢迎提交 Issue 和 Pull Request！

### 扩展节点分类

在 `scripts/unpack.js` 中修改 `categorizeNode` 函数：

```javascript
categorizeNode(nodeType) {
    // 添加新的分类逻辑
    if (nodeType.includes('database')) {
        return 'databases';
    }
    
    // 现有逻辑...
}
```

### 添加新的验证规则

在 `scripts/validate.js` 中添加验证逻辑：

```javascript
validateCustomRules() {
    // 添加自定义验证规则
}
```

## 许可证

ISC

## 相关文档

- 📖 **[English Documentation](./README.md)** - 完整英文文档
- 📋 **[n8n JSON 格式规范](./n8n-json-format-specification.md)** - 基于 1568 个工作流的深度分析
- 🏗️ **[模块化项目结构规范](./n8n-modular-project-structure.md)** - AI 友好的项目组织方式