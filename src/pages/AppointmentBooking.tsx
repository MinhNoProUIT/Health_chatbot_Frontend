import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Calendar,
  Clock,
  User,
  ArrowLeft,
  CheckCircle2,
  Building2,
  Stethoscope,
  Plus,
  MapPin,
  Phone,
  Mail,
  FileText,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { bookAppointment, getMyAppointments } from "../services/appointment-service";
import { v4 as uuidv4 } from "uuid";
import { Badge } from "@/components/ui/badge";

// Dữ liệu cứng bệnh viện
const HOSPITALS = [
  {
    id: "H001",
    name: "Bệnh viện Chợ Rẫy",
    address: "201B Nguyễn Chí Thanh, Quận 5, TP.HCM",
    phone: "028 3855 4137",
  },
  {
    id: "H002",
    name: "Bệnh viện Đại học Y Dược",
    address: "215 Hồng Bàng, Quận 5, TP.HCM",
    phone: "028 3855 2222",
  },
  {
    id: "H003",
    name: "Bệnh viện Nhi Đồng 1",
    address: "341 Sư Vạn Hạnh, Quận 10, TP.HCM",
    phone: "028 3865 3333",
  },
  {
    id: "H004",
    name: "Bệnh viện Thống Nhất",
    address: "1 Lý Thường Kiệt, Quận 10, TP.HCM",
    phone: "028 3865 4444",
  },
];

// Dữ liệu cứng bác sĩ theo bệnh viện
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

// Validation schema
const appointmentSchema = z.object({
  hospitalId: z.string().min(1, "Vui lòng chọn bệnh viện"),
  doctorId: z.string().min(1, "Vui lòng chọn bác sĩ"),
  appointmentDate: z.string().min(1, "Vui lòng chọn ngày khám"),
  appointmentTime: z.string().min(1, "Vui lòng chọn giờ khám"),
  patientName: z.string().min(2, "Họ tên phải có ít nhất 2 ký tự"),
  patientPhone: z.string().min(10, "Số điện thoại không hợp lệ"),
  patientEmail: z.string().email("Email không hợp lệ"),
  symptoms: z.string().optional(),
});

type AppointmentForm = z.infer<typeof appointmentSchema>;

interface Appointment {
  appointmentId: string;
  hospitalName: string;
  hospitalAddress: string;
  hospitalPhone: string;
  doctorName: string;
  doctorPhone: string;
  appointmentDate: string;
  appointmentTime: string;
  patientName: string;
  patientPhone: string;
  patientEmail: string;
  symptoms?: string;
  status: string;
  createdAt: string;
}

