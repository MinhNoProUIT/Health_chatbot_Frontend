import { bookAppointment } from "@/services/appointment-service";
import { v4 as uuidv4 } from "uuid";

// Dữ liệu bệnh viện
const HOSPITALS = [
    { id: "H001", name: "Bệnh viện Chợ Rẫy", address: "201B Nguyễn Chí Thanh, Quận 5, TP.HCM", phone: "028 3855 4137" },
    { id: "H002", name: "Bệnh viện Đại học Y Dược", address: "215 Hồng Bàng, Quận 5, TP.HCM", phone: "028 3855 2222" },
    { id: "H003", name: "Bệnh viện Nhi Đồng 1", address: "341 Sư Vạn Hạnh, Quận 10, TP.HCM", phone: "028 3865 3333" },
    { id: "H004", name: "Bệnh viện Thống Nhất", address: "1 Lý Thường Kiệt, Quận 10, TP.HCM", phone: "028 3865 4444" },
];

// Dữ liệu bác sĩ theo bệnh viện
const DOCTORS_BY_HOSPITAL: Record<string, Array<{ id: string; name: string; phone: string }>> = {
    H001: [
        { id: "DOC001", name: "BS. Nguyễn Văn A", phone: "0901234567" },
        { id: "DOC002", name: "BS. Trần Thị B", phone: "0902345678" },
        { id: "DOC003", name: "BS. Lê Văn C", phone: "0903456789" },
    ],
    H002: [
        { id: "DOC004", name: "BS. Phạm Thị D", phone: "0904567890" },
        { id: "DOC005", name: "BS. Hoàng Văn E", phone: "0905678901" },
        { id: "DOC006", name: "BS. Võ Thị F", phone: "0906789012" },
    ],
    H003: [
        { id: "DOC007", name: "BS. Đặng Văn G", phone: "0907890123" },
        { id: "DOC008", name: "BS. Bùi Thị H", phone: "0908901234" },
    ],
    H004: [
        { id: "DOC009", name: "BS. Ngô Văn I", phone: "0909012345" },
        { id: "DOC010", name: "BS. Dương Thị K", phone: "0910123456" },
    ],
};

// Generate time slots từ 6h sáng đến 6h tối
const generateTimeSlots = (): string[] => {
    const slots: string[] = [];
    for (let hour = 6; hour <= 18; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
            const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
            slots.push(timeStr);
        }
    }
    return slots;
};

const TIME_SLOTS = generateTimeSlots();

export interface AppointmentContext {
    flow: 'idle' | 'select_hospital' | 'select_doctor' | 'select_date' | 'select_time' | 'enter_name' | 'enter_phone' | 'enter_email' | 'enter_symptoms' | 'confirm';
    hospitalId?: string;
    doctorId?: string;
    date?: string;
    time?: string;
    patientName?: string;
    patientPhone?: string;
    patientEmail?: string;
    symptoms?: string;
}

/**
 * Kiểm tra xem câu hỏi có liên quan đến đặt lịch hẹn không
 */
export const checkAppointmentQuery = (message: string): boolean => {
    const lowerMessage = message.toLowerCase();
    const appointmentKeywords = [
        'đặt lịch', 'dat lich', 'đặt lich', 'book appointment',
        'lịch hẹn', 'lich hen', 'appointment', 'khám bệnh', 'kham benh',
        'đặt khám', 'dat kham', 'hẹn khám', 'hen kham', 'đặt hẹn', 'dat hen',
        'book', 'booking', 'schedule', 'lịch khám', 'lich kham'
    ];

    return appointmentKeywords.some(keyword => lowerMessage.includes(keyword));
};

/**
 * Xử lý conversation flow cho đặt lịch hẹn
 */
