import { SnapPoint } from "../types";

export function validateSnapPointGuard(value: unknown): value is SnapPoint {

      if (typeof value === 'number') {
        return !Number.isNaN(value);
      }
    
      if (typeof value === 'string') {
        // Regex breakdown:
        // ^[+-]?        -> Optional positive or negative sign
        // (\d+(\.\d*)?  -> Digits with optional decimals (e.g., "10", "10.5", "10.")
        // |\.\d+)       -> OR a decimal starting with a dot (e.g., ".5")
        // px$           -> Ends exactly with "px"
        const pxPattern = /^[+-]?(\d+(\.\d*)?|\.\d+)px$/;
        
        return pxPattern.test(value);
      }
    
      return false;
}