const AppointmentBooking = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>("");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const { toast } = useToast();

  const form = useForm<AppointmentForm>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      hospitalId: "",
      doctorId: "",
      appointmentDate: "",
      appointmentTime: "",
      patientName: "",
      patientPhone: "",
      patientEmail: "",
      symptoms: "",
    },
  });

  // Load appointments khi component mount
  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    setLoadingAppointments(true);
    try {
      const result = await getMyAppointments();
      console.log("Appointments:", result);

      if (result.success && result.data) {
        setAppointments(result.data);
      }
    } catch (error) {
      console.error("Error loading appointments:", error);
    } finally {
      setLoadingAppointments(false);
    }
  };

  const selectedHospital = HOSPITALS.find((h) => h.id === selectedHospitalId);
  const availableDoctors = selectedHospitalId ? DOCTORS_BY_HOSPITAL[selectedHospitalId] || [] : [];

  const onSubmit = async (data: AppointmentForm) => {
    setIsLoading(true);
    try {
      const hospital = HOSPITALS.find((h) => h.id === data.hospitalId);
      const doctor = DOCTORS_BY_HOSPITAL[data.hospitalId]?.find((d) => d.id === data.doctorId);

      if (!hospital || !doctor) {
        throw new Error("Thông tin bệnh viện hoặc bác sĩ không hợp lệ");
      }

      const appointmentData = {
        appointmentId: `APPT-${uuidv4()}`,
        hospitalName: hospital.name,
        hospitalAddress: hospital.address,
        hospitalPhone: hospital.phone,
        doctorName: doctor.name,
        doctorPhone: doctor.phone,
        appointmentDate: data.appointmentDate,
        appointmentTime: data.appointmentTime,
        patientName: data.patientName,
        patientPhone: data.patientPhone,
        patientEmail: data.patientEmail,
        symptoms: data.symptoms || "",
      };

      const result = await bookAppointment(appointmentData);
      console.log("Appointment created:", result);

      setIsSubmitted(true);
      toast({
        title: "Đặt lịch thành công!",
        description: "Chúng tôi sẽ liên hệ với bạn sớm nhất.",
      });

      // Reload appointments
      await loadAppointments();
      setShowForm(false);
    } catch (error: any) {
      console.error("Error booking appointment:", error);
      toast({
        title: "Đặt lịch thất bại",
        description: error.message || "Vui lòng thử lại sau",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      pending: { label: "Chờ xác nhận", className: "bg-yellow-100 text-yellow-800" },
      confirmed: { label: "Đã xác nhận", className: "bg-green-100 text-green-800" },
      cancelled: { label: "Đã hủy", className: "bg-red-100 text-red-800" },
      completed: { label: "Hoàn thành", className: "bg-blue-100 text-blue-800" },
    };

    const config = statusConfig[status] || statusConfig.pending;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-2xl border-0">
          <CardContent className="pt-12 pb-8 text-center">
            <div className="mb-6 flex justify-center">
              <div className="rounded-full bg-green-100 p-6">
                <CheckCircle2 className="h-16 w-16 text-green-600" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Đặt lịch thành công!
            </h2>
            <p className="text-gray-600 mb-8">
              Chúng tôi đã nhận được yêu cầu đặt lịch của bạn. Bệnh viện sẽ liên hệ với bạn sớm nhất để xác nhận.
            </p>
            <div className="space-y-3">
              <Button
                onClick={() => {
                  setIsSubmitted(false);
                  setShowForm(false);
                }}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                Xem lịch hẹn của tôi
              </Button>
              <Link to="/" className="block">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Về trang chủ
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Hiển thị danh sách appointments nếu có
  if (!showForm && !loadingAppointments) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                Lịch hẹn của tôi
              </h1>
              <p className="text-gray-600">
                Quản lý các lịch hẹn khám bệnh của bạn
              </p>
            </div>
            <Button
              onClick={() => setShowForm(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              Đặt lịch mới
            </Button>
          </div>

          {/* Appointments List */}
          {appointments.length === 0 ? (
            <Card className="shadow-lg border-0">
              <CardContent className="py-16 text-center">
                <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Chưa có lịch hẹn nào
                </h3>
                <p className="text-gray-600 mb-6">
                  Bạn chưa đặt lịch hẹn nào. Hãy đặt lịch khám bệnh ngay!
                </p>
                <Button
                  onClick={() => setShowForm(true)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Đặt lịch ngay
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className={appointments.length === 1 ? "max-w-2xl mx-auto" : "grid grid-cols-1 md:grid-cols-2 gap-6"}>
              {appointments.map((appointment) => (
                <Card key={appointment.appointmentId} className="shadow-lg border-0 hover:shadow-xl transition-shadow">
                  <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-xl">
                        {appointment.hospitalName}
                      </CardTitle>
                      {getStatusBadge(appointment.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    {/* Thông tin bệnh viện */}
                    <div className="space-y-2">
                      <div className="flex items-start gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{appointment.hospitalAddress}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-700">{appointment.hospitalPhone}</span>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      {/* Bác sĩ */}
                      <div className="flex items-center gap-2 mb-2">
                        <Stethoscope className="h-4 w-4 text-purple-600" />
                        <span className="font-semibold text-gray-900">{appointment.doctorName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 ml-6">
                        <Phone className="h-3 w-3" />
                        <span>{appointment.doctorPhone}</span>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      {/* Thời gian */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-green-600" />
                          <div>
                            <p className="text-xs text-gray-500">Ngày khám</p>
                            <p className="font-semibold text-gray-900">{appointment.appointmentDate}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-orange-600" />
                          <div>
                            <p className="text-xs text-gray-500">Giờ khám</p>
                            <p className="font-semibold text-gray-900">{appointment.appointmentTime}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      {/* Thông tin bệnh nhân */}
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-blue-600" />
                          <span className="font-medium">{appointment.patientName}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600 ml-6">
                          <Phone className="h-3 w-3" />
                          <span>{appointment.patientPhone}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600 ml-6">
                          <Mail className="h-3 w-3" />
                          <span>{appointment.patientEmail}</span>
                        </div>
                      </div>
                    </div>

                    {appointment.symptoms && (
                      <div className="border-t pt-4">
                        <div className="flex items-start gap-2 text-sm">
                          <FileText className="h-4 w-4 text-gray-500 mt-0.5" />
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Triệu chứng</p>
                            <p className="text-gray-700">{appointment.symptoms}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Back button */}
          <div className="mt-8 text-center">
            <Link to="/">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Về trang chủ
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (loadingAppointments) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  // Form đặt lịch mới
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Đặt lịch khám bệnh
            </h1>
            <p className="text-gray-600">
              Chọn bệnh viện và bác sĩ để đặt lịch hẹn
            </p>
          </div>
          {appointments.length > 0 && (
            <Button
              onClick={() => setShowForm(false)}
              variant="outline"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Xem lịch hẹn
            </Button>
          )}
        </div>

        <Card className="shadow-2xl border-0">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
            <CardTitle className="text-2xl flex items-center gap-2">
              <Calendar className="h-6 w-6" />
              Thông tin đặt lịch
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                {/* Thông tin bệnh viện */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-4">
                    <Building2 className="h-5 w-5 text-blue-600" />
                    Thông tin bệnh viện
                  </div>
                  <FormField
                    control={form.control}
                    name="hospitalId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Chọn bệnh viện *</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value);
                            setSelectedHospitalId(value);
                            form.setValue("doctorId", "");
                          }}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Chọn bệnh viện" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {HOSPITALS.map((hospital) => (
                              <SelectItem key={hospital.id} value={hospital.id}>
                                {hospital.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {selectedHospital && (
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <p className="text-sm text-gray-700">
                        <span className="font-semibold">Địa chỉ:</span> {selectedHospital.address}
                      </p>
                      <p className="text-sm text-gray-700">
                        <span className="font-semibold">Điện thoại:</span> {selectedHospital.phone}
                      </p>
                    </div>
                  )}
                </div>

                {/* Thông tin bác sĩ */}
                {selectedHospitalId && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-4">
                      <Stethoscope className="h-5 w-5 text-purple-600" />
                      Thông tin bác sĩ
                    </div>
                    <FormField
                      control={form.control}
                      name="doctorId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Chọn bác sĩ *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Chọn bác sĩ" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {availableDoctors.map((doctor) => (
                                <SelectItem key={doctor.id} value={doctor.id}>
                                  {doctor.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {/* Thời gian khám */}
                {form.watch("doctorId") && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-4">
                      <Clock className="h-5 w-5 text-green-600" />
                      Thời gian khám
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="appointmentDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ngày khám *</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="appointmentTime"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Giờ khám *</FormLabel>
                            <FormControl>
                              <Input type="time" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}

                {/* Thông tin bệnh nhân */}
                {form.watch("appointmentDate") && form.watch("appointmentTime") && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-4">
                      <User className="h-5 w-5 text-orange-600" />
                      Thông tin bệnh nhân
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="patientName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Họ và tên *</FormLabel>
                            <FormControl>
                              <Input placeholder="Nguyễn Văn A" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="patientPhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Số điện thoại *</FormLabel>
                            <FormControl>
                              <Input placeholder="0912345678" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="patientEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email *</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="example@email.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="symptoms"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Triệu chứng</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Mô tả triệu chứng của bạn..."
                              className="resize-none"
                              rows={4}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {/* Buttons */}
                <div className="flex gap-4 pt-4">
                  {appointments.length > 0 ? (
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => setShowForm(false)}
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Hủy
                    </Button>
                  ) : (
                    <Link to="/" className="flex-1">
                      <Button type="button" variant="outline" className="w-full">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Hủy
                      </Button>
                    </Link>
                  )}
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    {isLoading ? "Đang xử lý..." : "Đặt lịch ngay"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AppointmentBooking;
