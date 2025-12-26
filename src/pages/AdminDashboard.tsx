import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  RefreshCcw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AuthService, GuestService, type GuestEntry } from "@/lib/auth";
import ProtectedRoute from "@/components/ProtectedRoute";
import * as XLSX from "xlsx";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const AdminDashboard = () => {
  const [guests, setGuests] = useState<GuestEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMonth, setFilterMonth] = useState<string>("");
  const [filterYear, setFilterYear] = useState<string>("");
  const [selectedGuests, setSelectedGuests] = useState<Set<string>>(new Set());
  const [deleteGuestId, setDeleteGuestId] = useState<string | null>(null);
  const [showDeletePopover, setShowDeletePopover] = useState(false);
  const [showBulkDeletePopover, setShowBulkDeletePopover] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const { toast } = useToast();
  const navigate = useNavigate();
  const user = AuthService.getCurrentUser();

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "Not set";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-GB");
  };

  useEffect(() => {
    const unsubscribe = GuestService.listenGuests((data) => setGuests(data));
    return () => unsubscribe();
  }, []);

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    guests.forEach((g) => {
      if (g.checkInDate) years.add(new Date(g.checkInDate).getFullYear());
      if (g.checkOutDate) years.add(new Date(g.checkOutDate).getFullYear());
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [guests]);

  const filteredGuests = useMemo(() => {
    const result = guests.filter((g) => {
      const matchesSearch =
        searchTerm === "" ||
        g.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.aadharNumber.includes(searchTerm) ||
        g.phoneNumber.includes(searchTerm);

      const matchesMonth =
        filterMonth === "" ||
        (g.checkInDate &&
          new Date(g.checkInDate).getMonth() + 1 === Number(filterMonth)) ||
        (g.checkOutDate &&
          new Date(g.checkOutDate).getMonth() + 1 === Number(filterMonth));

      const matchesYear =
        filterYear === "" ||
        (g.checkInDate &&
          new Date(g.checkInDate).getFullYear() === Number(filterYear)) ||
        (g.checkOutDate &&
          new Date(g.checkOutDate).getFullYear() === Number(filterYear));

      return matchesSearch && matchesMonth && matchesYear;
    });

    setCurrentPage(1);
    return result;
  }, [guests, searchTerm, filterMonth, filterYear]);

  const totalPages = Math.ceil(filteredGuests.length / rowsPerPage);

  const paginatedGuests = filteredGuests.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const stats = useMemo(() => {
    return {
      total: guests.length,
      thisMonth: guests.filter(
        (g) =>
          g.checkInDate &&
          new Date(g.checkInDate).getMonth() === new Date().getMonth()
      ).length,
      thisYear: guests.filter(
        (g) =>
          g.checkInDate &&
          new Date(g.checkInDate).getFullYear() === new Date().getFullYear()
      ).length,
    };
  }, [guests]);

  const handleLogout = () => {
    AuthService.logout();
    navigate("/");
  };

  const confirmDeleteGuest = async () => {
    if (!deleteGuestId) return;
    try {
      await GuestService.deleteGuest(deleteGuestId);
      toast({ title: "Deleted", description: "Guest removed successfully" });
      setDeleteGuestId(null);
      setShowDeletePopover(false);
    } catch {
      toast({ title: "Error", description: "Failed to delete guest" });
    }
  };

  const confirmBulkDelete = async () => {
    if (selectedGuests.size === 0) return;
    try {
      await Promise.all(
        [...selectedGuests].map((id) => GuestService.deleteGuest(id))
      );
      setSelectedGuests(new Set());
      toast({ title: "Deleted", description: "Selected guests deleted" });
      setShowBulkDeletePopover(false);
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete selected guests",
      });
    }
  };

  const toggleSelectGuest = (id: string) => {
    setSelectedGuests((prev) => {
      const copy = new Set(prev);
      copy.has(id) ? copy.delete(id) : copy.add(id);
      return copy;
    });
  };

  const toggleSelectAll = () => {
    if (selectedGuests.size === paginatedGuests.length)
      setSelectedGuests(new Set());
    else setSelectedGuests(new Set(paginatedGuests.map((g) => g.id)));
  };

  const handleExportExcel = () => {
    if (!filteredGuests.length)
      return toast({ title: "No Data", description: "Nothing to export" });

    const data = filteredGuests.map((g, i) => ({
      No: i + 1,
      Name: g.fullName,
      Aadhar: g.aadharNumber,
      Address: g.address,
      Phone: g.phoneNumber,
      Guests: g.guestCount,
      CheckIn: formatDate(g.checkInDate),
      CheckOut: formatDate(g.checkOutDate),
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    ws["!cols"] = Object.keys(data[0]).map(() => ({ wch: 22 }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Guests");
    XLSX.writeFile(wb, "Guest_Report.xlsx");
  };

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="min-h-screen bg-gray-100">
        {/* HEADER */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-indigo-600" />
              <div>
                <h1 className="text-xl font-bold">Admin Dashboard</h1>
                <p className="text-sm text-gray-500">Welcome {user?.name}</p>
              </div>
            </div>

            <Button variant="outline" onClick={handleLogout} className="gap-2">
              <LogOut size={18} /> Logout
            </Button>
          </div>
        </header>

        {/* MAIN */}
        <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
          {/* STATS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-gray-500">Total Guests</p>
                <h2 className="text-3xl font-bold">{stats.total}</h2>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-gray-500">This Month</p>
                <h2 className="text-3xl font-bold">{stats.thisMonth}</h2>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-gray-500">This Year</p>
                <h2 className="text-3xl font-bold">{stats.thisYear}</h2>
              </CardContent>
            </Card>
          </div>

          {/* TABLE */}
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row justify-between gap-4">
                <CardTitle className="flex items-center gap-2">
                  <FileText /> Guest Records
                </CardTitle>

                <div className="flex flex-wrap gap-2">
                  <div className="relative">
                    <Search
                      size={16}  
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                    />
                    <Input
                      placeholder="Search guest..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 w-64"
                    />
                  </div>

                  <select
                    value={filterMonth}
                    onChange={(e) => setFilterMonth(e.target.value)}
                    className="border px-3 py-2 rounded"
                  >
                    <option value="">All Months</option>
                    {Array.from({ length: 12 }).map((_, i) => (
                      <option value={i + 1} key={i}>
                        {new Date(0, i).toLocaleString("default", {
                          month: "long",
                        })}
                      </option>
                    ))}
                  </select>

                  <select
                    value={filterYear}
                    onChange={(e) => setFilterYear(e.target.value)}
                    className="border px-3 py-2 rounded"
                  >
                    <option value="">All Years</option>
                    {availableYears.map((y) => (
                      <option key={y}>{y}</option>
                    ))}
                  </select>

                  <Button
                    variant="secondary"
                    className="gap-1"
                    onClick={() => {
                      setFilterMonth("");
                      setFilterYear("");
                      setSearchTerm("");
                    }}
                  >
                    <RefreshCcw size={16} /> Reset
                  </Button>

                  <Button
                    variant="outline"
                    className="gap-1"
                    onClick={handleExportExcel}
                  >
                    <Download size={16} /> Export
                  </Button>

                  <Popover
                    open={showBulkDeletePopover}
                    onOpenChange={setShowBulkDeletePopover}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="destructive"
                        disabled={!selectedGuests.size}
                        className="gap-1"
                      >
                        <Trash2 size={16} /> Delete Selected
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent>
                      <p>Delete all selected guests?</p>
                      <div className="flex justify-end gap-2 mt-2">
                        <Button
                          variant="outline"
                          onClick={() => setShowBulkDeletePopover(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={confirmBulkDelete}
                        >
                          Confirm
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <div className="overflow-x-auto max-h-[70vh]">
                <Table>
                  <TableHeader className="sticky top-0 bg-white shadow">
                    <TableRow>
                      <TableHead>
                        <input
                          type="checkbox"
                          checked={
                            selectedGuests.size === paginatedGuests.length &&
                            paginatedGuests.length > 0
                          }
                          onChange={toggleSelectAll}
                        />
                      </TableHead>
                      <TableHead>No</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Aadhar</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Guests</TableHead>
                      <TableHead>Check-in</TableHead>
                      <TableHead>Check-out</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {paginatedGuests.map((guest, index) => (
                      <TableRow key={guest.id}>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedGuests.has(guest.id)}
                            onChange={() => toggleSelectGuest(guest.id)}
                          />
                        </TableCell>

                        <TableCell>
                          {(currentPage - 1) * rowsPerPage + index + 1}
                        </TableCell>

                        <TableCell>{guest.fullName}</TableCell>
                        <TableCell>{guest.aadharNumber}</TableCell>

                        <TableCell>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="p-1"
                              >
                                <Eye size={16} />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="max-w-xs">
                              <p>{guest.address}</p>
                            </PopoverContent>
                          </Popover>
                        </TableCell>

                        <TableCell>{guest.phoneNumber}</TableCell>
                        <TableCell>
                          <Badge>{guest.guestCount}</Badge>
                        </TableCell>
                        <TableCell>{formatDate(guest.checkInDate)}</TableCell>
                        <TableCell>{formatDate(guest.checkOutDate)}</TableCell>

                        <TableCell>
                          <Popover
                            open={
                              deleteGuestId === guest.id && showDeletePopover
                            }
                            onOpenChange={setShowDeletePopover}
                          >
                            <PopoverTrigger asChild>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => setDeleteGuestId(guest.id)}
                                className="gap-1"
                              >
                                <Trash2 size={14} /> Delete
                              </Button>
                            </PopoverTrigger>

                            <PopoverContent>
                              <p>Delete this guest?</p>
                              <div className="flex justify-end gap-2 mt-2">
                                <Button
                                  variant="outline"
                                  onClick={() => setShowDeletePopover(false)}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  variant="destructive"
                                  onClick={confirmDeleteGuest}
                                >
                                  Confirm
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

              {/* PAGINATION WITH PAGE SIZE SELECTOR */}

              {filteredGuests.length > 0 && (
                <div
                  className="
                      mt-4 
                      bg-white 
                      sticky bottom-0 
                      p-3 
                      rounded-md 
                      border-t 
                      flex flex-col md:flex-row 
                      items-center 
                      md:justify-between 
                      gap-3
                    "
                >
                  {/* Rows Per Page */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">
                      Rows per page:
                    </span>
                    <select
                      value={rowsPerPage}
                      onChange={(e) => {
                        setRowsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="border rounded px-2 py-1 text-sm"
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                  </div>

                  {/* Page Info */}
                  <p className="text-sm text-gray-600 text-center">
                    Page {currentPage} of {totalPages || 1}
                  </p>

                  {/* Prev Next */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => p - 1)}
                      className="h-9 w-10 flex items-center justify-center"
                    >
                      <ChevronLeft />
                    </Button>

                    <Button
                      variant="outline"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((p) => p + 1)}
                      className="h-9 w-10 flex items-center justify-center"
                    >
                      <ChevronRight />
                    </Button>
                  </div>
                </div>
              )}

              {!filteredGuests.length && (
                <div className="text-center py-8 text-gray-500">
                  <Users className="mx-auto w-10 h-10 mb-3" />
                  No guest records found
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
