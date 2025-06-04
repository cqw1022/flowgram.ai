import { injectable, inject } from '@flowgram.ai/free-layout-editor';
import { ApiService } from './api-service';
import { BlockService } from './block-service'; // Attempting to import from block-service.ts
import { BlockDefinition } from '../typings/block';

// 前端使用的 Node 结构 (简化版，具体根据 FlowNodeEntity.toJSON() 的输出调整)
export interface FrontendNodeData {
  id: string; // 对应 FlowNodeEntity 的 id
  type: string; // 对应 FlowNodeEntity 的 type
  label?: string;
  position?: { x: number; y: number };
  properties?: Record<string, any>; // 对应表单数据等
  data?: Record<string, any>; // 对应 FlowNodeEntity 的 data
  meta?: Record<string, any>; // 对应 FlowNodeEntity 的 data
  // ... 其他 FlowNodeEntity 可能包含的字段
}

// 前端使用的 Edge 结构 (简化版，具体根据 DocumentModel.EdgeModel 调整)
export interface FrontendEdgeData {
  id: string;
  sourceNodeId: string;
  sourceHandleId?: string;
  targetNodeId: string;
  targetHandleId?: string;
  // ... 其他 EdgeModel 可能包含的字段
}

// API 文档中 Node 的结构 (oocana格式)
export interface OocanaNode {
  node_id: string; // 对应前端的 id
  task: string; // 需要根据前端节点的类型或其他信息转换
  inputs_from?: Array<{
    handle: string;
    value?: any; // 直接值输入
    from_node?: Array<{
      node_id: string;
      output_handle: string;
    }>; // 来自其他节点的输入
  }>;
  // ... 其他 oocana node 配置
}

// API 文档中 Edge 的结构 (oocana格式，如果API直接使用nodes中的inputs_from，则可能不需要单独的edges)
// 根据您提供的示例，edges似乎是通过nodes内部的inputs_from.from_node来表达的。
// 如果API确实需要独立的edges数组，则需要定义OocanaEdge接口。
// 这里假设edges信息已包含在OocanaNode的inputs_from中。

export interface WorkflowDefinition {
  flow_id: string;
  name: string;
  description?: string;
  nodes?: FrontendNodeData[]; // 前端编辑器使用的数据结构
  edges?: FrontendEdgeData[]; // 前端编辑器使用的数据结构
  // 其他工作流相关配置...
}

// 服务器端（Oocana）期望的工作流数据结构
export interface OocanaWorkflowPayload {
  flow_id: string;
  name: string;
  description?: string;
  nodes: OocanaNode[]; // Oocana 格式的节点
  // edges?: OocanaEdge[]; // 如果API需要独立的edges数组
}

// 根据 api.md 定义 /api/flows 的请求体
export interface RunWorkflowPayload {
  block_path: string;
  session?: string;
  nodes?: string[];
  search_paths?: string[];
  exclude_packages?: string[];
  broker_address?: string;
  reporter_enable?: boolean;
  debug?: boolean;
  wait_for_client?: boolean;
  use_cache?: boolean;
  input_values?: Record<string, any>;
  default_package?: string;
  session_dir?: string;
  temp_root?: string;
  bind_paths?: string[];
  retain_env_keys?: string[];
  env_file?: string;
}

// 根据 api.md 定义 /api/flows 的响应体
export interface RunWorkflowResponse {
  session_id: string;
  status: string;
}

// 根据 api.md 定义 /api/flows/{session_id} 的响应体
export interface WorkflowStatusResponse {
  session_id: string;
  status: string;
  result?: any;
  error?: string;
}

@injectable()
export class WorkflowService {
  constructor(
    @inject(ApiService) private apiService: ApiService,
    @inject(BlockService) private blockService: BlockService // Inject BlockService
  ) {}

