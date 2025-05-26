import { injectable, inject } from '@flowgram.ai/free-layout-editor';
import { ApiService } from './api-service';

// 假设的工作流定义接口，后续可以根据实际情况调整
export interface WorkflowDefinition {
  flow_id: string;
  name: string;
  description?: string;
  // 其他工作流相关配置...
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
  input_values?: Record<string, any>; // object in JSON, Record<string, any> in TS
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
  status: string; // e.g., "running"
}

@injectable()
export class WorkflowService {
  constructor(
    @inject(ApiService) private apiService: ApiService
  ) {}

  /**
   * 添加工作流定义
   * @param workflowData 工作流数据
   * @returns Promise<WorkflowDefinition> 创建成功的工作流定义
   */
  async addWorkflow(workflowData: WorkflowDefinition): Promise<WorkflowDefinition> {
    try {
      // 根据 api.md, 添加工作流定义的接口是 POST /api/flows-store
      // 请求体需要包含 flow_id 和其他工作流配置，例如 name。
      // API 文档指示客户端应在请求体中提供 flow_id。
      // 为了与 block-service.ts 的 addTaskBlock 保持一致性，这里假设服务端会返回完整的 WorkflowDefinition
      const newWorkflow = await this.apiService.post<WorkflowDefinition>('/api/flows-store', workflowData);
      return newWorkflow;
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
      const inputs = arg2 || {}; // If arg2 is undefined (inputs not provided), use empty object
      const payload: RunWorkflowPayload = {
        block_path: flowId,
        input_values: inputs,
      };
      try {
        // 根据 api.md, 运行工作流的接口是 POST /api/flows
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
        // 根据 api.md, 运行工作流的接口是 POST /api/flows
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
      // 假设 GET /api/flows-store/{flow_id} 用于获取单个工作流
      const workflow = await this.apiService.get<WorkflowDefinition>(`/api/flows-store/${flowId}`);
      return workflow;
    } catch (error) {
      console.error(`获取工作流 ${flowId} 失败:`, error);
      // 根据API实际行为，如果找不到应该返回 undefined 而不是抛出错误，或者API会返回404，由apiService处理
      // 这里假设apiService在404时会返回undefined或特定错误，可转换为undefined
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
  async updateWorkflow(flowId: string, data: Partial<Omit<WorkflowDefinition, 'flow_id'>>): Promise<WorkflowDefinition> {
    try {
      // 假设 PUT /api/flows-store/{flow_id} 用于更新工作流
      const updatedWorkflow = await this.apiService.put<WorkflowDefinition>(`/api/flows-store/${flowId}`, data);
      return updatedWorkflow;
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
      // 根据控制台日志，GET /api/flows-store 返回的是一个对象 { flows: WorkflowDefinition[], total: number }
      const result = await this.apiService.get<{ flows: WorkflowDefinition[], total: number }>('/api/flows-store');
      console.log('列出工作流成功:', result);
      // 确保返回的是 flows 数组，如果API行为与预期不符，则返回空数组或抛出错误
      if (result && Array.isArray(result.flows)) {
        return result.flows;
      }
      console.warn('列出工作流时，响应格式不符合预期或flows数组不存在, 返回空数组。响应:', result);
      return []; // 或者可以抛出错误，取决于希望如何处理异常情况
    } catch (error) {
      console.error('列出工作流失败:', error);
      throw error;
    }
  }

  // The runWorkflow(flowId, inputs) functionality is now part of the overloaded runWorkflow method.
}
