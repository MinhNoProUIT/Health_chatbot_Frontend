const API_BASE_URL =
  "https://wj76awz488.execute-api.ap-southeast-1.amazonaws.com";

export type Medication = {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  time: string;
  withFood: boolean;
  isActive: boolean;
  userId: string;
  type: "MEDICATION";
  createdAt: string;
  SK: string;
  PK: string;
};

export type MedicationLog = {
  userId: string;
  medicationId: string;
  takenAt: string;
  date: string;
  type: "LOG";
};

export type MedicationStats = {
  totalActive: number;
  complianceRate: number;
  weeklyIntakeCount: number;
};

export type DailyReminder = {
  isTaken: boolean;
} & Medication;

interface ApiResponse<T> {
  success?: boolean;
  data?: T;
  message?: string;
}

export class ReminderService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    // Lấy token từ localStorage
    const token = (localStorage.getItem("idToken") ?? "").trim();

    const config: RequestInit = {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    try {
      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `Lỗi server: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === "AbortError") {
        throw new Error(
          "Kết nối quá thời gian chờ (Timeout). Vui lòng thử lại."
        );
      }
      throw error;
    }
  }

  // GET /reminders - Lấy tất cả thuốc
  // Backend sẽ tự động lấy userId từ JWT token
  async getAllMedications(): Promise<Medication[]> {
    const response = await this.request<Medication[]>("/reminders");
    return response;
  }

  // POST /reminders - Tạo thuốc mới
  // Backend sẽ tự động lấy userId từ JWT token
  async createMedication(
    medication: Omit<Medication, "id" | "createdAt" | "SK" | "PK" | "userId">
  ): Promise<Medication> {
    const response = await this.request<Medication>("/reminders", {
      method: "POST",
      body: JSON.stringify(medication),
    });
    return response;
  }

  // PUT /reminders - Cập nhật thuốc
  // Backend sẽ tự động lấy userId từ JWT token
  async updateMedication(
    medication: Partial<Medication> & { id: string }
  ): Promise<Medication> {
    const response = await this.request<Medication>("/reminders", {
      method: "PUT",
      body: JSON.stringify(medication),
    });
    return response;
  }

  // DELETE /reminders - Xóa thuốc
  // Backend sẽ tự động lấy userId từ JWT token
  async deleteMedication(medicationId: string): Promise<{ message: string }> {
    const response = await this.request<{ message: string }>("/reminders", {
      method: "DELETE",
      body: JSON.stringify({ medicationId }),
    });
    return response;
  }

  // GET /reminders/daily - Lấy thuốc cần uống hôm nay
  // Backend sẽ tự động lấy userId từ JWT token
  async getDailyReminders(): Promise<DailyReminder[]> {
    const response = await this.request<DailyReminder[]>("/reminders/daily");
    return response;
  }

  // POST /reminders/taken - Đánh dấu đã uống thuốc
  // Backend sẽ tự động lấy userId từ JWT token
  async markAsTaken(medicationId: string): Promise<MedicationLog> {
    const response = await this.request<MedicationLog>("/reminders/taken", {
      method: "POST",
      body: JSON.stringify({ medicationId }),
    });
    return response;
  }

  // GET /reminders/stats - Lấy thống kê
  // Backend sẽ tự động lấy userId từ JWT token
  async getStats(): Promise<MedicationStats> {
    const response = await this.request<MedicationStats>("/reminders/stats");
    return response;
  }
}
