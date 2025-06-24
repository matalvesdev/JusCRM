import axios from "axios";
import type { AxiosInstance, AxiosResponse } from "axios";
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  ApiResponse,
  User,
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
    ); // Interceptor para lidar com respostas
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

  // Métodos específicos para recursos

  // Usuários
  async getUsers() {
    return this.get("/users");
  }
  async createUser(userData: unknown) {
    return this.post("/users", userData);
  }

  async updateUser(id: string, userData: unknown) {
    return this.put(`/users/${id}`, userData);
  }

  async deleteUser(id: string) {
    return this.delete(`/users/${id}`);
  }

  // Clientes
  async getClients() {
    return this.get("/clients");
  }

  async getClient(id: string) {
    return this.get(`/clients/${id}`);
  }
  async createClient(clientData: unknown) {
    return this.post("/clients", clientData);
  }

  async updateClient(id: string, clientData: unknown) {
    return this.put(`/clients/${id}`, clientData);
  }

  async deleteClient(id: string) {
    return this.delete(`/clients/${id}`);
  }

  // Casos
  async getCases() {
    return this.get("/cases");
  }

  async getCase(id: string) {
    return this.get(`/cases/${id}`);
  }

  async createCase(caseData: unknown) {
    return this.post("/cases", caseData);
  }

  async updateCase(id: string, caseData: unknown) {
    return this.put(`/cases/${id}`, caseData);
  }

  async deleteCase(id: string) {
    return this.delete(`/cases/${id}`);
  }

  // Documentos
  async getDocuments(caseId?: string, clientId?: string) {
    let endpoint = "/documents";
    const params = new URLSearchParams();
    if (caseId) params.append("caseId", caseId);
    if (clientId) params.append("clientId", clientId);
    if (params.toString()) endpoint += `?${params.toString()}`;
    return this.get(endpoint);
  }

  async uploadDocument(formData: FormData) {
    const response = await this.api.post("/documents", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data.data;
  }

  async deleteDocument(id: string) {
    return this.delete(`/documents/${id}`);
  }

  // Petições
  async getPetitions(caseId?: string) {
    let endpoint = "/petitions";
    if (caseId) endpoint += `?caseId=${caseId}`;
    return this.get(endpoint);
  }
  async createPetition(petitionData: unknown) {
    return this.post("/petitions", petitionData);
  }

  async updatePetition(id: string, petitionData: unknown) {
    return this.put(`/petitions/${id}`, petitionData);
  }

  async deletePetition(id: string) {
    return this.delete(`/petitions/${id}`);
  }

  // Agendamentos
  async getAppointments() {
    return this.get("/appointments");
  }

  async createAppointment(appointmentData: unknown) {
    return this.post("/appointments", appointmentData);
  }

  async updateAppointment(id: string, appointmentData: unknown) {
    return this.put(`/appointments/${id}`, appointmentData);
  }

  async deleteAppointment(id: string) {
    return this.delete(`/appointments/${id}`);
  }

  // Pagamentos
  async getPayments() {
    return this.get("/payments");
  }

  async createPayment(paymentData: unknown) {
    return this.post("/payments", paymentData);
  }

  async updatePayment(id: string, paymentData: unknown) {
    return this.put(`/payments/${id}`, paymentData);
  }

  async deletePayment(id: string) {
    return this.delete(`/payments/${id}`);
  }

  // Atividades
  async getActivities() {
    return this.get("/activities");
  }

  async createActivity(activityData: unknown) {
    return this.post("/activities", activityData);
  }

  async updateActivity(id: string, activityData: unknown) {
    return this.put(`/activities/${id}`, activityData);
  }

  async deleteActivity(id: string) {
    return this.delete(`/activities/${id}`);
  }
}

export const apiService = new ApiService();
export default apiService;
