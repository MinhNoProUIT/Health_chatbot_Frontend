import { useState } from "react";
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
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Pill,
  Plus,
  ArrowLeft,
  Clock,
  Bell,
  Trash2,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import {
  useAllMedications,
  useDailyReminders,
  useMedicationStats,
  useMedicationActions,
} from "@/hooks/use-Reminder";

const medicationSchema = z.object({
  name: z.string().min(1, "Tên thuốc không được để trống"),
  dosage: z.string().min(1, "Liều lượng không được để trống"),
  frequency: z.string().min(1, "Vui lòng chọn tần suất"),
  time: z.string().min(1, "Vui lòng chọn thời gian"),
  withFood: z.boolean().default(false),
});

type MedicationForm = z.infer<typeof medicationSchema>;

const MedicationReminder = () => {
  const [showForm, setShowForm] = useState(false);
  const { toast } = useToast();

  // Fetch data using hooks
  const {
    medications,
    loading: medicationsLoading,
    refetch: refetchMedications,
  } = useAllMedications();
  const {
    reminders,
    loading: remindersLoading,
    refetch: refetchReminders,
  } = useDailyReminders();
  const { stats, loading: statsLoading } = useMedicationStats();
  const {
    createMedication,
    updateMedication,
    deleteMedication: deleteMedicationAction,
    markAsTaken: markAsTakenAction,
    loading: actionLoading,
  } = useMedicationActions();

  const form = useForm<MedicationForm>({
    resolver: zodResolver(medicationSchema),
    defaultValues: {
      name: "",
      dosage: "",
      frequency: "",
      time: "",
      withFood: false,
    },
  });

  const frequencies = [
    { value: "1 lần/ngày", label: "1 lần/ngày" },
    { value: "2 lần/ngày", label: "2 lần/ngày" },
    { value: "3 lần/ngày", label: "3 lần/ngày" },
    { value: "4 lần/ngày", label: "4 lần/ngày" },
    { value: "Khi cần thiết", label: "Khi cần thiết" },
  ];

  const onSubmit = async (data: MedicationForm) => {
    try {
      // Backend sẽ tự động lấy userId từ JWT token
      // Không cần truyền userId vào đây nữa
      await createMedication({
        name: data.name,
        dosage: data.dosage,
        frequency: data.frequency,
        time: data.time,
        withFood: data.withFood,
        isActive: true,
        type: "MEDICATION",
      });

      setShowForm(false);
      form.reset();
      refetchMedications();
      refetchReminders();

      toast({
        title: "Thêm thuốc thành công!",
        description: "Lời nhắc đã được thiết lập.",
      });
    } catch (error) {
      toast({
        title: "Lỗi",
        description:
          error instanceof Error
            ? error.message
            : "Không thể thêm thuốc. Vui lòng thử lại.",
        variant: "destructive",
      });
    }
  };

  const toggleMedication = async (id: string, currentStatus: boolean) => {
    try {
      await updateMedication({
        id,
        isActive: !currentStatus,
      });

      refetchMedications();
      refetchReminders();

      toast({
        title: !currentStatus ? "Đã bật lời nhắc" : "Đã tắt lời nhắc",
        description: !currentStatus
          ? "Bạn sẽ nhận được thông báo uống thuốc."
          : "Lời nhắc đã được tạm dừng.",
      });
    } catch (error) {
      toast({
        title: "Lỗi",
        description:
          error instanceof Error
            ? error.message
            : "Không thể cập nhật trạng thái. Vui lòng thử lại.",
        variant: "destructive",
      });
    }
  };

  const deleteMedication = async (id: string) => {
    try {
      await deleteMedicationAction(id);
      refetchMedications();
      refetchReminders();

      toast({
        title: "Đã xóa thuốc",
        description: "Lời nhắc uống thuốc đã được hủy.",
      });
    } catch (error) {
      toast({
        title: "Lỗi",
        description:
          error instanceof Error
            ? error.message
            : "Không thể xóa thuốc. Vui lòng thử lại.",
        variant: "destructive",
      });
    }
  };

  const markAsTaken = async (id: string, name: string) => {
    try {
      await markAsTakenAction(id);
      refetchReminders();

      toast({
        title: "Đã uống thuốc!",
        description: `Đã ghi nhận bạn đã uống ${name}. Cảm ơn bạn đã tuân thủ đúng giờ.`,
      });
    } catch (error) {
      toast({
        title: "Lỗi",
        description:
          error instanceof Error
            ? error.message
            : "Không thể ghi nhận. Vui lòng thử lại.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-soft">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/" className="flex items-center gap-2">
              <ArrowLeft size={20} />
              Về trang chủ
            </Link>
          </Button>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-4">
              <Pill className="text-success" size={32} />
              <h1 className="text-3xl font-bold text-foreground">
                Nhắc uống thuốc
              </h1>
            </div>
            <p className="text-muted-foreground">
              Theo dõi và nhắc nhở uống thuốc đúng giờ, tuân thủ đúng liều lượng
            </p>
          </div>

          {/* Today's Medications */}
          <Card className="mb-6 border-0 shadow-elegant">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="text-primary" size={24} />
                Thuốc cần uống hôm nay
              </CardTitle>
            </CardHeader>
            <CardContent>
              {remindersLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="animate-spin text-primary" size={32} />
                </div>
              ) : (
                <div className="space-y-4">
                  {reminders
                    .filter((r) => !r.isTaken)
                    .map((reminder) => (
                      <div
                        key={reminder.id}
                        className="flex items-center justify-between p-4 rounded-lg bg-gradient-soft border"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-2 rounded-full bg-success/10">
                            <Pill className="text-success" size={20} />
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground">
                              {reminder.name}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {reminder.dosage} • {reminder.frequency}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Thời gian: {reminder.time}
                              {reminder.withFood && " • Uống cùng thức ăn"}
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() =>
                            markAsTaken(reminder.id, reminder.name)
                          }
                          disabled={actionLoading}
                          className="flex items-center gap-2"
                        >
                          {actionLoading ? (
                            <Loader2 className="animate-spin" size={16} />
                          ) : (
                            <CheckCircle2 size={16} />
                          )}
                          Đã uống
                        </Button>
                      </div>
                    ))}
                  {reminders.filter((r) => !r.isTaken).length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Pill size={48} className="mx-auto mb-4 opacity-50" />
                      <p>Chưa có thuốc nào cần uống hôm nay</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* All Medications */}
          <Card className="mb-6 border-0 shadow-elegant">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="text-primary" size={24} />
                  Tất cả thuốc đang theo dõi
                </CardTitle>
                <Button onClick={() => setShowForm(true)}>
                  <Plus size={20} className="mr-2" />
                  Thêm thuốc
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {medicationsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="animate-spin text-primary" size={32} />
                </div>
              ) : (
                <div className="space-y-4">
                  {medications.map((medication) => (
                    <div
                      key={medication.id}
                      className="flex items-center justify-between p-4 rounded-lg border"
                    >
                      <div className="flex items-center gap-4">
                        <Switch
                          checked={medication.isActive}
                          onCheckedChange={() =>
                            toggleMedication(medication.id, medication.isActive)
                          }
                        />
                        <div>
                          <h3 className="font-semibold text-foreground">
                            {medication.name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {medication.dosage} • {medication.frequency} •{" "}
                            {medication.time}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge
                              variant={
                                medication.isActive ? "default" : "secondary"
                              }
                            >
                              {medication.isActive
                                ? "Đang hoạt động"
                                : "Tạm dừng"}
                            </Badge>
                            {medication.withFood && (
                              <Badge variant="outline">Uống cùng thức ăn</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteMedication(medication.id)}
                        disabled={actionLoading}
                        className="text-destructive hover:text-destructive"
                      >
                        {actionLoading ? (
                          <Loader2 className="animate-spin" size={16} />
                        ) : (
                          <Trash2 size={16} />
                        )}
                      </Button>
                    </div>
                  ))}
                  {medications.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Pill size={48} className="mx-auto mb-4 opacity-50" />
                      <p>Chưa có thuốc nào được thêm</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Add Medication Form */}
          {showForm && (
            <Card className="border-0 shadow-elegant">
              <CardHeader>
                <CardTitle>Thêm thuốc mới</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tên thuốc *</FormLabel>
                            <FormControl>
                              <Input placeholder="VD: Paracetamol" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="dosage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Liều lượng *</FormLabel>
                            <FormControl>
                              <Input placeholder="VD: 500mg" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="frequency"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tần suất *</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Chọn tần suất" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {frequencies.map((freq) => (
                                  <SelectItem
                                    key={freq.value}
                                    value={freq.value}
                                  >
                                    {freq.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="time"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Thời gian uống *</FormLabel>
                            <FormControl>
                              <Input type="time" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="withFood"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Uống cùng thức ăn
                            </FormLabel>
                            <div className="text-sm text-muted-foreground">
                              Bật tính năng này nếu thuốc cần uống cùng bữa ăn
                            </div>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <div className="flex gap-4">
                      <Button
                        type="submit"
                        className="flex-1"
                        disabled={actionLoading}
                      >
                        {actionLoading ? (
                          <>
                            <Loader2 className="animate-spin mr-2" size={16} />
                            Đang thêm...
                          </>
                        ) : (
                          "Thêm thuốc"
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowForm(false)}
                        className="flex-1"
                        disabled={actionLoading}
                      >
                        Hủy
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <Card className="border-0 bg-success/5">
              <CardContent className="p-6 text-center">
                {statsLoading ? (
                  <Loader2
                    className="animate-spin mx-auto text-success"
                    size={24}
                  />
                ) : (
                  <>
                    <div className="text-2xl font-bold text-success mb-2">
                      {stats?.totalActive || 0}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Thuốc đang theo dõi
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
            <Card className="border-0 bg-primary/5">
              <CardContent className="p-6 text-center">
                {statsLoading ? (
                  <Loader2
                    className="animate-spin mx-auto text-primary"
                    size={24}
                  />
                ) : (
                  <>
                    <div className="text-2xl font-bold text-primary mb-2">
                      {stats?.complianceRate || 0}%
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Tỷ lệ tuân thủ
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
            <Card className="border-0 bg-primary-dark/5">
              <CardContent className="p-6 text-center">
                {statsLoading ? (
                  <Loader2
                    className="animate-spin mx-auto text-primary-dark"
                    size={24}
                  />
                ) : (
                  <>
                    <div className="text-2xl font-bold text-primary-dark mb-2">
                      {stats?.weeklyIntakeCount || 0}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Lần uống tuần này
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MedicationReminder;
