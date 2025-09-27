// Frontend authentication and data management
export interface User {
  email: string;
  role: 'admin' | 'watchman';
  name: string;
}

export interface GuestEntry {
  id: string;
  fullName: string;
  guestCount: number;
  aadharNumber: string;
  phoneNumber: string;
  address: string;
  checkInDate?: string;
  checkOutDate?: string;
  status: 'checked-in' | 'checked-out';
  createdAt: string;
  createdBy: string;
}

// Mock users for demo
const DEMO_USERS = {
  'admin@demo.com': { email: 'admin@demo.com', role: 'admin' as const, name: 'Admin User' },
  'watchman@demo.com': { email: 'watchman@demo.com', role: 'watchman' as const, name: 'Security Guard' },
};

export class AuthService {
  static login(email: string, password: string): User | null {
    const user = DEMO_USERS[email as keyof typeof DEMO_USERS];
    if (user) {
      localStorage.setItem('currentUser', JSON.stringify(user));
      return user;
    }
    return null;
  }

  static logout(): void {
    localStorage.removeItem('currentUser');
  }

  static getCurrentUser(): User | null {
    const userStr = localStorage.getItem('currentUser');
    return userStr ? JSON.parse(userStr) : null;
  }

  static isAuthenticated(): boolean {
    return !!this.getCurrentUser();
  }
}

export class GuestService {
  private static STORAGE_KEY = 'guestEntries';

  static getAllGuests(): GuestEntry[] {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  static addGuest(
  guestData: Omit<GuestEntry, 'id' | 'createdAt' | 'createdBy' | 'status'>
): GuestEntry {
  const guests = this.getAllGuests();
  const currentUser = AuthService.getCurrentUser();

  const newGuest: GuestEntry = {
    ...guestData,
    id: Date.now().toString(),
    status: 'checked-in',
    createdAt: new Date().toISOString(),
    createdBy: currentUser?.email || 'unknown',  
  };

  guests.push(newGuest);
  this.saveGuests(guests);
  window.dispatchEvent(new CustomEvent('guestsUpdated'));

  return newGuest;
}

static updateGuestStatus(
  id: string,
  status: 'checked-in' | 'checked-out'
): void {
  const guests = this.getAllGuests();
  const guestIndex = guests.findIndex((g) => g.id === id);

  if (guestIndex !== -1) {
    guests[guestIndex].status = status;
    if (status === 'checked-out') {
      guests[guestIndex].checkOutDate = new Date().toLocaleDateString("en-GB"); // 👈 only date
    }
    this.saveGuests(guests);
    window.dispatchEvent(new CustomEvent('guestsUpdated'));
  }
}

  /** 🔥 NEW: Delete a single guest */
  static deleteGuest(id: string): void {
    const guests = this.getAllGuests().filter((g) => g.id !== id);
    this.saveGuests(guests);
    window.dispatchEvent(new CustomEvent('guestsUpdated'));
  }

  /** 🔥 NEW: Delete multiple guests at once */
  static deleteGuests(ids: string[]): void {
    const guests = this.getAllGuests().filter((g) => !ids.includes(g.id));
    this.saveGuests(guests);
    window.dispatchEvent(new CustomEvent('guestsUpdated'));
  }

  private static saveGuests(guests: GuestEntry[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(guests));
  }

  static searchGuests(query: string): GuestEntry[] {
    const guests = this.getAllGuests();
    const lowercaseQuery = query.toLowerCase();

    return guests.filter(
      (guest) =>
        guest.fullName.toLowerCase().includes(lowercaseQuery) ||
        guest.phoneNumber.includes(query) ||
        guest.aadharNumber.includes(query)
    );
  }

  static getStats() {
    const guests = this.getAllGuests();
    return {
      total: guests.length,
      checkedIn: guests.filter((g) => g.status === 'checked-in').length,
      checkedOut: guests.filter((g) => g.status === 'checked-out').length,
    };
  }
}

