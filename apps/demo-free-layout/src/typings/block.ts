export interface BlockExecutor {
  name: string;        // 执行器名称（rust, python, nodejs等）
  entry?: string;      // 脚本入口文件（可选）
  script?: string;     // 执行的命令（shell执行器用）
}

export interface BlockInputDef {
  handle: string;      // 输入句柄名称
  optional: boolean;   // 是否可选
  type?: string;       // 数据类型（可选）
  description?: string; // 描述（可选）
  default?: any;       // 默认值（可选）
}

export interface BlockOutputDef {
  handle: string;      // 输出句柄名称
  type?: string;       // 数据类型（可选）
  description?: string; // 描述（可选）
}

export interface BlockDefinition {
  block_id?: string; // 新增，后端返回的唯一标识
  type: string;               // 块类型（task_block, service_block, flow_block）
  executor: BlockExecutor;    // 执行器配置
  inputs_def: BlockInputDef[]; // 输入定义
  outputs_def: BlockOutputDef[]; // 输出定义
  name?: string;              // 块名称（可选）
  description?: string;       // 块描述（可选）
  icon?: string;              // 图标（可选，客户端UI用）
  category?: string;          // 分类（可选，客户端UI用）
  color?: string;             // 颜色（可选，客户端UI用）
}

// API 返回的服务器块定义格式
export interface ServerBlockDefinition {
  block_id: string;           // 服务器上的块ID
  type: string;               // 块类型
  executor: {                 // 执行器配置
    name: string;             // 执行器名称
    entry?: string;           // 脚本入口文件
    script?: string;          // 执行命令
  };
  inputs_def: {               // 输入定义
    handle: string;           // 输入句柄
    optional: boolean;        // 是否可选
    type?: string;            // 数据类型
    description?: string;     // 描述
    default?: any;            // 默认值
  }[];
  outputs_def: {              // 输出定义
    handle: string;           // 输出句柄
    type?: string;            // 数据类型
    description?: string;     // 描述
  }[];
  name?: string;              // 块名称
  description?: string;       // 块描述
  // 其他可能的服务器特有字段
}
