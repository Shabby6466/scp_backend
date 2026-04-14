/**
 * Stand-in until audit persistence lives in Nest; mirrors AuditEventsController.list.
 */
export type AuditEventsServiceFunctions = {
  list(params?: {
    type?: string;
    limit?: string;
    action?: string;
    userId?: string;
    offset?: string;
  }): Promise<{
    data: unknown[];
    meta: { total: number; page: number; lastPage: number; limit: number };
  }>;
};

export function createAuditEventsServiceFunctions(): AuditEventsServiceFunctions {
  return {
    async list(params) {
      const n = Math.min(
        Math.max(parseInt(params?.limit || '20', 10) || 20, 1),
        500,
      );
      return {
        data: [],
        meta: { total: 0, page: 1, lastPage: 0, limit: n },
      };
    },
  };
}
