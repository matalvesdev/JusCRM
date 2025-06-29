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

// Novos tipos para widgets do dashboard
export interface CasesTimelineData {
  period: string;
  total: number;
  active: number;
  closed: number;
}

export interface TopClient {
  clientId: string;
  clientName: string;
  clientEmail: string;
  totalCases: number;
  activeCases: number;
  closedCases: number;
  lastCaseDate: string;
}

export interface UpcomingDeadlineData {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  daysUntilDue: number;
  priority: string;
  type: string;
  caseId: string;
  caseTitle: string;
  clientName: string;
}

export interface RecentActivity {
  id: string;
  type: string;
  action: string;
  title: string;
  description: string;
  entityType: string;
  entityId: string;
  entityName: string;
  userId: string;
  userName: string;
  createdAt: string;
  metadata?: any;
}

export interface AuditStats {
  totalActions: number;
  loginCount: number;
  createCount: number;
  updateCount: number;
  deleteCount: number;
  actionsByDay: Array<{
    date: string;
    count: number;
  }>;
  topActions: Array<{
    action: string;
    count: number;
  }>;
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

export interface SearchSuggestion {
  id: string;
  text: string;
  type: "client" | "case" | "document" | "appointment";
  subtitle?: string;
  url: string;
}

export interface GlobalSearchResponse {
  results: {
    clients: ClientProfile[];
    cases: Case[];
    documents: Document[];
    appointments: Appointment[];
  };
  meta: {
    total: number;
    query: string;
    type: string;
    executionTime: number;
    page: number;
    limit: number;
  };
}

export interface SearchSuggestionsResponse {
  suggestions: SearchSuggestion[];
}

// === RELATÓRIOS ===

export type ReportType =
  | "CASES_BY_PERIOD"
  | "CASES_BY_STATUS"
  | "CASES_BY_CLIENT"
  | "CLIENT_ACTIVITY"
  | "PRODUCTIVITY"
  | "FINANCIAL"
  | "CUSTOM";

export type ReportFormat = "PDF" | "EXCEL" | "CSV" | "JSON";

export type ReportStatus = "PENDING" | "GENERATING" | "COMPLETED" | "FAILED";

export interface Report {
  id: string;
  title: string;
  description?: string;
  type: ReportType;
  format: ReportFormat;
  status: ReportStatus;
  parameters?: Record<string, unknown>;
  startDate?: string;
  endDate?: string;
  fileName?: string;
  fileUrl?: string;
  fileSize?: number;
  expiresAt?: string;
  recordsCount?: number;
  generatedAt?: string;
  completedAt?: string;
  downloadCount: number;
  generatedById: string;
  generatedBy?: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateReportRequest {
  type: ReportType;
  title: string;
  description?: string;
  format: ReportFormat;
  parameters?: Record<string, unknown>;
  startDate?: string;
  endDate?: string;
}

export interface ReportListResponse {
  data: Report[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ReportStats {
  totalReports: number;
  completedReports: number;
  pendingReports: number;
  failedReports: number;
  byType: Array<{
    type: ReportType;
    count: number;
  }>;
}

// === TEMPLATES ===

export type TemplateType =
  | "PETITION"
  | "CONTRACT"
  | "LETTER"
  | "PROCURATION"
  | "MOTION"
  | "APPEAL"
  | "AGREEMENT"
  | "EMAIL"
  | "NOTIFICATION"
  | "OTHER";

export type TemplateCategory =
  | "LABOR_LAW"
  | "CIVIL_LAW"
  | "CORPORATE_LAW"
  | "FAMILY_LAW"
  | "CRIMINAL_LAW"
  | "ADMINISTRATIVE"
  | "GENERAL";

export interface TemplateVariable {
  name: string;
  label: string;
  type: "text" | "date" | "number" | "boolean" | "select";
  required: boolean;
  defaultValue?: string;
  options?: string[]; // Para type: select
}

export interface Template {
  id: string;
  name: string;
  description?: string;
  type: TemplateType;
  category: TemplateCategory;
  content: string;
  variables?: TemplateVariable[];
  isActive: boolean;
  isPublic: boolean;
  version: number;
  usageCount: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
}

export interface CreateTemplateRequest {
  name: string;
  description?: string;
  type: TemplateType;
  category: TemplateCategory;
  content: string;
  variables?: TemplateVariable[];
  isPublic?: boolean;
  tags?: string[];
}

export interface TemplateListResponse {
  templates: Template[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface TemplateStats {
  total: number;
  byType: Array<{
    type: TemplateType;
    count: number;
  }>;
  byCategory: Array<{
    category: TemplateCategory;
    count: number;
  }>;
  mostUsed: Array<{
    id: string;
    name: string;
    usageCount: number;
  }>;
  recentlyCreated: Array<{
    id: string;
    name: string;
    createdAt: string;
  }>;
}

export interface GenerateDocumentRequest {
  templateId: string;
  variableValues: Record<string, string | number | boolean>;
  documentName: string;
  caseId?: string;
}
