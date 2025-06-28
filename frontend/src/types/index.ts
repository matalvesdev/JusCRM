export interface User {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "LAWYER" | "ASSISTANT" | "CLIENT";
  avatar?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ClientProfile {
  id: string;
  userId: string;
  name: string;
  email: string;
  avatar?: string;
  type: "INDIVIDUAL" | "COMPANY";
  cpf?: string;
  rg?: string;
  cnpj?: string;
  birthDate?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  company?: string;
  position?: string;
  salary?: number;
  workStart?: string;
  workEnd?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  casesCount?: number;
  recentCases?: Case[];
  cases?: Case[];
}

export interface Case {
  id: string;
  number?: string;
  title: string;
  description?: string;
  type:
    | "RESCISAO_INDIRETA"
    | "HORAS_EXTRAS"
    | "ADICIONAL_INSALUBRIDADE"
    | "ADICIONAL_PERICULOSIDADE"
    | "ASSEDIO_MORAL"
    | "ACIDENTE_TRABALHO"
    | "EQUIPARACAO_SALARIAL"
    | "DEMISSAO_SEM_JUSTA_CAUSA"
    | "FGTS"
    | "SEGURO_DESEMPREGO"
    | "OTHER";
  status: "DRAFT" | "ACTIVE" | "SUSPENDED" | "CLOSED" | "ARCHIVED";
  value?: number;
  startDate: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
  clientId: string;
  client?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    type?: string;
    phone?: string;
    cpf?: string;
    cnpj?: string;
  };
  lawyerId: string;
  lawyer?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  assistantId?: string;
  assistant?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  counts?: {
    documents: number;
    appointments: number;
    activities: number;
    petitions: number;
    payments: number;
  };
  documents?: Document[];
  appointments?: Appointment[];
  activities?: Activity[];
  petitions?: Petition[];
  payments?: Payment[];
}

export interface Document {
  id: string;
  name: string;
  type:
    | "CONTRACT"
    | "PROCURATION"
    | "EVIDENCE"
    | "PETITION"
    | "DECISION"
    | "PROTOCOL"
    | "OTHER";
  filename: string;
  size: number;
  mimeType: string;
  url: string;
  createdAt: string;
  updatedAt: string;
  caseId?: string;
  case?: {
    id: string;
    title: string;
    number?: string;
    client: {
      id: string;
      name: string;
      email: string;
    };
  };
  uploadedById: string;
  uploadedBy?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
}

export interface Appointment {
  id: string;
  title: string;
  description?: string;
  type: "HEARING" | "MEETING" | "DEADLINE" | "CALL";
  status: "SCHEDULED" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "RESCHEDULED";
  startDate: string;
  endDate: string;
  meetingUrl?: string;
  meetingId?: string;
  createdAt: string;
  updatedAt: string;
  caseId?: string;
  case?: {
    id: string;
    title: string;
    number?: string;
    client: {
      id: string;
      name: string;
      email: string;
      avatar?: string;
    };
  };
  lawyerId: string;
  lawyer?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
}

export interface Activity {
  id: string;
  type:
    | "CASE_CREATED"
    | "CASE_UPDATED"
    | "DOCUMENT_UPLOADED"
    | "APPOINTMENT_SCHEDULED"
    | "PETITION_GENERATED"
    | "PAYMENT_RECEIVED"
    | "USER_LOGIN"
    | "OTHER";
  title: string;
  description?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  userId: string;
  user?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  caseId?: string;
  case?: {
    id: string;
    title: string;
    number?: string;
  };
}

export interface Petition {
  id: string;
  title: string;
  content: string;
  prompt?: string;
  status: "DRAFT" | "GENERATED" | "REVIEWED" | "FILED";
  createdAt: string;
  updatedAt: string;
  caseId: string;
  case?: Case;
}

export interface Payment {
  id: string;
  amount: number;
  type: "HONORARIUM" | "EXPENSE" | "REFUND";
  status: "PENDING" | "PAID" | "OVERDUE" | "CANCELLED";
  description?: string;
  dueDate: string;
  paidDate?: string;
  stripePaymentId?: string;
  createdAt: string;
  updatedAt: string;
  caseId: string;
  case?: Case;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role?: "ADMIN" | "LAWYER" | "ASSISTANT";
  phone?: string;
}

export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data?: T[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface DashboardStats {
  totalClients: number;
  activeCases: number;
  totalDocuments: number;
  upcomingAppointments: number;
  recentActivities: Activity[];
}

export interface CasesByStatusChart {
  status: string;
  count: number;
  label: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  isRead: boolean;
  metadata?: Record<string, unknown>;
  actionUrl?: string;
  userId: string;
  caseId?: string;
  documentId?: string;
  appointmentId?: string;
  createdAt: string;
  readAt?: string;
  case?: Case;
  document?: Document;
  appointment?: Appointment;
}

export type NotificationType =
  | "CASE_DEADLINE"
  | "APPOINTMENT_REMINDER"
  | "DOCUMENT_UPLOADED"
  | "CASE_UPDATE"
  | "PAYMENT_DUE"
  | "SYSTEM_ANNOUNCEMENT"
  | "NEW_MESSAGE";

export type NotificationPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface NotificationListResponse {
  data: Notification[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface UpcomingDeadline {
  id: string;
  title: string;
  type: string;
  startDate: string;
  caseId: string;
  caseTitle: string;
  clientName: string;
  daysUntil: number;
}
