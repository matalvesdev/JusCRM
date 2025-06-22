export interface User {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "LAWYER" | "ASSISTANT";
  phone?: string;
  avatar?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  cpf?: string;
  cnpj?: string;
  type: "INDIVIDUAL" | "COMPANY";
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  responsibleLawyerId?: string;
  responsibleLawyer?: User;
}

export interface Case {
  id: string;
  number: string;
  title: string;
  description?: string;
  status: "ACTIVE" | "INACTIVE" | "CLOSED" | "SUSPENDED";
  type: "LABOR" | "CIVIL" | "CRIMINAL" | "FAMILY" | "OTHER";
  court?: string;
  opposingParty?: string;
  value?: number;
  createdAt: string;
  updatedAt: string;
  clientId: string;
  client?: Client;
  responsibleLawyerId: string;
  responsibleLawyer?: User;
}

export interface Document {
  id: string;
  name: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  description?: string;
  uploadedAt: string;
  caseId?: string;
  case?: Case;
  clientId?: string;
  client?: Client;
  uploadedById: string;
  uploadedBy?: User;
}

export interface Petition {
  id: string;
  title: string;
  description?: string;
  status: "DRAFT" | "REVIEW" | "SENT" | "APPROVED" | "REJECTED";
  deadline?: string;
  sentAt?: string;
  createdAt: string;
  updatedAt: string;
  caseId: string;
  case?: Case;
  createdById: string;
  createdBy?: User;
}

export interface Appointment {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  location?: string;
  type: "HEARING" | "MEETING" | "DEADLINE" | "OTHER";
  status: "SCHEDULED" | "CONFIRMED" | "COMPLETED" | "CANCELLED";
  createdAt: string;
  updatedAt: string;
  caseId?: string;
  case?: Case;
  clientId?: string;
  client?: Client;
  createdById: string;
  createdBy?: User;
}

export interface Payment {
  id: string;
  amount: number;
  description?: string;
  status: "PENDING" | "PAID" | "OVERDUE" | "CANCELLED";
  type: "FEE" | "EXPENSE" | "REIMBURSEMENT";
  dueDate: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
  caseId?: string;
  case?: Case;
  clientId?: string;
  client?: Client;
  createdById: string;
  createdBy?: User;
}

export interface Activity {
  id: string;
  title: string;
  description?: string;
  type: "CALL" | "EMAIL" | "MEETING" | "DOCUMENT" | "TASK" | "OTHER";
  status: "PENDING" | "COMPLETED" | "CANCELLED";
  dueDate?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  caseId?: string;
  case?: Case;
  clientId?: string;
  client?: Client;
  assignedToId?: string;
  assignedTo?: User;
  createdById: string;
  createdBy?: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
