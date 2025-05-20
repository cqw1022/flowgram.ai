import { FlowNodeRegistry, FlowNodeJSON } from '../typings';
import { BlockDefinition } from '../typings/block';
import { JsonSchema } from '../typings/json-schema';
import { nanoid } from 'nanoid';
import iconLLM from '../assets/icon-llm.jpg';
import { FormMeta, ValidateTrigger, FormRenderProps } from '@flowgram.ai/free-layout-editor';
import React from 'react';

export class BlockRegistryAdapter {
  /**
   * 将块定义转换为节点注册表项
   */
  static blockToRegistry(block: BlockDefinition): FlowNodeRegistry {
    // 生成唯一类型标识
    const nodeType = `${block.type}_${block.executor.name}`;

    // 生成端口
    const ports: Record<string, any> = {};

    // 输入端口
    block.inputs_def.forEach(input => {
      ports[input.handle] = {
        group: 'in',
        tooltip: input.description || input.handle,
        optional: input.optional,
        type: input.type,
      };
    });

    // 输出端口
    block.outputs_def.forEach(output => {
      ports[output.handle] = {
        group: 'out',
        tooltip: output.description || output.handle,
        type: output.type,
      };
    });

    // 生成表单模式
    const formSchema: JsonSchema = {
      type: 'object',
      properties: {},
      required: [],
    };

    // 表单UI模式
    const uiSchema: any = {};

    // 添加输入字段到表单模式
    block.inputs_def.forEach(input => {
      if (formSchema.properties) {
        formSchema.properties[input.handle] = {
          type: this.mapTypeToJsonSchemaType(input.type || 'string'),
          title: input.handle,
          description: input.description,
        };
      }

      if (!input.optional && formSchema.required) {
        formSchema.required.push(input.handle);
      }

      // 设置UI样式
      uiSchema[input.handle] = {
        'ui:placeholder': `请输入${input.handle}`,
      };
    });

    // 简单的表单渲染函数
    const renderForm = (_props: FormRenderProps<FlowNodeJSON>) => {
      return React.createElement('div', null, '表单渲染器'); // 返回一个简单的div元素
    };

    const formMetaValue: FormMeta<FlowNodeJSON> = {
      validateTrigger: ValidateTrigger.onChange,
      validate: {},
      render: renderForm,
    };

    return {
      // 类型和标识
      type: nodeType,

      info: {
        icon: iconLLM,
        description:
          'Call the large language model and use variables and prompt words to generate responses.',
      },
      // 元数据
      meta: {
        title: block.name || block.type,
        description: block.description || `${block.type} using ${block.executor.name}`,
        category: block.category || this.getCategoryFromExecutor(block.executor.name),
        icon: block.icon || this.getIconFromExecutor(block.executor.name),
        color: block.color || this.getColorFromExecutor(block.executor.name),
        defaultExpanded: true,
      },

      // 表单元数据
      formMeta: formMetaValue,

      // 端口配置
      ports,

      // 提供创建节点的方法
      onAdd: () => {
        return this.createNodeFromBlock(block);
      },

      // 原始块定义（用于调试和高级功能）
      custom: {
        blockDefinition: block,
        executorType: block.executor.name,
      },
    };
  }

  /**
   * 批量转换块定义到节点注册表
   */
  static blocksToRegistries(blocks: BlockDefinition[]): FlowNodeRegistry[] {
    return blocks.map(block => this.blockToRegistry(block));
  }

  /**
   * 从块定义创建节点JSON
   */
  static createNodeFromBlock(block: BlockDefinition): FlowNodeJSON {
    // 创建输入和输出的JSON模式
    const inputs: JsonSchema = {
      type: 'object',
      properties: {},
    };

    const outputs: JsonSchema = {
      type: 'object',
      properties: {},
    };

    // 为每个输入定义添加属性
    const inputProperties = inputs.properties || {};
    block.inputs_def.forEach(input => {
      inputProperties[input.handle] = {
        type: this.mapTypeToJsonSchemaType(input.type || 'string'),
        title: input.handle,
        description: input.description,
      };
    });
    inputs.properties = inputProperties;

    // 为每个输出定义添加属性
    const outputProperties = outputs.properties || {};
    block.outputs_def.forEach(output => {
      outputProperties[output.handle] = {
        type: this.mapTypeToJsonSchemaType(output.type || 'string'),
        title: output.handle,
        description: output.description,
      };
    });
    outputs.properties = outputProperties;

    // 创建节点JSON
    return {
      id: `${block.type}_${nanoid(5)}`,
      type: `${block.type}_${block.executor.name}`,
      data: {
        title: block.name || block.type,
        inputs,
        outputs,
        inputsValues: {},
      },
    };
  }

  /**
   * 根据执行器类型获取分类
   */
  private static getCategoryFromExecutor(executor: string): string {
    const categoryMap: Record<string, string> = {
      'rust': '系统任务',
      'python': 'Python 任务',
      'nodejs': 'JavaScript 任务',
      'shell': '命令行任务',
    };

    return categoryMap[executor] || '其他任务';
  }

  /**
   * 根据执行器类型获取图标
   */
  private static getIconFromExecutor(executor: string): string {
    const iconMap: Record<string, string> = {
      'rust': 'icon-rust',
      'python': 'icon-python',
      'nodejs': 'icon-nodejs',
      'shell': 'icon-shell',
    };

    return iconMap[executor] || 'icon-default';
  }

  /**
   * 根据执行器类型获取颜色
   */
  private static getColorFromExecutor(executor: string): string {
    const colorMap: Record<string, string> = {
      'rust': '#DEA584',
      'python': '#3572A5',
      'nodejs': '#68A063',
      'shell': '#89E051',
    };

    return colorMap[executor] || '#607D8B';
  }

  /**
   * 将块类型映射到 JSON Schema 类型
   */
  private static mapTypeToJsonSchemaType(blockType: string): 'string' | 'number' | 'boolean' | 'object' | 'array' | 'integer' {
    const typeMap: Record<string, any> = {
      'string': 'string',
      'number': 'number',
      'boolean': 'boolean',
      'object': 'object',
      'array': 'array',
      'integer': 'integer',
    };

    return typeMap[blockType] || 'string';
  }
}
