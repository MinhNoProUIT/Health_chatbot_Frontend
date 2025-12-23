export const API_BASE = "https://llnl5z5s29.execute-api.us-east-1.amazonaws.com/dev";

// Lấy danh sách appointments của user
export async function getMyAppointments() {
  const token = (localStorage.getItem("accessToken") ?? "").trim();
  const res = await fetch(`${API_BASE}/appointments`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error("Không thể lấy danh sách lịch hẹn");
  return res.json();
}

// Đặt lịch hẹn mới
export async function bookAppointment(data: any) {
  const token = (localStorage.getItem("accessToken") ?? "").trim();
  const res = await fetch(`${API_BASE}/appointment`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Không thể đặt lịch hẹn");
  }

  return res.json();
}
