# n8n 工作流 JSON 格式详细说明

[![返回主页](https://img.shields.io/badge/返回-主页-blue.svg)](./README_CN.md) [![English](https://img.shields.io/badge/docs-English-red.svg)](./README.md) [![模块化结构](https://img.shields.io/badge/查看-模块化结构-green.svg)](./n8n-modular-project-structure.md)

基于对 1568 个 n8n 工作流文件的深度分析，本文档提供了 n8n 工作流 JSON 格式的完整规范说明。

> 💡 **提示**: 如果您希望使用更友好的模块化结构来管理工作流，请查看 [模块化项目结构规范](./n8n-modular-project-structure.md)。

## 分析概览

- **总工作流数量**: 1568
- **唯一字段总数**: 40,313
- **节点类型总数**: 376
- **分析错误**: 0

## 顶层结构

每个 n8n 工作流 JSON 文件都包含以下核心字段：

```json
{
  "id": "string",           // 工作流唯一标识符
  "name": "string",         // 工作流名称
  "active": boolean,        // 工作流是否激活
  "nodes": [],              // 节点数组
  "connections": {},        // 节点间连接关系
  "meta": {},               // 元数据信息
  "settings": {},           // 工作流设置
  "tags": [],               // 标签数组
  "pinData": {},            // 固定数据
  "staticData": {},         // 静态数据
  "versionId": "string",    // 版本标识符
  "createdAt": "string",    // 创建时间 (ISO 8601)
  "updatedAt": "string",    // 更新时间 (ISO 8601)
  "isArchived": boolean,    // 是否已归档
  "shared": [],             // 共享信息数组
  "triggerCount": number    // 触发器数量
}
```

## 1. 基础字段

### 1.1 必需字段

| 字段名 | 类型 | 描述 | 示例 |
|--------|------|------|------|
| `id` | string | 工作流唯一标识符，通常为 UUID 格式 | `"4CnUOZExvXMQTGEB"` |
| `name` | string | 工作流的显示名称 | `"Website Summary"` |
| `active` | boolean | 工作流是否处于激活状态 | `true`/`false` |
| `nodes` | array | 包含所有节点的数组 | `[...]` |
| `connections` | object | 定义节点间的连接关系 | `{...}` |

### 1.2 可选字段

| 字段名 | 类型 | 描述 | 默认值 |
|--------|------|------|--------|
| `tags` | array | 工作流标签，用于分类 | `[]` |
| `pinData` | object | 固定的测试数据 | `{}` |
| `staticData` | object | 静态数据存储 | `{}` |
| `versionId` | string | 工作流版本标识符 | - |
| `createdAt` | string | 工作流创建时间 (ISO 8601 格式) | - |
| `updatedAt` | string | 工作流最后更新时间 (ISO 8601 格式) | - |
| `isArchived` | boolean | 工作流是否已归档 | `false` |
| `shared` | array | 工作流共享信息数组 | `[]` |
| `triggerCount` | number | 工作流中触发器节点的数量 | - |

## 2. 元数据 (meta)

`meta` 对象包含工作流的元信息：

```json
{
  "meta": {
    "instanceId": "string",                    // 实例标识符
    "templateCredsSetupCompleted": boolean,    // 模板凭据设置是否完成
    "templateId": "string",                    // 模板ID（如果基于模板创建）
    "lastDeploymentSource": "string",          // 最后部署来源
    "lastDeploymentAt": "string"               // 最后部署时间
  }
}
```

### 常见 meta 字段

- `instanceId`: n8n 实例的唯一标识符
- `templateCredsSetupCompleted`: 指示基于模板的工作流是否已完成凭据设置
- `templateId`: 如果工作流基于模板创建，则包含模板ID
- `lastDeploymentSource`: 最后一次部署的来源（如 "git", "ui" 等）

## 3. 设置 (settings)

`settings` 对象定义工作流的执行设置：

```json
{
  "settings": {
    "executionOrder": "string",        // 执行顺序 ("v0" 或 "v1")
    "saveManualExecutions": boolean,   // 是否保存手动执行
    "callerPolicy": "string",          // 调用者策略
    "errorWorkflow": "string",         // 错误处理工作流ID
    "timezone": "string",              // 时区设置
    "saveDataErrorExecution": "string", // 错误时数据保存策略
    "saveDataSuccessExecution": "string" // 成功时数据保存策略
  }
}
```

### 常见 settings 字段

- `executionOrder`: 执行顺序版本，通常为 `"v1"`
- `saveManualExecutions`: 是否保存手动执行的结果
- `callerPolicy`: 工作流调用策略设置
- `errorWorkflow`: 发生错误时要执行的工作流ID

## 4. 节点 (nodes)

`nodes` 是一个数组，包含工作流中的所有节点：

```json
{
  "nodes": [
    {
      "id": "string",           // 节点唯一标识符
      "name": "string",         // 节点显示名称
      "type": "string",         // 节点类型
      "position": [x, y],       // 节点在画布上的位置
      "parameters": {},         // 节点参数配置
      "typeVersion": number,    // 节点类型版本
      "credentials": {},        // 凭据配置
      "webhookId": "string",    // Webhook ID（如果适用）
      "disabled": boolean,      // 节点是否禁用
      "continueOnFail": boolean, // 失败时是否继续
      "alwaysOutputData": boolean, // 是否总是输出数据
      "executeOnce": boolean,   // 是否只执行一次
      "retryOnFail": boolean,   // 失败时是否重试
      "maxTries": number,       // 最大重试次数
      "waitBetweenTries": number, // 重试间隔时间
      "notes": "string",        // 节点备注
      "color": "string"         // 节点颜色
    }
  ]
}
```

### 4.1 节点基础字段

| 字段名 | 类型 | 必需 | 描述 |
|--------|------|------|------|
| `id` | string | ✓ | 节点唯一标识符，UUID 格式 |
| `name` | string | ✓ | 节点的显示名称 |
| `type` | string | ✓ | 节点类型，决定节点功能 |
| `position` | array | ✓ | `[x, y]` 坐标，节点在画布上的位置 |
| `parameters` | object | - | 节点的参数配置 |
| `typeVersion` | number | ✓ | 节点类型的版本号 |

### 4.2 节点高级字段

| 字段名 | 类型 | 描述 | 默认值 |
|--------|------|------|--------|
| `credentials` | object | 节点使用的凭据配置 | `{}` |
| `disabled` | boolean | 节点是否被禁用 | `false` |
| `continueOnFail` | boolean | 失败时是否继续执行后续节点 | `false` |
| `alwaysOutputData` | boolean | 即使没有输入数据也输出数据 | `false` |
| `executeOnce` | boolean | 在循环中是否只执行一次 | `false` |
| `retryOnFail` | boolean | 失败时是否自动重试 | `false` |
| `maxTries` | number | 最大重试次数 | `3` |
| `waitBetweenTries` | number | 重试间隔时间（毫秒） | `1000` |
| `notes` | string | 节点备注说明 | `""` |
| `color` | string | 节点颜色（十六进制） | `""` |

### 4.3 常见节点类型

基于分析的 376 种节点类型，主要分类如下：

#### 触发器节点
- `n8n-nodes-base.manualTrigger` - 手动触发
- `n8n-nodes-base.cron` - 定时触发
- `n8n-nodes-base.webhook` - Webhook 触发
- `n8n-nodes-base.emailReadImap` - 邮件触发

#### 核心功能节点
- `n8n-nodes-base.set` - 设置/编辑字段
- `n8n-nodes-base.code` - 代码执行
- `n8n-nodes-base.function` - 函数节点
- `n8n-nodes-base.if` - 条件判断
- `n8n-nodes-base.switch` - 分支切换
- `n8n-nodes-base.merge` - 数据合并
- `n8n-nodes-base.splitInBatches` - 批量分割

#### 服务集成节点
- `n8n-nodes-base.googleSheets` - Google Sheets
- `n8n-nodes-base.gmail` - Gmail
- `n8n-nodes-base.slack` - Slack
- `n8n-nodes-base.notion` - Notion
- `n8n-nodes-base.airtable` - Airtable

#### AI/LangChain 节点
- `@n8n/n8n-nodes-langchain.openAi` - OpenAI
- `@n8n/n8n-nodes-langchain.anthropic` - Anthropic
- `@n8n/n8n-nodes-langchain.agent` - AI Agent
- `@n8n/n8n-nodes-langchain.vectorStore` - 向量存储

### 4.4 节点参数 (parameters)

节点参数是一个灵活的对象，其结构取决于节点类型：

```json
{
  "parameters": {
    "operation": "string",          // 操作类型
    "resource": "string",           // 资源类型
    "options": {},                  // 选项配置
    "authentication": "string",     // 认证方式
    "requestMethod": "string",      // HTTP 方法
    "url": "string",               // URL 地址
    "headers": {},                 // 请求头
    "body": {},                    // 请求体
    "query": {},                   // 查询参数
    "values": {},                  // 值设置
    "conditions": {},              // 条件设置
    "mode": "string",              // 模式设置
    "jsCode": "string",            // JavaScript 代码
    "workflowId": "string"         // 工作流ID
  }
}
```

#### 常见参数模式

1. **HTTP 请求节点**:
```json
{
  "parameters": {
    "requestMethod": "GET|POST|PUT|DELETE|PATCH",
    "url": "https://api.example.com/endpoint",
    "headers": {
      "parameterType": "fixedCollection",
      "parameters": {
        "parameter": []
      }
    },
    "body": {
      "modeType": "formData|json|raw",
      "parameters": {}
    }
  }
}
```

2. **代码执行节点**:
```json
{
  "parameters": {
    "mode": "runOnceForAllItems|runOnceForEachItem",
    "jsCode": "// JavaScript code here\nreturn $input.all();"
  }
}
```

3. **条件判断节点**:
```json
{
  "parameters": {
    "conditions": {
      "options": {
        "caseSensitive": true,
        "leftValue": "",
        "typeValidation": "strict"
      },
      "conditions": [
        {
          "id": "string",
          "leftValue": "{{ $json.field }}",
          "rightValue": "value",
          "operator": {
            "type": "string",
            "operation": "equals|contains|startsWith|endsWith"
          }
        }
      ],
      "combinator": "and|or"
    }
  }
}
```

### 4.5 凭据配置 (credentials)

某些节点需要凭据配置：

```json
{
  "credentials": {
    "credentialType": {
      "id": "string",           // 凭据ID
      "name": "string"          // 凭据名称
    }
  }
}
```

## 5. 连接 (connections)

`connections` 对象定义节点间的数据流连接：

```json
{
  "connections": {
    "source_node_name": {
      "main": [                    // 主输出端口
        [                          // 输出索引0的连接
          {
            "node": "target_node_name",  // 目标节点名称
            "type": "main",              // 连接类型
            "index": 0                   // 目标节点输入索引
          }
        ]
      ]
    }
  }
}
```

### 5.1 连接结构详解

- **键**: 源节点的名称
- **值**: 该节点的输出连接配置

#### 输出端口类型
- `main`: 主要数据流
- `ai_memory`: AI 内存连接
- `ai_tool`: AI 工具连接
- `ai_languageModel`: AI 语言模型连接
- `ai_embedding`: AI 嵌入连接
- `ai_vectorStore`: AI 向量存储连接

#### 连接对象属性
- `node`: 目标节点名称
- `type`: 连接类型（通常为 "main"）
- `index`: 目标节点的输入索引（从0开始）

### 5.2 复杂连接示例

```json
{
  "connections": {
    "HTTP Request": {
      "main": [
        [
          {
            "node": "Set Name",
            "type": "main",
            "index": 0
          },
          {
            "node": "Error Handler",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "IF Condition": {
      "main": [
        [
          {
            "node": "True Branch",
            "type": "main",
            "index": 0
          }
        ],
        [
          {
            "node": "False Branch", 
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  }
}
```

## 6. 特殊字段

### 6.1 固定数据 (pinData)

用于测试时固定某些节点的输出数据：

```json
{
  "pinData": {
    "node_name": [
      {
        "json": {
          "field1": "value1",
          "field2": "value2"
        }
      }
    ]
  }
}
```

### 6.2 静态数据 (staticData)

存储工作流执行期间的持久化数据：

```json
{
  "staticData": {
    "global": {},      // 全局静态数据
    "node:node_name": {} // 特定节点的静态数据
  }
}
```

### 6.3 共享信息 (shared)

工作流的共享和权限信息：

```json
{
  "shared": [
    {
      "updatedAt": "2025-10-28T15:12:39.276Z",
      "createdAt": "2025-10-28T15:12:39.276Z", 
      "role": "workflow:owner",              // 角色权限
      "workflowId": "7ATgX79LVweAyPr9",      // 工作流ID
      "projectId": "1Sveeh0pAnjpk73c"       // 项目ID
    }
  ]
}
```

### 6.4 时间戳字段

工作流包含创建和更新时间戳：

```json
{
  "createdAt": "2025-10-28T15:12:39.276Z",  // 创建时间
  "updatedAt": "2025-10-31T12:45:21.533Z"   // 最后更新时间
}
```

### 6.5 归档状态 (isArchived)

指示工作流是否已被归档：

```json
{
  "isArchived": false  // true表示已归档，false表示活跃
}
```

### 6.6 触发器计数 (triggerCount)

记录工作流中触发器节点的数量：

```json
{
  "triggerCount": 2  // 工作流包含的触发器节点数量
}
```

## 7. 版本控制

### 7.1 版本字段

- `versionId`: 工作流版本的唯一标识符
- `typeVersion`: 每个节点类型的版本号

### 7.2 向后兼容性

n8n 通过 `typeVersion` 字段维护节点的向后兼容性，确保旧版本的工作流仍能正常运行。

## 8. 数据类型规范

### 8.1 基础数据类型

| 类型 | 描述 | 示例 |
|------|------|------|
| `string` | 字符串 | `"Hello World"` |
| `number` | 数字 | `42`, `3.14` |
| `boolean` | 布尔值 | `true`, `false` |
| `array` | 数组 | `[1, 2, 3]` |
| `object` | 对象 | `{"key": "value"}` |
| `null` | 空值 | `null` |

### 8.2 特殊数据格式

#### 位置坐标
```json
"position": [x, y]  // 数字数组，表示画布坐标
```

#### 颜色值
```json
"color": "#FF0000"  // 十六进制颜色代码
```

#### 时间戳
```json
"createdAt": "2023-01-01T00:00:00.000Z"  // ISO 8601 格式
```

## 9. 验证规则

### 9.1 必需字段验证

- 每个工作流必须包含 `id`, `name`, `nodes`, `connections`
- 每个节点必须包含 `id`, `name`, `type`, `position`, `typeVersion`
- 导出的工作流通常包含 `createdAt`, `updatedAt` 时间戳

### 9.2 引用完整性

- `connections` 中引用的节点名称必须在 `nodes` 中存在
- 节点ID在工作流内必须唯一
- 连接的目标索引不能超过目标节点的输入端口数量

### 9.3 数据约束

- 节点位置坐标必须为数字
- 节点类型版本必须为正整数
- 工作流ID和节点ID应符合UUID格式（推荐）

## 10. 最佳实践

### 10.1 命名规范

- 使用有意义的节点名称
- 避免特殊字符和空格
- 使用一致的命名约定

### 10.2 结构组织

- 逻辑相关的节点放置在相近位置
- 使用适当的节点分组
- 添加必要的注释和备注

### 10.3 性能优化

- 合理设置批处理大小
- 避免不必要的数据传递
- 使用适当的错误处理机制

## 11. 完整示例

```json
{
  "id": "4CnUOZExvXMQTGEB",
  "meta": {
    "instanceId": "159ec2e1d690fe685084d28de8ca73848642bf563457a19b94cfc00f23a0d9a9",
    "templateCredsSetupCompleted": true
  },
  "name": "Simple HTTP Workflow",
  "active": false,
  "isArchived": false,
  "tags": ["automation", "api"],
  "createdAt": "2025-10-28T15:12:39.276Z",
  "updatedAt": "2025-10-31T12:45:21.533Z",
  "triggerCount": 1,
  "shared": [
    {
      "updatedAt": "2025-10-28T15:12:39.276Z",
      "createdAt": "2025-10-28T15:12:39.276Z",
      "role": "workflow:owner",
      "workflowId": "4CnUOZExvXMQTGEB",
      "projectId": "1Sveeh0pAnjpk73c"
    }
  ],
  "nodes": [
    {
      "id": "6791eccd-206f-46db-b2a0-fd22eddcbaab",
      "name": "Manual Trigger",
      "type": "n8n-nodes-base.manualTrigger",
      "position": [250, 300],
      "parameters": {},
      "typeVersion": 1
    },
    {
      "id": "de262216-3632-44fa-8095-51b2890a2bff",
      "name": "HTTP Request",
      "type": "n8n-nodes-base.httpRequest",
      "position": [450, 300],
      "parameters": {
        "requestMethod": "GET",
        "url": "https://api.github.com/users/octocat"
      },
      "typeVersion": 4.2
    },
    {
      "id": "13509a29-9641-4cb7-a100-322dbcf18efc",
      "name": "Set Response",
      "type": "n8n-nodes-base.set",
      "position": [650, 300],
      "parameters": {
        "values": {
          "string": [
            {
              "name": "username",
              "value": "={{ $json.login }}"
            },
            {
              "name": "followers",
              "value": "={{ $json.followers }}"
            }
          ]
        }
      },
      "typeVersion": 3.4
    }
  ],
  "pinData": {},
  "staticData": null,
  "settings": {
    "executionOrder": "v1"
  },
  "versionId": "7a55ee84-18ab-4a3b-a18b-49c4aeff424e",
  "connections": {
    "Manual Trigger": {
      "main": [
        [
          {
            "node": "HTTP Request",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "HTTP Request": {
      "main": [
        [
          {
            "node": "Set Response",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  }
}
```

## 总结

本规范基于对 1568 个真实 n8n 工作流的深度分析，涵盖了 376 种不同的节点类型和超过 40,000 个唯一字段。这个规范可以作为：

1. **开发参考**: 开发 n8n 工作流时的结构指南
2. **API 设计**: 设计与 n8n 集成的 API 接口
3. **数据验证**: 验证工作流 JSON 格式的正确性
4. **自动化工具**: 构建工作流自动化生成工具
5. **数据迁移**: 在不同系统间迁移工作流数据

该规范将随着 n8n 平台的发展而持续更新，以确保与最新版本保持一致。

---

## 相关文档

- 📖 **[项目主页](./README_CN.md)** - 完整使用指南和命令说明
- 🏗️ **[模块化项目结构规范](./n8n-modular-project-structure.md)** - AI 友好的项目组织方式
- 📄 **[English Documentation](./README.md)** - English version of the main documentation