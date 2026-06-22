import { ValidationResult } from '../shared/types';

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
}
