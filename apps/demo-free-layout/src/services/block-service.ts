import { injectable, inject } from '@flowgram.ai/free-layout-editor';
import { ApiService } from './api-service';
import { BlockDefinition, ServerBlockDefinition } from '../typings/block';

@injectable()
export class BlockService {
  private blockDefinitions: BlockDefinition[] = [];
  private isLoaded = false;

  constructor(
    @inject(ApiService) private apiService: ApiService
  ) {}

  /**
   * 服务器块定义转换为前端模型
   */
  private convertServerBlockToClientModel(serverBlock: ServerBlockDefinition): BlockDefinition {
    // 服务器与客户端模型结构基本一致，直接转换
    return {
      block_id: serverBlock.block_id,
      type: serverBlock.type,
      executor: serverBlock.executor,
      inputs_def: serverBlock.inputs_def,
      outputs_def: serverBlock.outputs_def,
      name: serverBlock.name,
      description: serverBlock.description,
      // 其他字段保持不变...
    };
  }

  /**
   * 前端模型转换为服务器格式
   */
  private convertClientModelToServerBlock(clientBlock: BlockDefinition): Omit<ServerBlockDefinition, 'block_id'> {
    return {
      type: clientBlock.type,
      executor: clientBlock.executor,
      inputs_def: clientBlock.inputs_def,
      outputs_def: clientBlock.outputs_def,
      name: clientBlock.name,
      description: clientBlock.description,
      // 其他字段保持不变...
    };
  }

  /**
   * 加载所有块定义
   */
  async loadBlockDefinitions(): Promise<BlockDefinition[]> {
    if (this.isLoaded) {
      return this.blockDefinitions;
    }

    try {
      // 调用 API 获取所有块定义，根据文档应该使用 /api/blocks
      const serverBlocks = await this.apiService.get<ServerBlockDefinition[]>('/api/blocks');
      // 转换服务器数据为前端模型
      this.blockDefinitions = serverBlocks.map(block => this.convertServerBlockToClientModel(block));
      this.isLoaded = true;

      return this.blockDefinitions;
    } catch (error) {
      console.error('加载块定义失败:', error);
      throw error;
    }
  }

  /**
   * 添加任务块
   */
  async addTaskBlock(blockData: BlockDefinition): Promise<BlockDefinition> {
    // 只传递块定义内容，不传 block_id
    const serverData = this.convertClientModelToServerBlock(blockData);

    try {
      // 发送请求
      const serverResponse = await this.apiService.post<ServerBlockDefinition>('/api/task-blocks', serverData);

      // 转换响应
      const clientResponse = this.convertServerBlockToClientModel(serverResponse);

      // 添加到本地缓存
      if (this.isLoaded) {
        this.blockDefinitions.push(clientResponse);
      }

      return clientResponse;
    } catch (error) {
      console.error('添加任务块失败:', error);
      throw error;
    }
  }

  /**
   * 编辑任务块
   */
  async updateTaskBlock(blockId: string, blockData: Partial<BlockDefinition>): Promise<BlockDefinition> {
    // 转换为服务器格式
    const serverData = blockData as any; // 部分更新，类型简化处理

    try {
      // 发送请求
      const serverResponse = await this.apiService.put<ServerBlockDefinition>(`/api/task-blocks/${blockId}`, serverData);

      // 转换响应
      const clientResponse = this.convertServerBlockToClientModel(serverResponse);

      // 更新本地缓存
      if (this.isLoaded) {
        const index = this.blockDefinitions.findIndex(block => block.block_id === blockId);
        if (index !== -1) {
          this.blockDefinitions[index] = clientResponse;
        }
      }

      return clientResponse;
    } catch (error) {
      console.error('更新任务块失败:', error);
      throw error;
    }
  }

  /**
   * 删除任务块
   */
  async deleteTaskBlock(blockId: string): Promise<void> {
    try {
      await this.apiService.delete(`/api/task-blocks/${blockId}`);

      // 从本地缓存中删除
      if (this.isLoaded) {
        this.blockDefinitions = this.blockDefinitions.filter(block => block.block_id !== blockId);
      }
    } catch (error) {
      console.error('删除任务块失败:', error);
      throw error;
    }
  }

  async getBlockDefinitionById(blockId: string): Promise<BlockDefinition | undefined> {
    if (!this.isLoaded) {
      await this.loadBlockDefinitions();
    }

    return this.blockDefinitions.find(block => block.block_id === blockId);
  }

  /**
   * 获取特定类型的块定义
   */
  async getBlockDefinition(blockType: string): Promise<BlockDefinition | undefined> {
    if (!this.isLoaded) {
      await this.loadBlockDefinitions();
    }

    return this.blockDefinitions.find(block =>
      `${block.type}_${block.executor.name}` === blockType
    );
  }

  /**
   * 按执行器类型获取块定义
   */
  async getBlocksByExecutor(executor: string): Promise<BlockDefinition[]> {
    if (!this.isLoaded) {
      await this.loadBlockDefinitions();
    }

    return this.blockDefinitions.filter(block =>
      block.executor.name === executor
    );
  }

  /**
   * 按块类型获取块定义
   */
  async getBlocksByType(type: string): Promise<BlockDefinition[]> {
    if (!this.isLoaded) {
      await this.loadBlockDefinitions();
    }

    return this.blockDefinitions.filter(block => block.type === type);
  }

  /**
   * 清理服务资源
   */
  dispose() {
    this.blockDefinitions = [];
    this.isLoaded = false;
  }
}
