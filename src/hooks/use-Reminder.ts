import { useState, useEffect, useCallback } from "react";
import {
  ReminderService,
  Medication,
  DailyReminder,
  MedicationStats,
} from "@/services/reminderService";

const reminderService = new ReminderService();

/**
 * Hook lấy tất cả thuốc
 */
export function useAllMedications() {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMedications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await reminderService.getAllMedications();
      setMedications(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Đã xảy ra lỗi khi tải danh sách thuốc"
      );
      console.error("Failed to fetch medications:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMedications();
  }, [fetchMedications]);

  return { medications, loading, error, refetch: fetchMedications };
}

/**
 * Hook lấy thuốc cần uống hôm nay
 */
export function useDailyReminders() {
  const [reminders, setReminders] = useState<DailyReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReminders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await reminderService.getDailyReminders();
      setReminders(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Đã xảy ra lỗi khi tải lời nhắc hôm nay"
      );
      console.error("Failed to fetch daily reminders:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  return { reminders, loading, error, refetch: fetchReminders };
}

/**
 * Hook lấy thống kê
 */
export function useMedicationStats() {
  const [stats, setStats] = useState<MedicationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await reminderService.getStats();
      setStats(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Đã xảy ra lỗi khi tải thống kê"
      );
      console.error("Failed to fetch stats:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, error, refetch: fetchStats };
}

/**
 * Hook tạo, cập nhật, xóa thuốc
 */
export function useMedicationActions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createMedication = async (
    medication: Omit<Medication, "id" | "createdAt" | "SK" | "PK">
  ) => {
    try {
      setLoading(true);
      setError(null);
      const result = await reminderService.createMedication(medication);
      return result;
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Đã xảy ra lỗi khi tạo thuốc";
      setError(errorMsg);
      console.error("Failed to create medication:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateMedication = async (
    medication: Partial<Medication> & { id: string }
  ) => {
    try {
      setLoading(true);
      setError(null);
      const result = await reminderService.updateMedication(medication);
      return result;
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Đã xảy ra lỗi khi cập nhật thuốc";
      setError(errorMsg);
      console.error("Failed to update medication:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteMedication = async (medicationId: string) => {
    try {
      setLoading(true);
      setError(null);
      const result = await reminderService.deleteMedication(medicationId);
      return result;
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Đã xảy ra lỗi khi xóa thuốc";
      setError(errorMsg);
      console.error("Failed to delete medication:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const markAsTaken = async (medicationId: string) => {
    try {
      setLoading(true);
      setError(null);
      const result = await reminderService.markAsTaken(medicationId);
      return result;
    } catch (err) {
      const errorMsg =
        err instanceof Error
          ? err.message
          : "Đã xảy ra lỗi khi đánh dấu đã uống thuốc";
      setError(errorMsg);
      console.error("Failed to mark as taken:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    createMedication,
    updateMedication,
    deleteMedication,
    markAsTaken,
    loading,
    error,
  };
}
