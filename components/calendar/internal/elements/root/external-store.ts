export type ExternalStore<T> = {
  clear: () => void
  getSnapshot: () => T
  setSnapshot: (snapshot: T) => void
  subscribe: (listener: () => void) => () => void
}

type CreateExternalStoreOptions<T> = {
  frameThrottle?: boolean
  isEqual?: (left: T, right: T) => boolean
}

export function createExternalStore<T>(
  initialSnapshot: T,
  options?: CreateExternalStoreOptions<T>
): ExternalStore<T> {
  let snapshot = initialSnapshot
  let queuedSnapshot = initialSnapshot
  let frameId: number | null = null
  const listeners = new Set<() => void>()
  const frameThrottle = options?.frameThrottle ?? false
  const isEqual = options?.isEqual ?? Object.is

  function emit() {
    for (const listener of listeners) {
      listener()
    }
  }

  function flush() {
    frameId = null
    snapshot = queuedSnapshot
    emit()
  }

  return {
    clear() {
      queuedSnapshot = initialSnapshot

      if (frameThrottle && frameId != null) {
        cancelAnimationFrame(frameId)
        frameId = null
      }

      if (!isEqual(snapshot, initialSnapshot)) {
        snapshot = initialSnapshot
        emit()
      }
    },
    getSnapshot() {
      return snapshot
    },
    setSnapshot(nextSnapshot) {
      if (!frameThrottle) {
        if (isEqual(snapshot, nextSnapshot)) {
          return
        }

        snapshot = nextSnapshot
        emit()
        return
      }

      queuedSnapshot = nextSnapshot

      if (frameId != null || isEqual(snapshot, queuedSnapshot)) {
        return
      }

      frameId = requestAnimationFrame(flush)
    },
    subscribe(listener) {
      listeners.add(listener)

      return () => {
        listeners.delete(listener)
      }
    },
  }
}
