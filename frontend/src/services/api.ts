import axios from "axios";
import type { AxiosInstance, AxiosResponse } from "axios";
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  ApiResponse,
  User,
  DashboardStats,
  CasesByStatusChart,
  UpcomingDeadline,
  ClientProfile,
  Case,
  Document,
  Appointment,
  Activity,
  PaginatedResponse,
  Notification,
  NotificationListResponse,
} from "@/types";

class ApiService {
  private api: AxiosInstance;
  constructor() {
    this.api = axios.create({
      baseURL: import.meta.env.VITE_API_URL || "http://localhost:3333/api",
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 10000, // 10 segundos de timeout
    });

    console.log(
      "[API] Configurando cliente axios com baseURL:",
      import.meta.env.VITE_API_URL || "http://localhost:3333/api"
    );

    // Interceptor para adicionar token de autenticação
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem("auth_token");
        console.log("[API] Request interceptor - Token encontrado:", !!token);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        console.log(
          "[API] Fazendo requisição para:",
          config.url,
          "com método:",
          config.method
        );
        return config;
      },
      (error) => {
        console.error("[API] Erro no request interceptor:", error);
        return Promise.reject(error);
      }
    );

    // Interceptor para lidar com respostas
    this.api.interceptors.response.use(
      (response: AxiosResponse) => {
        console.log("[API] Resposta recebida:", response.status, response.data);
        return response;
      },
      (error) => {
        console.error(
          "[API] Erro na resposta:",
          error.response?.status,
          error.response?.data || error.message
        );

        if (error.response?.status === 401) {
          console.log(
            "[API] Token inválido ou expirado (401). Limpando localStorage..."
          );
          localStorage.removeItem("auth_token");
        }

        // Log detalhado do erro para debug
        if (error.response) {
          console.error("[API] Erro da resposta do servidor:", {
            status: error.response.status,
            data: error.response.data,
            url: error.config?.url,
            method: error.config?.method,
          });
        } else if (error.request) {
          console.error(
            "[API] Erro de rede - sem resposta do servidor:",
            error.request
          );
        } else {
          console.error(
            "[API] Erro na configuração da requisição:",
            error.message
          );
        }

        return Promise.reject(error);
      }
    );
  }

  // Métodos de autenticação
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    console.log("[API] Tentando fazer login com:", credentials.email);
    const response = await this.api.post<
      LoginResponse | ApiResponse<LoginResponse>
    >("/auth/login", credentials);

    // Verifica se a resposta tem a estrutura { data: ... } ou é direta
    const data = "data" in response.data ? response.data.data : response.data;
    console.log("[API] Resposta do login:", data);
    return data as LoginResponse;
  }

  async logout(): Promise<void> {
    console.log("[API] Fazendo logout...");
    try {
      await this.api.post("/auth/logout");
    } catch (error) {
      console.warn("[API] Erro no logout (será ignorado):", error);
    }
    localStorage.removeItem("auth_token");
  }

  async me(): Promise<User> {
    console.log("[API] Verificando dados do usuário atual...");
    const response = await this.api.get<User | ApiResponse<User>>("/auth/me");

    // Verifica se a resposta tem a estrutura { data: ... } ou é direta
    const data = "data" in response.data ? response.data.data : response.data;
    console.log("[API] Dados do usuário recebidos:", data);
    return data as User;
  }

  async register(userData: RegisterRequest): Promise<LoginResponse> {
    console.log("[API] Tentando fazer registro com:", userData.email);
    const response = await this.api.post<
      LoginResponse | ApiResponse<LoginResponse>
    >("/auth/register", userData);

    // Verifica se a resposta tem a estrutura { data: ... } ou é direta
    const data = "data" in response.data ? response.data.data : response.data;
    console.log("[API] Resposta do registro:", data);
    return data as LoginResponse;
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    console.log("[API] Solicitando recuperação de senha para:", email);
    const response = await this.api.post<{ message: string }>(
      "/auth/forgot-password",
      { email }
    );
    console.log("[API] Resposta da recuperação de senha:", response.data);
    return response.data;
  }

  async resetPassword(
    token: string,
    password: string
  ): Promise<{ message: string }> {
    console.log("[API] Redefinindo senha com token");
    const response = await this.api.post<{ message: string }>(
      "/auth/reset-password",
      {
        token,
        password,
      }
    );
    console.log("[API] Resposta da redefinição de senha:", response.data);
    return response.data;
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    console.log("[API] Verificando email com token");
    const response = await this.api.post<{ message: string }>(
      "/auth/verify-email",
      { token }
    );
    console.log("[API] Resposta da verificação de email:", response.data);
    return response.data;
  }

  async resendVerification(email: string): Promise<{ message: string }> {
    console.log("[API] Reenviando verificação de email para:", email);
    const response = await this.api.post<{ message: string }>(
      "/auth/resend-verification",
      { email }
    );
    console.log("[API] Resposta do reenvio de verificação:", response.data);
    return response.data;
  }

  // Métodos genéricos para CRUD
  async get<T>(endpoint: string): Promise<T> {
    console.log("[API] GET request para:", endpoint);
    const response = await this.api.get<T | ApiResponse<T>>(endpoint);

    // Verifica se a resposta tem a estrutura { data: ... } ou é direta
    const data =
      response.data &&
      typeof response.data === "object" &&
      "data" in response.data
        ? (response.data as ApiResponse<T>).data
        : response.data;

    return data as T;
  }

  async post<T>(endpoint: string, data: unknown): Promise<T> {
    console.log("[API] POST request para:", endpoint, "com dados:", data);
    const response = await this.api.post<T | ApiResponse<T>>(endpoint, data);

    // Verifica se a resposta tem a estrutura { data: ... } ou é direta
    const responseData =
      response.data &&
      typeof response.data === "object" &&
      "data" in response.data
        ? (response.data as ApiResponse<T>).data
        : response.data;

    return responseData as T;
  }

  async put<T>(endpoint: string, data: unknown): Promise<T> {
    console.log("[API] PUT request para:", endpoint, "com dados:", data);
    const response = await this.api.put<T | ApiResponse<T>>(endpoint, data);

    // Verifica se a resposta tem a estrutura { data: ... } ou é direta
    const responseData =
      response.data &&
      typeof response.data === "object" &&
      "data" in response.data
        ? (response.data as ApiResponse<T>).data
        : response.data;

    return responseData as T;
  }

  async delete<T>(endpoint: string): Promise<T> {
    console.log("[API] DELETE request para:", endpoint);
    const response = await this.api.delete<T | ApiResponse<T>>(endpoint);

    // Verifica se a resposta tem a estrutura { data: ... } ou é direta
    const responseData =
      response.data &&
      typeof response.data === "object" &&
      "data" in response.data
        ? (response.data as ApiResponse<T>).data
        : response.data;

    return responseData as T;
  }

  // ============ CLIENTES ============

  // Listar clientes com filtros
  async getClients(
    params: {
      search?: string;
      type?: "INDIVIDUAL" | "COMPANY";
      city?: string;
      state?: string;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<PaginatedResponse<ClientProfile>> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });

    return this.get<PaginatedResponse<ClientProfile>>(
      `/clients?${queryParams.toString()}`
    );
  }

  // Buscar cliente por ID
  async getClient(id: string): Promise<ClientProfile> {
    return this.get<ClientProfile>(`/clients/${id}`);
  }

  // Criar novo cliente
  async createClient(clientData: {
    name: string;
    email: string;
    type?: "INDIVIDUAL" | "COMPANY";
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
  }): Promise<ApiResponse<{ client: ClientProfile }>> {
    return this.post<ApiResponse<{ client: ClientProfile }>>(
      "/clients",
      clientData
    );
  }

  // Atualizar cliente
  async updateClient(
    id: string,
    clientData: Partial<ClientProfile>
  ): Promise<ApiResponse<{ client: ClientProfile }>> {
    return this.put<ApiResponse<{ client: ClientProfile }>>(
      `/clients/${id}`,
      clientData
    );
  }

  // Desativar cliente
  async deleteClient(id: string): Promise<ApiResponse<void>> {
    return this.delete<ApiResponse<void>>(`/clients/${id}`);
  }

  // Histórico do cliente
  async getClientHistory(
    id: string,
    params: { page?: number; limit?: number } = {}
  ): Promise<PaginatedResponse<Activity>> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });

    return this.get<PaginatedResponse<Activity>>(
      `/clients/${id}/history?${queryParams.toString()}`
    );
  }

  // ============ CASOS ============

  // Listar casos com filtros
  async getCases(
    params: {
      search?: string;
      status?: "DRAFT" | "ACTIVE" | "SUSPENDED" | "CLOSED" | "ARCHIVED";
      type?: string;
      clientId?: string;
      lawyerId?: string;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<PaginatedResponse<Case>> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });

    return this.get<PaginatedResponse<Case>>(
      `/cases?${queryParams.toString()}`
    );
  }

  // Buscar caso por ID
  async getCase(id: string): Promise<Case> {
    return this.get<Case>(`/cases/${id}`);
  }

  // Criar novo caso
  async createCase(caseData: {
    title: string;
    description?: string;
    type: string;
    clientId: string;
    assistantId?: string;
    value?: number;
    number?: string;
  }): Promise<ApiResponse<{ case: Case }>> {
    return this.post<ApiResponse<{ case: Case }>>("/cases", caseData);
  }

  // Atualizar caso
  async updateCase(
    id: string,
    caseData: Partial<Case>
  ): Promise<ApiResponse<{ case: Case }>> {
    return this.put<ApiResponse<{ case: Case }>>(`/cases/${id}`, caseData);
  }

  // Atualizar status do caso
  async updateCaseStatus(
    id: string,
    status: string
  ): Promise<ApiResponse<{ case: Case }>> {
    return this.api
      .patch(`/cases/${id}/status`, { status })
      .then((res) => res.data);
  }

  // Arquivar caso
  async deleteCase(id: string): Promise<ApiResponse<void>> {
    return this.delete<ApiResponse<void>>(`/cases/${id}`);
  }

  // Timeline do caso
  async getCaseTimeline(
    id: string,
    params: { page?: number; limit?: number } = {}
  ): Promise<PaginatedResponse<Activity>> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });

    return this.get<PaginatedResponse<Activity>>(
      `/cases/${id}/timeline?${queryParams.toString()}`
    );
  }

  // ============ DOCUMENTOS ============

  // Listar documentos com filtros
  async getDocuments(
    params: {
      search?: string;
      type?: string;
      caseId?: string;
      uploadedById?: string;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<PaginatedResponse<Document>> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });

    return this.get<PaginatedResponse<Document>>(
      `/documents?${queryParams.toString()}`
    );
  }

  // Buscar documento por ID
  async getDocument(id: string): Promise<Document> {
    return this.get<Document>(`/documents/${id}`);
  }

  // Upload de documento
  async uploadDocument(
    file: File,
    data: {
      name: string;
      type: string;
      caseId?: string;
    }
  ): Promise<ApiResponse<{ document: Document }>> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("name", data.name);
    formData.append("type", data.type);
    if (data.caseId) {
      formData.append("caseId", data.caseId);
    }

    const response = await this.api.post("/documents/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  }

  // Atualizar documento
  async updateDocument(
    id: string,
    data: {
      name?: string;
      type?: string;
      caseId?: string;
    }
  ): Promise<ApiResponse<{ document: Document }>> {
    return this.put<ApiResponse<{ document: Document }>>(
      `/documents/${id}`,
      data
    );
  }

  // Excluir documento
  async deleteDocument(id: string): Promise<ApiResponse<void>> {
    return this.delete<ApiResponse<void>>(`/documents/${id}`);
  }

  // Download de documento
  downloadDocument(filename: string): string {
    return `${this.api.defaults.baseURL}/documents/${filename}/download`;
  }

  // Documentos de um caso
  async getCaseDocuments(caseId: string): Promise<{ documents: Document[] }> {
    return this.get<{ documents: Document[] }>(`/documents/case/${caseId}`);
  }

  // ============ COMPROMISSOS ============

  // Listar compromissos com filtros
  async getAppointments(
    params: {
      search?: string;
      type?: "HEARING" | "MEETING" | "DEADLINE" | "CALL";
      status?:
        | "SCHEDULED"
        | "CONFIRMED"
        | "COMPLETED"
        | "CANCELLED"
        | "RESCHEDULED";
      caseId?: string;
      lawyerId?: string;
      startDate?: string;
      endDate?: string;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<PaginatedResponse<Appointment>> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });

    return this.get<PaginatedResponse<Appointment>>(
      `/appointments?${queryParams.toString()}`
    );
  }

  // Buscar compromisso por ID
  async getAppointment(id: string): Promise<Appointment> {
    return this.get<Appointment>(`/appointments/${id}`);
  }

  // Criar novo compromisso
  async createAppointment(appointmentData: {
    title: string;
    description?: string;
    type: "HEARING" | "MEETING" | "DEADLINE" | "CALL";
    startDate: string;
    endDate: string;
    caseId?: string;
    meetingUrl?: string;
    meetingId?: string;
  }): Promise<ApiResponse<{ appointment: Appointment }>> {
    return this.post<ApiResponse<{ appointment: Appointment }>>(
      "/appointments",
      appointmentData
    );
  }

  // Atualizar compromisso
  async updateAppointment(
    id: string,
    appointmentData: Partial<Appointment>
  ): Promise<ApiResponse<{ appointment: Appointment }>> {
    return this.put<ApiResponse<{ appointment: Appointment }>>(
      `/appointments/${id}`,
      appointmentData
    );
  }

  // Atualizar status do compromisso
  async updateAppointmentStatus(
    id: string,
    status: string
  ): Promise<ApiResponse<{ appointment: Appointment }>> {
    return this.api
      .patch(`/appointments/${id}/status`, { status })
      .then((res) => res.data);
  }

  // Cancelar compromisso
  async deleteAppointment(id: string): Promise<ApiResponse<void>> {
    return this.delete<ApiResponse<void>>(`/appointments/${id}`);
  }

  // Calendário de compromissos
  async getAppointmentsCalendar(
    year: number,
    month: number
  ): Promise<{
    year: number;
    month: number;
    appointments: Appointment[];
  }> {
    return this.get<{
      year: number;
      month: number;
      appointments: Appointment[];
    }>(`/appointments/calendar/${year}/${month}`);
  }

  // Próximos compromissos
  async getUpcomingAppointments(
    days: number = 7
  ): Promise<{ appointments: Appointment[] }> {
    return this.get<{ appointments: Appointment[] }>(
      `/appointments/upcoming?days=${days}`
    );
  }

  // ============ ATIVIDADES ============

  // Listar atividades
  async getActivities(
    params: {
      page?: number;
      limit?: number;
    } = {}
  ): Promise<PaginatedResponse<Activity>> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });

    return this.get<PaginatedResponse<Activity>>(
      `/activities?${queryParams.toString()}`
    );
  }

  // ============ DASHBOARD ============

  // Estatísticas do dashboard
  async getDashboardStats(): Promise<DashboardStats> {
    console.log("[API] Buscando estatísticas do dashboard...");
    return this.get<DashboardStats>("/dashboard/stats");
  }

  // Gráfico de casos por status
  async getCasesByStatusChart(): Promise<CasesByStatusChart[]> {
    console.log("[API] Buscando dados do gráfico de casos por status...");
    return this.get<CasesByStatusChart[]>("/dashboard/charts/cases-by-status");
  }

  // Próximos prazos
  async getUpcomingDeadlines(days: number = 7): Promise<UpcomingDeadline[]> {
    console.log("[API] Buscando próximos prazos...");
    return this.get<UpcomingDeadline[]>(
      `/dashboard/upcoming-deadlines?days=${days}`
    );
  }

  // ============ USUÁRIOS ============

  // Métodos para usuários (admin)
  async getUsers(): Promise<{ users: User[] }> {
    return this.get("/users");
  }

  async createUser(
    userData: RegisterRequest
  ): Promise<ApiResponse<{ user: User }>> {
    return this.post("/users", userData);
  }

  async updateUser(
    id: string,
    userData: Partial<User>
  ): Promise<ApiResponse<{ user: User }>> {
    return this.put(`/users/${id}`, userData);
  }

  async deleteUser(id: string): Promise<ApiResponse<void>> {
    return this.delete(`/users/${id}`);
  }

  // ============ PERFIL ============

  // Obter dados do perfil do usuário logado
  async getProfile(): Promise<User> {
    console.log("[API] Buscando dados do perfil...");
    return this.get<User>("/profile");
  }

  // Atualizar dados do perfil
  async updateProfile(profileData: {
    name: string;
    phone?: string;
    address?: string;
    bio?: string;
  }): Promise<User> {
    console.log("[API] Atualizando perfil...");
    return this.put<User>("/profile", profileData);
  }

  // Alterar senha
  async changePassword(passwordData: {
    currentPassword: string;
    newPassword: string;
  }): Promise<{ message: string }> {
    console.log("[API] Alterando senha...");
    return this.post<{ message: string }>(
      "/profile/change-password",
      passwordData
    );
  }

  // Upload de avatar (placeholder)
  async uploadAvatar(file: File): Promise<{ avatar: string; message: string }> {
    console.log("[API] Fazendo upload de avatar...");
    const formData = new FormData();
    formData.append("avatar", file);

    return this.api
      .post("/profile/avatar", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      .then((response) => response.data);
  }

  // Obter atividades recentes
  async getProfileActivities(limit: number = 10): Promise<Activity[]> {
    console.log("[API] Buscando atividades do perfil...");
    return this.get<Activity[]>(`/profile/activities?limit=${limit}`);
  }

  // ================================
  // NOTIFICATIONS API
  // ================================

  // Obter notificações
  async getNotifications(params?: {
    page?: number;
    limit?: number;
    isRead?: boolean;
    type?: string;
    priority?: string;
  }): Promise<NotificationListResponse> {
    console.log("[API] Buscando notificações...");
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.isRead !== undefined)
      queryParams.append("isRead", params.isRead.toString());
    if (params?.type) queryParams.append("type", params.type);
    if (params?.priority) queryParams.append("priority", params.priority);

    const url = `/notifications${
      queryParams.toString() ? `?${queryParams.toString()}` : ""
    }`;
    return this.get<NotificationListResponse>(url);
  }

  // Obter contagem de notificações não lidas
  async getUnreadNotificationsCount(): Promise<{ count: number }> {
    console.log("[API] Buscando contagem de notificações não lidas...");
    return this.get<{ count: number }>("/notifications/unread-count");
  }

  // Marcar notificação como lida
  async markNotificationAsRead(id: string): Promise<Notification> {
    console.log("[API] Marcando notificação como lida:", id);
    return this.api
      .put(`/notifications/${id}/read`)
      .then((response) => response.data);
  }

  // Marcar todas as notificações como lidas
  async markAllNotificationsAsRead(): Promise<{ updated: number }> {
    console.log("[API] Marcando todas as notificações como lidas...");
    return this.api
      .put("/notifications/mark-all-read")
      .then((response) => response.data);
  }

  // Criar notificação (admin only)
  async createNotification(data: {
    title: string;
    message: string;
    type: string;
    priority?: string;
    actionUrl?: string;
    metadata?: Record<string, unknown>;
    caseId?: string;
    documentId?: string;
    appointmentId?: string;
  }): Promise<Notification> {
    console.log("[API] Criando notificação...");
    return this.post<Notification>("/notifications", data);
  }

  // Deletar notificação
  async deleteNotification(id: string): Promise<void> {
    console.log("[API] Deletando notificação:", id);
    return this.api.delete(`/notifications/${id}`).then(() => void 0);
  }
}

export const apiService = new ApiService();
export default apiService;
