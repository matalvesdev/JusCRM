import axios from "axios";
import type { AxiosInstance, AxiosResponse } from "axios";
import type { LoginRequest, LoginResponse, ApiResponse, User } from "@/types";

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: import.meta.env.VITE_API_URL || "http://localhost:3001/api",
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Interceptor para adicionar token de autenticação
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem("auth_token");
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Interceptor para lidar com respostas
    this.api.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      (error) => {
        if (error.response?.status === 401) {
          // Token expirado ou inválido
          localStorage.removeItem("auth_token");
          localStorage.removeItem("user");
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }
    );
  }

  // Métodos de autenticação
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await this.api.post<ApiResponse<LoginResponse>>(
      "/auth/login",
      credentials
    );
    return response.data.data;
  }

  async logout(): Promise<void> {
    await this.api.post("/auth/logout");
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user");
  }
  async me(): Promise<User> {
    const response = await this.api.get<ApiResponse<User>>("/auth/me");
    return response.data.data;
  }

  // Métodos genéricos para CRUD
  async get<T>(endpoint: string): Promise<T> {
    const response = await this.api.get<ApiResponse<T>>(endpoint);
    return response.data.data;
  }

  async post<T>(endpoint: string, data: unknown): Promise<T> {
    const response = await this.api.post<ApiResponse<T>>(endpoint, data);
    return response.data.data;
  }

  async put<T>(endpoint: string, data: unknown): Promise<T> {
    const response = await this.api.put<ApiResponse<T>>(endpoint, data);
    return response.data.data;
  }

  async delete<T>(endpoint: string): Promise<T> {
    const response = await this.api.delete<ApiResponse<T>>(endpoint);
    return response.data.data;
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
