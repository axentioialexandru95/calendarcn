export type ExternalStore<T> = {
  clear: () => void
  getSnapshot: () => T
  setSnapshot: (snapshot: T) => void
  subscribe: (listener: () => void) => () => void
}

export function createExternalStore<T>(
  initialSnapshot: T,
  options?: {
    frameThrottle?: boolean
  }
): ExternalStore<T> {
  let snapshot = initialSnapshot
  let queuedSnapshot = initialSnapshot
  let frameId: number | null = null
  const listeners = new Set<() => void>()
  const frameThrottle = options?.frameThrottle ?? false

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

      if (snapshot !== initialSnapshot) {
        snapshot = initialSnapshot
        emit()
      }
    },
    getSnapshot() {
      return snapshot
    },
    setSnapshot(nextSnapshot) {
      if (!frameThrottle) {
        if (snapshot === nextSnapshot) {
          return
        }

        snapshot = nextSnapshot
        emit()
        return
      }

      queuedSnapshot = nextSnapshot

      if (frameId != null) {
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
