import { injectable } from '@flowgram.ai/free-layout-editor';

@injectable()
export class ApiService {
  // API基础URL，可根据环境配置
  private baseUrl = 'http://localhost:8080';

  constructor() {
  }

  /**
   * 获取API基础URL
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }

  /**
   * 设置API基础URL
   */
  setBaseUrl(url: string): void {
    this.baseUrl = url;
  }

  /**
   * 发送GET请求
   */
  async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`);

    if (!response.ok) {
      throw new Error(`API请求失败: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * 发送POST请求
   */
  async post<T>(endpoint: string, data?: any): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: data ? JSON.stringify(data) : undefined
    });

    if (!response.ok) {
      throw new Error(`API请求失败: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * 发送PUT请求
   */
  async put<T>(endpoint: string, data: any): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`API请求失败: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * 发送DELETE请求
   */
  async delete(endpoint: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error(`API请求失败: ${response.statusText}`);
    }
  }
}
