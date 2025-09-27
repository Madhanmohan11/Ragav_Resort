import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Download,
  FileText,
  LogOut,
  Shield,
  Users,
  Trash2,
  Eye,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AuthService, GuestService, type GuestEntry } from "@/lib/auth";
import ProtectedRoute from "@/components/ProtectedRoute";
import * as XLSX from "xlsx";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const AdminDashboard = () => {
  const [guests, setGuests] = useState<GuestEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMonth, setFilterMonth] = useState<string>("");
  const [filterYear, setFilterYear] = useState<string>("");
  const [selectedGuests, setSelectedGuests] = useState<Set<string>>(new Set());
  const [deleteGuestId, setDeleteGuestId] = useState<string | null>(null);
  const [showDeletePopover, setShowDeletePopover] = useState(false);
  const [showBulkDeletePopover, setShowBulkDeletePopover] = useState(false);

  const { toast } = useToast();
  const navigate = useNavigate();
  const user = AuthService.getCurrentUser();

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "Not set";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-GB");
  };

  const loadGuests = async () => {
    try {
      const data = await GuestService.getAllGuests();
      setGuests(data);
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Failed to load guests." });
    }
  };

  useEffect(() => {
    loadGuests();
    window.addEventListener("guestsUpdated", loadGuests);
    return () => window.removeEventListener("guestsUpdated", loadGuests);
  }, []);

  const availableYears = useMemo(() => {
  const years = new Set<number>();

  guests.forEach((g) => {
    const inDate = g.checkInDate ? new Date(g.checkInDate) : null;
    const outDate = g.checkOutDate ? new Date(g.checkOutDate) : null;

    if (inDate && !isNaN(inDate.getTime())) {
      years.add(inDate.getFullYear());
    }
    if (outDate && !isNaN(outDate.getTime())) {
      years.add(outDate.getFullYear());
    }
  });

  return Array.from(years).sort((a, b) => b - a);
}, [guests]);


 const filteredGuests = useMemo(() => {
  return guests.filter((g) => {
    const matchesSearch =
      searchTerm === "" ||
      g.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.aadharNumber.includes(searchTerm) ||
      g.phoneNumber.includes(searchTerm);

    const matchesMonth =
  filterMonth === "" ||
  (
    (g.checkInDate &&
      !isNaN(new Date(g.checkInDate).getTime()) &&
      new Date(g.checkInDate).getMonth() + 1 === Number(filterMonth)) ||
    (g.checkOutDate &&
      !isNaN(new Date(g.checkOutDate).getTime()) &&
      new Date(g.checkOutDate).getMonth() + 1 === Number(filterMonth))
  );


    const matchesYear =
      filterYear === "" ||
      (
        (g.checkInDate &&
          !isNaN(new Date(g.checkInDate).getTime()) &&
          new Date(g.checkInDate).getFullYear() === Number(filterYear)) ||
        (g.checkOutDate &&
          !isNaN(new Date(g.checkOutDate).getTime()) &&
          new Date(g.checkOutDate).getFullYear() === Number(filterYear))
      );

    return matchesSearch && matchesMonth && matchesYear;
  });
}, [guests, searchTerm, filterMonth, filterYear]);


  const stats = useMemo(() => ({ total: filteredGuests.length }), [filteredGuests]);

  const handleLogout = () => {
    AuthService.logout();
    navigate("/");
  };

  // Single delete handler
  const confirmDeleteGuest = async () => {
    if (!deleteGuestId) return;
    try {
      await GuestService.deleteGuest(deleteGuestId);
      setGuests((prev) => prev.filter((g) => g.id !== deleteGuestId));
      setSelectedGuests((prev) => {
        const copy = new Set(prev);
        copy.delete(deleteGuestId);
        return copy;
      });
      toast({ title: "Deleted", description: "Guest has been deleted." });
      window.dispatchEvent(new Event("guestsUpdated"));
      setDeleteGuestId(null);
      setShowDeletePopover(false);
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Failed to delete guest." });
    }
  };

  // Bulk delete handler
  const confirmBulkDelete = async () => {
    if (selectedGuests.size === 0) return;

    try {
      await Promise.all(
        Array.from(selectedGuests).map((id) => GuestService.deleteGuest(id))
      );
      setGuests((prev) => prev.filter((g) => !selectedGuests.has(g.id)));
      setSelectedGuests(new Set());
      toast({ title: "Deleted", description: "Selected guests have been deleted." });
      window.dispatchEvent(new Event("guestsUpdated"));
      setShowBulkDeletePopover(false);
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Failed to delete selected guests." });
    }
  };

  const toggleSelectGuest = (id: string) => {
    setSelectedGuests((prev) => {
      const copy = new Set(prev);
      if (copy.has(id)) copy.delete(id);
      else copy.add(id);
      return copy;
    });
  };

  const toggleSelectAll = () => {
    if (selectedGuests.size === filteredGuests.length) {
      setSelectedGuests(new Set());
    } else {
      setSelectedGuests(new Set(filteredGuests.map((g) => g.id)));
    }
  };

  const handleExportExcel = () => {
    if (filteredGuests.length === 0) {
      toast({ title: "No Data", description: "There are no guests to export." });
      return;
    }

    const data = filteredGuests.map((g, i) => ({
      No: i + 1,
      "Full Name": g.fullName,
      "Aadhar No": g.aadharNumber,
      Address: g.address,
      Phone: g.phoneNumber,
      Guests: g.guestCount,
      "Check-In": formatDate(g.checkInDate),
      "Check-Out": formatDate(g.checkOutDate),
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const maxColumnLengths = Object.keys(data[0]).map((key) => {
      const lengths = data.map((row) => (row[key] ? String(row[key]).length : 0));
      lengths.push(key.length);
      return Math.max(...lengths);
    });
    worksheet["!cols"] = maxColumnLengths.map((w) => ({ wch: w + 2 }));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Guests");
    XLSX.writeFile(workbook, "guest_list.xlsx");

    toast({ title: "Export Completed", description: "Excel exported successfully." });
  };

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="min-h-screen bg-gray-100 text-gray-900">
        {/* Header */}
        <header className="bg-white shadow-md border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-gray-700" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Admin Dashboard</h1>
                <p className="text-sm text-gray-500">Welcome {user?.name}</p>
              </div>
            </div>
            <Button
              variant="outline"
              className="gap-2 text-gray-700 border-gray-400"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </header>

        {/* Main */}
        <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
            <Card className="bg-white shadow-md border">
              <CardContent className="p-6 flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Guests</p>
                  <p className="text-2xl text-gray-900 font-bold">{stats.total}</p>
                </div>
                <Users className="w-8 h-8 text-gray-700" />
              </CardContent>
            </Card>
          </div>

          {/* Guest Table */}
          <Card className="bg-white shadow-md border">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <FileText className="w-5 h-5" />
                  Guest List
                </CardTitle>
                <div className="flex flex-col sm:flex-row gap-2 items-center">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <Input
                      placeholder="Search guests..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-full sm:w-64 bg-white border-gray-300 text-gray-900"
                    />
                  </div>

                  <select
                    value={filterMonth}
                    onChange={(e) => setFilterMonth(e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                  >
                    <option value="">All Months</option>
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {new Date(0, i).toLocaleString("default", { month: "long" })}
                      </option>
                    ))}
                  </select>

                  <select
                    value={filterYear}
                    onChange={(e) => setFilterYear(e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                  >
                    <option value="">All Years</option>
                    {availableYears.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleExportExcel}
                      variant="outline"
                      className="gap-2 text-gray-700 border-gray-400"
                    >
                      <Download className="w-4 h-4" />
                      Excel
                    </Button>

                    {/* Bulk Delete Popover */}
                    <Popover open={showBulkDeletePopover} onOpenChange={setShowBulkDeletePopover}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="destructive"
                          className="gap-2"
                          disabled={selectedGuests.size === 0}
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete Selected
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="bg-white p-4 flex flex-col gap-2">
                        <p>Are you sure you want to delete all selected guests?</p>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setShowBulkDeletePopover(false)}>
                            Cancel
                          </Button>
                          <Button variant="destructive" onClick={confirmBulkDelete}>
                            Delete
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <div className="overflow-x-auto">
                <Table className="text-gray-900">
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <input
                          type="checkbox"
                          checked={selectedGuests.size === filteredGuests.length && filteredGuests.length > 0}
                          onChange={toggleSelectAll}
                        />
                      </TableHead>
                      <TableHead>No</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Aadhar No</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Guests</TableHead>
                      <TableHead>Check-in</TableHead>
                      <TableHead>Check-out</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredGuests.map((guest, index) => (
                      <TableRow key={guest.id} className="hover:bg-gray-100">
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedGuests.has(guest.id)}
                            onChange={() => toggleSelectGuest(guest.id)}
                          />
                        </TableCell>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{guest.fullName}</TableCell>
                        <TableCell>{guest.aadharNumber}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="p-1"
                                  title="View Full Address"
                                >
                                  <Eye className="w-4 h-4 text-gray-600" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="bg-white text-gray-900 p-3 max-w-xs">
                                <p className="break-words">{guest.address}</p>
                              </PopoverContent>
                            </Popover>
                          </div>
                        </TableCell>
                        <TableCell>{guest.phoneNumber}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{guest.guestCount}</Badge>
                        </TableCell>
                        <TableCell>{formatDate(guest.checkInDate)}</TableCell>
                        <TableCell>{formatDate(guest.checkOutDate)}</TableCell>

                        {/* Single Delete Popover */}
                        <TableCell>
                          <Popover open={deleteGuestId === guest.id && showDeletePopover} onOpenChange={(open) => setShowDeletePopover(open)}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="destructive"
                                size="sm"
                                className="flex items-center gap-1"
                                onClick={() => {
                                  setDeleteGuestId(guest.id);
                                  setShowDeletePopover(true);
                                }}
                              >
                                <Trash2 className="w-4 h-4" /> Delete
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="bg-white p-4 flex flex-col gap-2">
                              <p>Are you sure you want to delete this guest?</p>
                              <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setShowDeletePopover(false)}>
                                  Cancel
                                </Button>
                                <Button variant="destructive" onClick={confirmDeleteGuest}>
                                  Delete
                                </Button>
                              </div>
                            </PopoverContent>
                          </Popover>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {filteredGuests.length === 0 && (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    {guests.length === 0
                      ? "No guests have been added yet."
                      : "No guests found matching your search."}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default AdminDashboard;
