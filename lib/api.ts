const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message ?? 'Request failed');
  }
  return res.json();
}

// Auth
export const authApi = {
  register: (email: string, password: string) =>
    request<{ token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  login: (email: string, password: string) =>
    request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  me: () => request<User>('/auth/me'),
};

// Components
export const componentsApi = {
  getAll: () => request<Component[]>('/components'),
  getByType: (type: string) => request<Component[]>(`/components/${type}`),
};

// Builds
export const buildsApi = {
  getAll: () => request<Build[]>('/builds'),
  getOne: (id: string) => request<Build>(`/builds/${id}`),
  getSummary: (id: string) => request<BuildSummary>(`/builds/${id}/summary`),
  create: (name: string, componentIds: string[]) =>
    request<Build>('/builds', { method: 'POST', body: JSON.stringify({ name, componentIds }) }),
  update: (id: string, data: Partial<{ name: string; isFavorite: boolean; componentIds: string[] }>) =>
    request<Build>(`/builds/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) => request<{ message: string }>(`/builds/${id}`, { method: 'DELETE' }),
};

// Types
export interface User {
  id: string;
  email: string;
  createdAt?: string;
}

export interface Component {
  id: string;
  name: string;
  type: string;
  brand: string;
  price: number;
  specs: Record<string, any>;
}

export interface Build {
  id: string;
  name: string;
  userId: string;
  isFavorite: boolean;
  totalPrice: number;
  components: Component[];
  createdAt: string;
  updatedAt: string;
}

export interface BuildSummary {
  id: string;
  name: string;
  isFavorite: boolean;
  totalPrice: number;
  componentCount: number;
  components: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export const COMPONENT_TYPES = ['cpu', 'gpu', 'ram', 'motherboard', 'storage', 'case', 'cooling', 'psu'] as const;
export type ComponentType = typeof COMPONENT_TYPES[number];

export const TYPE_LABELS: Record<string, string> = {
  cpu: 'CPU',
  gpu: 'GPU',
  ram: 'RAM',
  motherboard: 'Motherboard',
  storage: 'Storage',
  case: 'Case',
  cooling: 'Cooling',
  psu: 'Power Supply',
};
