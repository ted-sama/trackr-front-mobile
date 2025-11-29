export interface Publisher {
  id: number | string;
  name: string;
  dataSource: string;
  externalId: number;
  createdAt: Date;
  updatedAt: Date;
}