  /**
   * 添加工作流定义
   * @param workflowData 工作流数据
   * @returns Promise<WorkflowDefinition> 创建成功的工作流定义
   */
  // 将前端节点数据转换为 Oocana 节点格式
  private convertFrontendNodeToOocana(node: FrontendNodeData, edges: FrontendEdgeData[]): OocanaNode {
    // 示例转换逻辑，您需要根据实际情况调整
    // task 的确定可能需要映射规则，例如基于 node.type
    let task: string;
    if (['python', 'nodejs', 'shell'].includes(node.data?.blockDefinition.executor.name)) {
      task = `../pkg/blocks/${node.data?.blockDefinition.block_id}/block.oo.yaml`; // 使用双反斜杠以确保在字符串中表示单个反斜杠
    } else {
      task = node.properties?.task || `self::${node.type || node.id}`; // 示例：从properties或基于类型/ID
    }

    const inputs_from: OocanaNode['inputs_from'] = [];
    // 处理来自其他节点的输入 (基于edges)
    edges.forEach(edge => {
      if (edge.targetNodeId === node.id) {
        inputs_from.push({
          handle: edge.targetHandleId || 'default_input', // 假设的默认输入句柄
          from_node: [{
            node_id: edge.sourceNodeId,
            output_handle: edge.sourceHandleId || 'default_output' // 假设的默认输出句柄
          }]
        });
      }
    });

    // 处理直接值输入 (基于 node.properties 或其他字段)
    if (node.properties) {
      for (const key in node.properties) {
        // 避免重复添加已经通过边连接的输入
        if (!inputs_from.some(input => input.handle === key)) {
          // 这里需要一个机制来区分哪些 property 是直接输入值
          // 示例：假设所有不在已知边连接中的 property 都是直接输入
          // 或者您可以有一个特定的字段来标记直接输入，例如 node.properties.directInputs
          if (key !== 'task') { // 假设 'task' 不是直接输入值
             inputs_from.push({ handle: key, value: node.properties[key] });
          }
        }
      }
    }

    return {
      node_id: node.id,
      task: task,
      inputs_from: inputs_from.length > 0 ? inputs_from : undefined,
    };
  }

  // 将 Oocana 节点格式转换为前端节点数据
  private async convertOocanaNodeToFrontend(oocanaNode: OocanaNode): Promise<{
    node: FrontendNodeData;
    edges: FrontendEdgeData[];
  }> {
    const block_id = oocanaNode.task.startsWith('self::') ? oocanaNode.task.substring(6) :
    (oocanaNode.task.startsWith('../pkg/blocks/') ? oocanaNode.task.substring('../pkg/blocks/'.length).replace("/block.oo.yaml","") : oocanaNode.task); // if not self:: or ../blocks/, use task as block_id
    let actualType = block_id; // Default to block_id as type

    let blockDefinition: BlockDefinition | undefined;
    try {
      blockDefinition = await this.blockService.getBlockDefinitionById(block_id);
      if (blockDefinition) {
        actualType = `${blockDefinition.type}_${blockDefinition.executor.name}`;
      } else {
        console.warn(`Block definition not found for block_id: ${block_id}. Using block_id as type.`);
      }
    } catch (error) {
      console.error(`Error fetching block definition for block_id: ${block_id}`, error);
      // actualType remains block_id in case of error
    }

    const frontendNode: FrontendNodeData = {
      id: oocanaNode.node_id,
      type: actualType,
      meta: {
        // position will be handled by the layout engine or when saving layout separately
      },
      data: {
        title: blockDefinition?.name || oocanaNode.node_id, // Use block name as title if available
        blockDefinition: blockDefinition, // Store the fetched blockDefinition
        inputs: blockDefinition?.inputs_def || { type: 'object', properties: {} }, // Populate from blockDefinition
        inputsValues: {}, // Initialize and populate later
        outputs: blockDefinition?.outputs_def || { type: 'object', properties: {} }, // Populate from blockDefinition
      },
    };
    const frontendEdges: FrontendEdgeData[] = [];

    if (oocanaNode.inputs_from) {
      const inputsValues: Record<string, any> = {};
      oocanaNode.inputs_from.forEach((input, index) => {
        if (input.from_node && input.from_node.length > 0) {
          input.from_node.forEach(fn => {
            frontendEdges.push({
              id: `e-${fn.node_id}-${oocanaNode.node_id}-${input.handle}-${index}`,
              sourceNodeId: fn.node_id,
              sourceHandleId: fn.output_handle,
              targetNodeId: oocanaNode.node_id,
              targetHandleId: input.handle,
            });
          });
        } else if (input.value !== undefined) {
          inputsValues[input.handle] = input.value;
        }
      });
      if (Object.keys(inputsValues).length > 0) {
        frontendNode.data.inputsValues = inputsValues;
      }
    }

    // Placeholder for blocks if the node type supports nested blocks (e.g., 'loop')
    // if (actualType.startsWith('loop')) {
    //   if (!frontendNode.data) frontendNode.data = {}; // Ensure data object exists
    //   frontendNode.data.blocks = []; // Needs logic to convert nested Oocana nodes
    // }

    return {
      node: frontendNode,
      edges: frontendEdges,
    };
  }

