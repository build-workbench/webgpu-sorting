## MODIFIED Requirements

### Requirement: GPU Buffer Management

The BufferManager SHALL provide bounded readback behavior and deterministic staging-buffer cleanup for every buffer read operation.

#### Scenario: Successful readback releases staging buffer

- **WHEN** `readBuffer()` completes successfully
- **THEN** it SHALL unmap the staging buffer, release it, and return a `Uint32Array` containing the requested byte range

#### Scenario: Timed-out readback surfaces explicit failure

- **WHEN** staging-buffer mapping exceeds the configured timeout
- **THEN** `readBuffer()` SHALL reject with `GPUTimeoutError` and release the staging buffer before returning control to the caller

#### Scenario: Readback failure still cleans up

- **WHEN** staging-buffer mapping or copy fails for any other reason
- **THEN** `readBuffer()` SHALL release the staging buffer and surface a typed buffer readback error

### Requirement: Resource Lifecycle

Sorter implementations SHALL release temporary GPU resources through a dedicated per-sort ownership seam while preserving explicitly preallocated buffers until callers clear or destroy them.

#### Scenario: Temporary buffers are cleaned up on success

- **WHEN** a sorter completes a sort using temporary buffers
- **THEN** all temporary buffers created for that sort SHALL be released before the sorter returns

#### Scenario: Temporary buffers are cleaned up on failure

- **WHEN** a sorter throws after allocating temporary buffers
- **THEN** the per-sort ownership seam SHALL still release those buffers before the error is propagated

#### Scenario: Preallocated buffers remain opt-in

- **WHEN** a caller uses `preallocate()` and later sorts data within that capacity
- **THEN** the sorter SHALL reuse preallocated buffers without releasing them until `clearPreallocation()` or `destroy()` is called