export const getAppointmentResponse = async (
    message: string,
    context: AppointmentContext
): Promise<{ response: string; context: AppointmentContext }> => {
    const lowerMessage = message.toLowerCase().trim();

    // Bắt đầu flow
    if (context.flow === 'idle' || !context.flow) {
        return {
            response: `🏥 **Đặt lịch khám bệnh**\n\nVui lòng chọn bệnh viện bạn muốn khám:\n\n${HOSPITALS.map((h, i) => `${i + 1}. ${h.name}`).join('\n')}\n\nVui lòng nhập số thứ tự (1-${HOSPITALS.length}) hoặc tên bệnh viện.`,
            context: { flow: 'select_hospital' }
        };
    }

    // Chọn bệnh viện
    if (context.flow === 'select_hospital') {
        const hospitalIndex = parseInt(lowerMessage) - 1;
        let selectedHospital = HOSPITALS[hospitalIndex];

        if (!selectedHospital) {
            selectedHospital = HOSPITALS.find(h =>
                h.name.toLowerCase().includes(lowerMessage)
            );
        }

        if (!selectedHospital) {
            return {
                response: `❌ Không tìm thấy bệnh viện. Vui lòng chọn lại:\n\n${HOSPITALS.map((h, i) => `${i + 1}. ${h.name}`).join('\n')}`,
                context
            };
        }

        const doctors = DOCTORS_BY_HOSPITAL[selectedHospital.id] || [];
        return {
            response: `✅ Đã chọn: **${selectedHospital.name}**\n📍 ${selectedHospital.address}\n📞 ${selectedHospital.phone}\n\n👨‍⚕️ **Chọn bác sĩ:**\n\n${doctors.map((d, i) => `${i + 1}. ${d.name}`).join('\n')}\n\nVui lòng nhập số thứ tự (1-${doctors.length}).`,
            context: { ...context, flow: 'select_doctor', hospitalId: selectedHospital.id }
        };
    }

    // Chọn bác sĩ
    if (context.flow === 'select_doctor') {
        const doctors = DOCTORS_BY_HOSPITAL[context.hospitalId!] || [];
        const doctorIndex = parseInt(lowerMessage) - 1;
        const selectedDoctor = doctors[doctorIndex];

        if (!selectedDoctor) {
            return {
                response: `❌ Lựa chọn không hợp lệ. Vui lòng chọn lại:\n\n${doctors.map((d, i) => `${i + 1}. ${d.name}`).join('\n')}`,
                context
            };
        }

        return {
            response: `✅ Đã chọn: **${selectedDoctor.name}**\n📞 ${selectedDoctor.phone}\n\n📅 **Chọn ngày khám**\n\nVui lòng nhập ngày khám theo định dạng: DD/MM/YYYY\n(Ví dụ: 25/12/2025)`,
            context: { ...context, flow: 'select_date', doctorId: selectedDoctor.id }
        };
    }

    // Chọn ngày
    if (context.flow === 'select_date') {
        const dateRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
        const match = lowerMessage.match(dateRegex);

        if (!match) {
            return {
                response: `❌ Định dạng ngày không hợp lệ. Vui lòng nhập theo định dạng DD/MM/YYYY\n(Ví dụ: 25/12/2025)`,
                context
            };
        }

        const [, day, month, year] = match;
        const dateStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        const selectedDate = new Date(dateStr);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (selectedDate < today) {
            return {
                response: `❌ Ngày khám phải là ngày trong tương lai. Vui lòng chọn lại.`,
                context
            };
        }

        // Hiển thị time slots theo nhóm
        const morningSlots = TIME_SLOTS.filter(t => parseInt(t.split(':')[0]) < 12);
        const afternoonSlots = TIME_SLOTS.filter(t => parseInt(t.split(':')[0]) >= 12);

        return {
            response: `✅ Đã chọn ngày: **${day}/${month}/${year}**\n\n⏰ **Chọn giờ khám:**\n\n🌅 **Buổi sáng (6:00 - 11:30):**\n${morningSlots.map((t, i) => `${i + 1}. ${t}`).join(', ')}\n\n🌆 **Buổi chiều (12:00 - 18:30):**\n${afternoonSlots.map((t, i) => `${morningSlots.length + i + 1}. ${t}`).join(', ')}\n\nVui lòng nhập số thứ tự (1-${TIME_SLOTS.length}) hoặc giờ (VD: 09:00)`,
            context: { ...context, flow: 'select_time', date: dateStr }
        };
    }

    // Chọn giờ
    if (context.flow === 'select_time') {
        const timeIndex = parseInt(lowerMessage) - 1;
        let selectedTime = TIME_SLOTS[timeIndex];

        if (!selectedTime) {
            selectedTime = TIME_SLOTS.find(t => t === lowerMessage);
        }

        if (!selectedTime) {
            return {
                response: `❌ Giờ không hợp lệ. Vui lòng chọn lại (1-${TIME_SLOTS.length}) hoặc nhập giờ (VD: 09:00)`,
                context
            };
        }

        return {
            response: `✅ Đã chọn giờ: **${selectedTime}**\n\n👤 **Thông tin bệnh nhân**\n\nVui lòng nhập họ tên của bạn:`,
            context: { ...context, flow: 'enter_name', time: selectedTime }
        };
    }

    // Nhập tên
    if (context.flow === 'enter_name') {
        if (message.trim().length < 2) {
            return {
                response: `❌ Tên phải có ít nhất 2 ký tự. Vui lòng nhập lại:`,
                context
            };
        }

        return {
            response: `✅ Họ tên: **${message.trim()}**\n\n📱 Vui lòng nhập số điện thoại:`,
            context: { ...context, flow: 'enter_phone', patientName: message.trim() }
        };
    }

    // Nhập số điện thoại
    if (context.flow === 'enter_phone') {
        const phoneRegex = /^0\d{9}$/;
        if (!phoneRegex.test(lowerMessage.replace(/\s/g, ''))) {
            return {
                response: `❌ Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại 10 số (bắt đầu bằng 0):`,
                context
            };
        }

        return {
            response: `✅ Số điện thoại: **${message.trim()}**\n\n📧 Vui lòng nhập email:`,
            context: { ...context, flow: 'enter_email', patientPhone: message.trim() }
        };
    }

    // Nhập email
    if (context.flow === 'enter_email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(lowerMessage)) {
            return {
                response: `❌ Email không hợp lệ. Vui lòng nhập lại:`,
                context
            };
        }

        return {
            response: `✅ Email: **${message.trim()}**\n\n📝 Vui lòng mô tả triệu chứng của bạn (hoặc gõ "bỏ qua" nếu không có):`,
            context: { ...context, flow: 'enter_symptoms', patientEmail: message.trim() }
        };
    }

    // Nhập triệu chứng
    if (context.flow === 'enter_symptoms') {
        const symptoms = lowerMessage === 'bỏ qua' || lowerMessage === 'bo qua' ? '' : message.trim();

        const hospital = HOSPITALS.find(h => h.id === context.hospitalId);
        const doctor = DOCTORS_BY_HOSPITAL[context.hospitalId!]?.find(d => d.id === context.doctorId);
        const [year, month, day] = context.date!.split('-');

        const summary = `📋 **Xác nhận thông tin đặt lịch:**\n\n🏥 Bệnh viện: ${hospital?.name}\n👨‍⚕️ Bác sĩ: ${doctor?.name}\n📅 Ngày: ${day}/${month}/${year}\n⏰ Giờ: ${context.time}\n\n👤 **Thông tin bệnh nhân:**\n• Họ tên: ${context.patientName}\n• SĐT: ${context.patientPhone}\n• Email: ${context.patientEmail}${symptoms ? `\n• Triệu chứng: ${symptoms}` : ''}\n\nGõ **"xác nhận"** để đặt lịch hoặc **"hủy"** để hủy bỏ.`;

        return {
            response: summary,
            context: { ...context, flow: 'confirm', symptoms }
        };
    }

    // Xác nhận
    if (context.flow === 'confirm') {
        if (lowerMessage === 'hủy' || lowerMessage === 'huy' || lowerMessage === 'cancel') {
            return {
                response: `❌ Đã hủy đặt lịch. Nếu bạn muốn đặt lại, hãy nói "đặt lịch khám".`,
                context: { flow: 'idle' }
            };
        }

        if (lowerMessage !== 'xác nhận' && lowerMessage !== 'xac nhan' && lowerMessage !== 'confirm') {
            return {
                response: `Vui lòng gõ **"xác nhận"** để đặt lịch hoặc **"hủy"** để hủy bỏ.`,
                context
            };
        }

        // Tạo appointment
        try {
            const hospital = HOSPITALS.find(h => h.id === context.hospitalId)!;
            const doctor = DOCTORS_BY_HOSPITAL[context.hospitalId!]?.find(d => d.id === context.doctorId)!;

            const appointmentData = {
                appointmentId: `APPT-${uuidv4()}`,
                hospitalName: hospital.name,
                hospitalAddress: hospital.address,
                hospitalPhone: hospital.phone,
                doctorName: doctor.name,
                doctorPhone: doctor.phone,
                appointmentDate: context.date!,
                appointmentTime: context.time!,
                patientName: context.patientName!,
                patientPhone: context.patientPhone!,
                patientEmail: context.patientEmail!,
                symptoms: context.symptoms || '',
            };

            const result = await bookAppointment(appointmentData);

            const [year, month, day] = context.date!.split('-');

            return {
                response: `✅ **Đặt lịch thành công!**\n\n📋 **Thông tin lịch hẹn:**\n\n🏥 Bệnh viện: ${hospital.name}\n📍 ${hospital.address}\n📞 ${hospital.phone}\n\n👨‍⚕️ Bác sĩ: ${doctor.name}\n📞 ${doctor.phone}\n\n📅 Ngày khám: ${day}/${month}/${year}\n⏰ Giờ khám: ${context.time}\n\n👤 **Thông tin bệnh nhân:**\n• Họ tên: ${context.patientName}\n• SĐT: ${context.patientPhone}\n• Email: ${context.patientEmail}${context.symptoms ? `\n• Triệu chứng: ${context.symptoms}` : ''}\n\n📌 **Trạng thái:** Chờ xác nhận\n\n💡 Bệnh viện sẽ liên hệ với bạn sớm nhất để xác nhận lịch hẹn. Bạn có thể xem lịch hẹn của mình tại trang **Đặt lịch khám**.`,
                context: { flow: 'idle' }
            };
        } catch (error: any) {
            return {
                response: `❌ Có lỗi xảy ra khi đặt lịch: ${error.message}\n\nVui lòng thử lại sau hoặc liên hệ bộ phận hỗ trợ.`,
                context: { flow: 'idle' }
            };
        }
    }

    return {
        response: `Xin lỗi, có lỗi xảy ra. Vui lòng thử lại bằng cách nói "đặt lịch khám".`,
        context: { flow: 'idle' }
    };
};