  private transformToOocanaPayload(workflowData: WorkflowDefinition): OocanaWorkflowPayload {
    const oocanaNodes = (workflowData.nodes || []).map(node =>
      this.convertFrontendNodeToOocana(node, workflowData.edges || [])
    );
    return {
      flow_id: workflowData.flow_id, // 应使用 workflowData.flow_id
      name: workflowData.name,
      description: workflowData.description,
      nodes: oocanaNodes,
    };
  }

  private transformToFrontendDefinition(oocanaData: OocanaWorkflowPayload): WorkflowDefinition {
    const frontendNodes: FrontendNodeData[] = [];
    let frontendEdges: FrontendEdgeData[] = [];
    (oocanaData.nodes || []).forEach(async oNode => {
      const { node, edges } = await this.convertOocanaNodeToFrontend(oNode);
      frontendNodes.push(node);
      frontendEdges = frontendEdges.concat(edges);
    });
    // 去重edges，因为可能从多个node转换时产生重复
    const uniqueEdges = Array.from(new Map(frontendEdges.map(edge => [edge.id, edge])).values());

    return {
      flow_id: oocanaData.flow_id, // 应使用 oocanaData.flow_id
      name: oocanaData.name,
      description: oocanaData.description,
      nodes: frontendNodes,
      edges: uniqueEdges,
    };
  }

  async addWorkflow(workflowData: WorkflowDefinition): Promise<WorkflowDefinition> {
    try {
      const payload = this.transformToOocanaPayload(workflowData);
      const newOocanaWorkflow = await this.apiService.post<OocanaWorkflowPayload>('/api/flows-store', payload);
      return this.transformToFrontendDefinition(newOocanaWorkflow);
    } catch (error) {
      console.error('添加工作流失败:', error);
      throw error;
    }
  }

