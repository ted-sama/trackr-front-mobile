export interface ActivityLogResource {
  type: 'book' | 'list';
  item: {
    id: number;
    title: string;
  };
}

export interface ActivityLog {
  id: number;
  userId: string;
  action: string;
  metadata: Record<string, any>;
  resource: ActivityLogResource;
  createdAt: string;
}