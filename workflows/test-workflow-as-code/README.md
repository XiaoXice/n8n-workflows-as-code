# Test Workflow as Code

Test Workflow as Code

## 工作流信息

- **ID**: x0bomZmzVz5j6lGl
- **状态**: 未激活
- **节点数量**: 3
- **创建时间**: 2025-11-03T14:30:03.072Z
- **更新时间**: 2025-11-03T14:30:37.126Z

## 使用方法

### 构建工作流
```bash
npm run build
```

### 验证配置
```bash
npm run validate
```

### 部署工作流
```bash
npm run deploy
```

## 文件结构

- `workflow.yaml` - 主配置文件
- `nodes/` - 节点定义
- `connections/` - 连接配置
- `settings/` - 工作流设置
- `credentials/` - 凭据配置
- `data/` - 数据文件

## 注意事项

请确保在部署前配置好所需的凭据信息。
