import { describe, expect, it, vi } from 'vitest';
import { BufferScope } from '../../src/core/BufferScope';

function createBufferMock(): GPUBuffer {
  return {
    destroy: vi.fn(),
  } as unknown as GPUBuffer;
}

describe('BufferScope', () => {
  it('releases tracked buffers once', () => {
    const scope = new BufferScope();
    const first = createBufferMock();
    const second = createBufferMock();

    expect(scope.track(first)).toBe(first);
    scope.track(second);

    scope.releaseAll();
    scope.releaseAll();

    expect(first.destroy).toHaveBeenCalledTimes(1);
    expect(second.destroy).toHaveBeenCalledTimes(1);
  });

  it('does not release untracked buffers', () => {
    const scope = new BufferScope();
    const buffer = createBufferMock();

    scope.track(buffer);
    scope.untrack(buffer);
    scope.releaseAll();

    expect(buffer.destroy).not.toHaveBeenCalled();
  });

  it('uses a custom releaser when provided', () => {
    const scope = new BufferScope();
    const buffer = createBufferMock();
    const release = vi.fn();

    scope.track(buffer, release);
    scope.releaseAll();

    expect(release).toHaveBeenCalledWith(buffer);
    expect(buffer.destroy).not.toHaveBeenCalled();
  });
});
