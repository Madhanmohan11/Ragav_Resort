import { auth, db } from "./firebase";
import {
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  collection,
  addDoc,
  getDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  onSnapshot
} from "firebase/firestore";

export interface User {
  email: string;
  role: "admin" | "watchman";
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
  status: "checked-in" | "checked-out";
  createdAt: string;
  createdBy: string;
}

// -------- AUTH SERVICE --------
export class AuthService {
  static async login(email: string, password: string): Promise<User | null> {
    const res = await signInWithEmailAndPassword(auth, email, password);

    const userDoc = await getDoc(doc(db, "users", res.user.uid));
    if (!userDoc.exists()) return null;

    const data = userDoc.data() as any;

    // 🔥 Normalize & clean values
    const user: User = {
      email: String(data.email || "").trim(),
      name: String(data.name || "").trim(),
      role: String(data.role || "").trim() === "admin" ? "admin" : "watchman"
    };

    localStorage.setItem("currentUser", JSON.stringify(user));
    return user;
  }

  static logout() {
    localStorage.removeItem("currentUser");
    return signOut(auth);
  }

  static getCurrentUser(): User | null {
    const u = localStorage.getItem("currentUser");
    if (!u) return null;

    const user = JSON.parse(u);

    return {
      email: String(user.email || "").trim(),
      name: String(user.name || "").trim(),
      role: String(user.role || "").trim()
    } as User;
  }

  static isAuthenticated() {
    return !!this.getCurrentUser();
  }
}

// -------- GUEST SERVICE --------
export class GuestService {
  static async getAllGuests(): Promise<GuestEntry[]> {
    const snap = await getDocs(collection(db, "guests"));
    return snap.docs.map(d => ({
      id: d.id,
      ...(d.data() as GuestEntry),
    }));
  }

  // REALTIME LISTENER
  static listenGuests(callback: (guests: GuestEntry[]) => void) {
    return onSnapshot(collection(db, "guests"), (snapshot) => {
      const guests = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as GuestEntry)
      }));

      callback(guests);
    });
  }

  static async addGuest(
    guest: Omit<GuestEntry, "id" | "createdAt" | "createdBy" | "status">
  ) {
    const user = AuthService.getCurrentUser();

    const newGuest = {
      ...guest,
      status: "checked-in",
      createdAt: new Date().toISOString(),
      createdBy: user?.email || "unknown"
    };

    await addDoc(collection(db, "guests"), newGuest);
  }

  static async updateGuestStatus(
    id: string,
    status: "checked-in" | "checked-out"
  ) {
    await updateDoc(doc(db, "guests", id), {
      status,
      checkOutDate:
        status === "checked-out"
          ? new Date().toLocaleDateString("en-GB")
          : null
    });
  }

  static async deleteGuest(id: string) {
    await deleteDoc(doc(db, "guests", id));
  }

  static async deleteGuests(ids: string[]) {
    await Promise.all(ids.map((id) => deleteDoc(doc(db, "guests", id))));
  }

  static async getStats() {
    const guests = await this.getAllGuests();
    return {
      total: guests.length,
      checkedIn: guests.filter(g => g.status === "checked-in").length,
      checkedOut: guests.filter(g => g.status === "checked-out").length
    };
  }
}
