import { createContext, useContext } from "react";

const BlockIdContext = createContext<string>("");

export function useBlockId(): string {
  return useContext(BlockIdContext);
}

export default BlockIdContext;
