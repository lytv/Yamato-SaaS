/**
 * Simple connection pool manager to prevent too many simultaneous connections
 * Temporary solution until proper connection pooling is implemented
 */

class ConnectionManager {
  private activeConnections = 0;
  private maxConnections = 5; // Conservative limit
  private queue: (() => void)[] = [];

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    // If we're at the limit, wait in queue
    if (this.activeConnections >= this.maxConnections) {
      await new Promise<void>((resolve) => {
        this.queue.push(resolve);
      });
    }

    this.activeConnections++;

    try {
      const result = await operation();
      return result;
    } finally {
      this.activeConnections--;
      // Process next item in queue
      const next = this.queue.shift();
      if (next) {
        next();
      }
    }
  }

  getStats() {
    return {
      active: this.activeConnections,
      queued: this.queue.length,
      maxConnections: this.maxConnections,
    };
  }
}

// Global instance
export const connectionManager = new ConnectionManager();