  async runWorkflow(
    arg1: RunWorkflowPayload | string,
    arg2?: Record<string, any>
  ): Promise<RunWorkflowResponse> {
    if (typeof arg1 === 'string') {
      // Overload: runWorkflow(flowId: string, inputs?: Record<string, any>)
      const flowId = arg1;
      const inputs = arg2 || {};
      const payload: RunWorkflowPayload = {
        block_path: flowId,
        input_values: inputs,
      };
      try {
        const response = await this.apiService.post<RunWorkflowResponse>('/api/flows/run', payload);
        return response;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`运行工作流 ${flowId} (by ID) 失败: ${errorMessage}`, error);
        throw error;
      }
    } else {
      // Overload: runWorkflow(payload: RunWorkflowPayload)
      const payload = arg1;
      try {
        const response = await this.apiService.post<RunWorkflowResponse>('/api/flows/run', payload);
        return response;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`运行工作流 (by payload) 失败: ${errorMessage}`, error);
        throw error;
      }
    }
  }

  // 未来可以添加更多工作流相关的方法，例如：
  /**
   * 获取指定ID的工作流定义
   * @param flowId 工作流ID
   * @returns Promise<WorkflowDefinition | undefined> 工作流定义或undefined
   */
  async getWorkflow(flowId: string): Promise<WorkflowDefinition | undefined> {
    try {
      const oocanaWorkflow = await this.apiService.get<OocanaWorkflowPayload>(`/api/flows-store/${flowId}`);
      if (!oocanaWorkflow) return undefined;
      return this.transformToFrontendDefinition(oocanaWorkflow);
    } catch (error) {
      console.error(`获取工作流 ${flowId} 失败:`, error);
      if ((error as any)?.response?.status === 404) {
        return undefined;
      }
      throw error;
    }
  }

  /**
   * 更新指定ID的工作流定义
   * @param flowId 工作流ID
   * @param data 部分工作流定义数据
   * @returns Promise<WorkflowDefinition> 更新后的工作流定义
   */
  async updateWorkflow(flowId: string, data: Partial<WorkflowDefinition>): Promise<WorkflowDefinition> {
    try {
      // 构建完整的 WorkflowDefinition 对象用于转换，即使只是部分更新
      // 这需要一个当前工作流的副本，或者假设 data 包含了必要的 name, description, nodes, edges
      // 如果 data 只包含部分字段，需要先获取完整的工作流，合并后再转换
      // 为简化，这里假设 data 至少包含 name, nodes, edges (如果它们被修改)
      const payload = this.transformToOocanaPayload({ flow_id: flowId, name: data.name || '', nodes: data.nodes, edges: data.edges, ...data });
      console.log('payload', payload);
      const updatedOocanaWorkflow = await this.apiService.put<OocanaWorkflowPayload>(`/api/flows-store/${flowId}`, payload);
      return this.transformToFrontendDefinition(updatedOocanaWorkflow);
    } catch (error) {
      console.error(`更新工作流 ${flowId} 失败:`, error);
      throw error;
    }
  }

  /**
   * 删除指定ID的工作流定义
   * @param flowId 工作流ID
   * @returns Promise<void>
   */
  async deleteWorkflow(flowId: string): Promise<void> {
    try {
      // 假设 DELETE /api/flows-store/{flow_id} 用于删除工作流
      await this.apiService.delete(`/api/flows-store/${flowId}`);
    } catch (error) {
      console.error(`删除工作流 ${flowId} 失败:`, error);
      throw error;
    }
  }

  /**
   * 列出所有工作流定义
   * @returns Promise<WorkflowDefinition[]> 工作流定义列表
   */
  async listWorkflows(): Promise<WorkflowDefinition[]> {
    try {
      // API 文档指示 GET /api/flows-store 返回 OocanaWorkflowPayload[]
      // 但之前的日志显示是 { flows: WorkflowDefinition[], total: number }
      // 这里我们遵循 API 文档的 GET /api/flows-store 直接返回数组的格式
      // 如果实际返回的是对象，需要调整这里的代码和 OocanaWorkflowPayload[] 类型
      const oocanaWorkflows = await this.apiService.get<OocanaWorkflowPayload[]>('/api/flows-store');
      if (Array.isArray(oocanaWorkflows)) {
        return oocanaWorkflows.map(ow => this.transformToFrontendDefinition(ow));
      }
      // 处理之前观察到的 { flows: [], total: number } 格式
      const resultAsObject = oocanaWorkflows as any as { flows: OocanaWorkflowPayload[], total: number };
      if (resultAsObject && Array.isArray(resultAsObject.flows)) {
        console.warn('API /api/flows-store 返回了对象格式 {flows, total}, 而不是预期的数组。正在适配。');
        return resultAsObject.flows.map(ow => this.transformToFrontendDefinition(ow));
      }

      console.warn('列出工作流时，响应格式不符合预期, 返回空数组。响应:', oocanaWorkflows);
      return [];
    } catch (error) {
      console.error('列出工作流失败:', error);
      throw error;
    }
  }

  /**
   * 获取工作流运行状态
   * @param sessionId 会话ID
   * @returns Promise<WorkflowStatusResponse> 工作流状态
   */
  async getWorkflowStatus(sessionId: string): Promise<WorkflowStatusResponse> {
    try {
      const response = await this.apiService.get<WorkflowStatusResponse>(`/api/flows/status/${sessionId}`);
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`获取工作流状态失败: ${errorMessage}`, error);
      throw error;
    }
  }

  // The runWorkflow(flowId, inputs) functionality is now part of the overloaded runWorkflow method.
}
