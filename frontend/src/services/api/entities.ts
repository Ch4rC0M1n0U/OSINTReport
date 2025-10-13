import { api } from "../http";

export type EntityType =
  | "PERSON"
  | "ORGANIZATION"
  | "TELEPHONE"
  | "EMAIL"
  | "ACCOUNT"
  | "ADDRESS"
  | "OTHER";

export interface Entity {
  id: string;
  label: string;
  type: EntityType;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    modules: number;
    researchRecords: number;
  };
}

export interface CreateEntityData {
  label: string;
  type: EntityType;
  notes?: string;
}

export interface EntitySearchResult {
  id: string;
  label: string;
  type: EntityType;
}

export const entitiesApi = {
  async list(params?: {
    limit?: number;
    offset?: number;
    type?: EntityType;
    search?: string;
  }) {
    const response = await api.get<{
      entities: Entity[];
      total: number;
      limit: number;
      offset: number;
    }>("/entities", { params });
    return {
      items: response.data.entities,
      total: response.data.total,
      limit: response.data.limit,
      offset: response.data.offset,
    };
  },

  async search(query: string, type?: EntityType, limit = 10) {
    const response = await api.get<{ entities: EntitySearchResult[] }>(
      "/entities/search",
      {
        params: { q: query, type, limit },
      }
    );
    return response.data.entities;
  },

  async getById(id: string) {
    const response = await api.get<{ entity: Entity }>(`/entities/${id}`);
    return response.data.entity;
  },

  async create(data: CreateEntityData) {
    const response = await api.post<{ entity: Entity }>("/entities", data);
    return response.data.entity;
  },

  async update(id: string, data: Partial<CreateEntityData>) {
    const response = await api.patch<{ entity: Entity }>(`/entities/${id}`, data);
    return response.data.entity;
  },

  async delete(id: string) {
    await api.delete(`/entities/${id}`);
  },
};
