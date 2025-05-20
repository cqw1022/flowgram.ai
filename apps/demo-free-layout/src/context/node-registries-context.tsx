import React, { createContext, useContext } from 'react';
import { FlowNodeRegistry } from '../typings';

// Context 可以是 FlowNodeRegistry[] 或 undefined
const NodeRegistriesContext = createContext<FlowNodeRegistry[] | undefined>(undefined);

interface NodeRegistriesProviderProps {
  children: React.ReactNode;
  value: FlowNodeRegistry[] | undefined;
}

export const NodeRegistriesProvider = ({ children, value }: NodeRegistriesProviderProps) => {
  return (
    <NodeRegistriesContext.Provider value={value}>
      {children}
    </NodeRegistriesContext.Provider>
  );
};

// hook 可以返回 FlowNodeRegistry[] 或 undefined
export const useNodeRegistries = () => {
  const context = useContext(NodeRegistriesContext);
  return context; // 允许返回 undefined
};
