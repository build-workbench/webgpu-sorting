import { ValidationResult } from '../types';

/**
 * Validates sorting results for correctness
 */
export class Validator {
  /**
   * Check if an array is sorted in ascending order
   * Returns true if every element is <= its successor
   */
  static isSorted(arr: Uint32Array): boolean {
    if (arr.length <= 1) {
      return true;
    }
    
    for (let i = 0; i < arr.length - 1; i++) {
      if (arr[i] > arr[i + 1]) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Check if two arrays contain the same elements with the same frequencies
   * (identical multisets)
   */
  static hasSameElements(a: Uint32Array, b: Uint32Array): boolean {
    if (a.length !== b.length) {
      return false;
    }
    
    if (a.length === 0) {
      return true;
    }

    // Count frequencies using a Map
    const countA = new Map<number, number>();
    const countB = new Map<number, number>();
    
    for (let i = 0; i < a.length; i++) {
      countA.set(a[i], (countA.get(a[i]) ?? 0) + 1);
      countB.set(b[i], (countB.get(b[i]) ?? 0) + 1);
    }
    
    // Compare counts
    if (countA.size !== countB.size) {
      return false;
    }
    
    for (const [key, count] of countA) {
      if (countB.get(key) !== count) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Perform complete validation of sorting result
   */
  static validate(input: Uint32Array, output: Uint32Array): ValidationResult {
    const errors: string[] = [];
    
    const sorted = Validator.isSorted(output);
    if (!sorted) {
      errors.push('Output array is not sorted in ascending order');
    }
    
    const sameElements = Validator.hasSameElements(input, output);
    if (!sameElements) {
      errors.push('Output array does not contain the same elements as input');
    }
    
    return {
      isValid: sorted && sameElements,
      isSorted: sorted,
      hasAllElements: sameElements,
      errors,
    };
  }

  /**
   * Compare GPU result against JavaScript native sort
   */
  static compareWithNativeSort(input: Uint32Array, gpuOutput: Uint32Array): ValidationResult {
    // Create a copy and sort with native JS
    const nativeSorted = new Uint32Array(input);
    nativeSorted.sort();
    
    const errors: string[] = [];
    
    // Check if GPU output matches native sort
    let matches = true;
    if (gpuOutput.length !== nativeSorted.length) {
      matches = false;
      errors.push(`Length mismatch: GPU=${gpuOutput.length}, Native=${nativeSorted.length}`);
    } else {
      for (let i = 0; i < gpuOutput.length; i++) {
        if (gpuOutput[i] !== nativeSorted[i]) {
          matches = false;
          errors.push(`Mismatch at index ${i}: GPU=${gpuOutput[i]}, Native=${nativeSorted[i]}`);
          // Only report first few mismatches
          if (errors.length >= 5) {
            errors.push('... (more mismatches not shown)');
            break;
          }
        }
      }
    }
    
    return {
      isValid: matches,
      isSorted: Validator.isSorted(gpuOutput),
      hasAllElements: Validator.hasSameElements(input, gpuOutput),
      errors,
    };
  }
}
