import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { CalendarIcon, LogOut, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { AuthService, GuestService } from "@/lib/auth";
import ProtectedRoute from "@/components/ProtectedRoute";

const WatchmanForm = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    guestCount: "",
    aadharNumber: "",
    phoneNumber: "",
    address: "",
    checkInDate: null as Date | null,
    checkOutDate: null as Date | null,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [bookedDates, setBookedDates] = useState<Date[]>([]);
  const { toast } = useToast();
  const user = AuthService.getCurrentUser();

  // 🔥 Load booked dates from Firestore
  useEffect(() => {
    GuestService.getAllGuests().then((data) => {
      const dates: Date[] = [];

      data.forEach((g) => {
        if (g.checkInDate && g.checkOutDate) {
          const start = new Date(g.checkInDate);
          const end = new Date(g.checkOutDate);

          let current = new Date(start);
          while (current <= end) {
            dates.push(new Date(current));
            current.setDate(current.getDate() + 1);
          }
        }
      });

      setBookedDates(dates);
    });
  }, []);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    const {
      fullName,
      guestCount,
      aadharNumber,
      phoneNumber,
      address,
      checkInDate,
      checkOutDate,
    } = formData;

    if (!fullName.trim()) newErrors.fullName = "Full Name is required.";
    if (guestCount === "" || guestCount < 1) {
      newErrors.guestCount = "Number of guests must be at least 1.";
    }

    if (!aadharNumber.trim())
      newErrors.aadharNumber = "Aadhar Number is required.";
    else if (!/^\d{12}$/.test(aadharNumber))
      newErrors.aadharNumber = "Aadhar must be exactly 12 digits.";
    if (!phoneNumber.trim())
      newErrors.phoneNumber = "Phone Number is required.";
    else if (!/^(\+91)?[6-9]\d{9}$/.test(phoneNumber))
      newErrors.phoneNumber = "Invalid Indian phone number.";
    if (!address.trim()) newErrors.address = "Address is required.";
    if (!checkInDate) newErrors.checkInDate = "Check-in date is required.";
    if (!checkOutDate) newErrors.checkOutDate = "Check-out date is required.";
    else if (checkInDate && checkOutDate < checkInDate)
      newErrors.checkOutDate = "Check-out cannot be before check-in.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);

    try {
      const guestData = {
        ...formData,
        checkInDate: formData.checkInDate
          ? format(formData.checkInDate, "yyyy-MM-dd")
          : null,
        checkOutDate: formData.checkOutDate
          ? format(formData.checkOutDate, "yyyy-MM-dd")
          : null,
      };

      await GuestService.addGuest(guestData);

      toast({
        title: "Guest Registered",
        description: `${formData.fullName} has been registered successfully.`,
      });

      setFormData({
        fullName: "",
        guestCount: "",
        aadharNumber: "",
        phoneNumber: "",
        address: "",
        checkInDate: null,
        checkOutDate: null,
      });
      setErrors({});
    } catch {
      toast({
        title: "Error",
        description: "Failed to register guest. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    AuthService.logout();
    window.location.href = "/";
  };

  return (
    <ProtectedRoute requiredRole="watchman">
      <div className="min-h-screen bg-gray-100 text-gray-900">
        {/* Header */}
        <header className="bg-white shadow-md border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-center gap-4 md:gap-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Guest Registration</h1>
                <p className="text-sm text-gray-500">Welcome {user?.name}</p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="gap-2 border-gray-300 bg-white text-gray-700"
            >
              <LogOut className="w-4 h-4" /> Logout
            </Button>
          </div>
        </header>

        {/* Form */}
        <main className="max-w-4xl mx-auto px-4 py-8">
          <Card className="shadow-md border bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <Users className="w-5 h-5" /> New Guest Entry
              </CardTitle>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* LEFT */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Full Name *</Label>
                      <Input
                        value={formData.fullName}
                        onChange={(e) =>
                          handleInputChange("fullName", e.target.value)
                        }
                        className={errors.fullName && "border-red-500"}
                      />
                      {errors.fullName && (
                        <p className="text-red-500 text-sm">
                          {errors.fullName}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Guests *</Label>
                      <Input
                        type="number"
                        min={1}
                        value={formData.guestCount}
                        onChange={(e) =>
                          handleInputChange(
                            "guestCount",
                            e.target.value === "" ? "" : Number(e.target.value)
                          )
                        }
                        className={errors.guestCount && "border-red-500"}
                      />

                      {errors.guestCount && (
                        <p className="text-red-500 text-sm">
                          {errors.guestCount}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Aadhar *</Label>
                      <Input
                        value={formData.aadharNumber}
                        onChange={(e) =>
                          handleInputChange("aadharNumber", e.target.value)
                        }
                        className={errors.aadharNumber && "border-red-500"}
                      />
                      {errors.aadharNumber && (
                        <p className="text-red-500 text-sm">
                          {errors.aadharNumber}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Phone *</Label>
                      <Input
                        value={formData.phoneNumber}
                        onChange={(e) =>
                          handleInputChange("phoneNumber", e.target.value)
                        }
                        className={errors.phoneNumber && "border-red-500"}
                      />
                      {errors.phoneNumber && (
                        <p className="text-red-500 text-sm">
                          {errors.phoneNumber}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* RIGHT */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Address *</Label>
                      <Textarea
                        value={formData.address}
                        onChange={(e) =>
                          handleInputChange("address", e.target.value)
                        }
                        className={errors.address && "border-red-500"}
                      />
                      {errors.address && (
                        <p className="text-red-500 text-sm">{errors.address}</p>
                      )}
                    </div>

                    {/* Check-in Calendar */}
                    <div className="space-y-2">
                      <Label>Check-in *</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start",
                              errors.checkInDate && "border-red-500"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formData.checkInDate
                              ? format(formData.checkInDate, "PPP")
                              : "Select date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent>
                          <Calendar
                            mode="single"
                            selected={formData.checkInDate}
                            onSelect={(d) =>
                              handleInputChange("checkInDate", d || null)
                            }
                            disabled={(date) =>
                              date <
                                new Date(new Date().setHours(0, 0, 0, 0)) ||
                              bookedDates.some(
                                (d) => d.toDateString() === date.toDateString()
                              )
                            }
                            modifiers={{ booked: bookedDates }}
                            modifiersClassNames={{
                              booked: "bg-red-500 text-white hover:bg-red-600",
                            }}
                          />
                        </PopoverContent>
                      </Popover>
                      {errors.checkInDate && (
                        <p className="text-red-500 text-sm">
                          {errors.checkInDate}
                        </p>
                      )}
                    </div>

                    {/* Check-out Calendar */}
                    <div className="space-y-2">
                      <Label>Check-out *</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start",
                              errors.checkOutDate && "border-red-500"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formData.checkOutDate
                              ? format(formData.checkOutDate, "PPP")
                              : "Select date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent>
                          <Calendar
                            mode="single"
                            selected={formData.checkOutDate}
                            onSelect={(d) =>
                              handleInputChange("checkOutDate", d || null)
                            }
                            disabled={(date) =>
                              !formData.checkInDate ||
                              date < formData.checkInDate ||
                              bookedDates.some(
                                (d) => d.toDateString() === date.toDateString()
                              )
                            }
                            modifiers={{ booked: bookedDates }}
                            modifiersClassNames={{
                              booked: "bg-red-500 text-white hover:bg-red-600",
                            }}
                          />
                        </PopoverContent>
                      </Popover>
                      {errors.checkOutDate && (
                        <p className="text-red-500 text-sm">
                          {errors.checkOutDate}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-bold"
                >
                  {isLoading ? "Registering..." : "Register Guest"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default WatchmanForm;
