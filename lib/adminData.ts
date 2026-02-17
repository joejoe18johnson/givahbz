/**
 * Mock data for admin dashboard (users and donations).
 * In production these would come from your database.
 */

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: "user" | "admin";
  verified: boolean;
  idVerified: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface AdminDonation {
  id: string;
  campaignId: string;
  campaignTitle: string;
  amount: number;
  donorEmail: string;
  donorName: string;
  anonymous: boolean;
  method: "credit-card" | "bank" | "digiwallet" | "paypal";
  status: "completed" | "pending" | "failed";
  createdAt: string;
}

export const adminUsers: AdminUser[] = [
  { id: "u1", email: "admin@givahbz.com", name: "Admin User", role: "admin", verified: true, idVerified: true, createdAt: "2025-01-01", lastLoginAt: "2026-02-17T10:00:00Z" },
  { id: "u2", email: "maria.g@email.com", name: "Maria Gonzalez", role: "user", verified: true, idVerified: true, createdAt: "2026-02-05", lastLoginAt: "2026-02-16T14:30:00Z" },
  { id: "u3", email: "dangriga.relief@org.bz", name: "Dangriga Community Relief", role: "user", verified: true, idVerified: true, createdAt: "2026-01-28", lastLoginAt: "2026-02-15T09:00:00Z" },
  { id: "u4", email: "belize.education@charity.bz", name: "Belize Education Foundation", role: "user", verified: true, idVerified: true, createdAt: "2026-01-30", lastLoginAt: "2026-02-14T11:00:00Z" },
  { id: "u5", email: "carlos.m@email.com", name: "Carlos Mendez", role: "user", verified: true, idVerified: true, createdAt: "2026-02-01", lastLoginAt: "2026-02-17T08:00:00Z" },
  { id: "u6", email: "orange.walk@community.bz", name: "Orange Walk Community Assoc", role: "user", verified: true, idVerified: true, createdAt: "2026-01-25", lastLoginAt: null },
  { id: "u7", email: "corozal.seniors@charity.bz", name: "Corozal Senior Support", role: "user", verified: true, idVerified: true, createdAt: "2026-01-27", lastLoginAt: "2026-02-10T16:00:00Z" },
  { id: "u8", email: "john.donor@email.com", name: "John Smith", role: "user", verified: true, idVerified: false, createdAt: "2026-02-12", lastLoginAt: "2026-02-17T07:00:00Z" },
  { id: "u9", email: "jane.d@email.com", name: "Jane Doe", role: "user", verified: false, idVerified: false, createdAt: "2026-02-14", lastLoginAt: "2026-02-14T12:00:00Z" },
];

export const adminDonations: AdminDonation[] = [
  { id: "d1", campaignId: "1", campaignTitle: "Medical Treatment for Maria's Daughter", amount: 50, donorEmail: "john.donor@email.com", donorName: "John Smith", anonymous: false, method: "credit-card", status: "completed", createdAt: "2026-02-17T09:00:00Z" },
  { id: "d2", campaignId: "1", campaignTitle: "Medical Treatment for Maria's Daughter", amount: 20, donorEmail: "jane.d@email.com", donorName: "Anonymous", anonymous: true, method: "paypal", status: "completed", createdAt: "2026-02-17T08:30:00Z" },
  { id: "d3", campaignId: "2", campaignTitle: "Hurricane Relief for Dangriga Community", amount: 100, donorEmail: "donor@company.bz", donorName: "Belize Corp", anonymous: false, method: "bank", status: "completed", createdAt: "2026-02-16T15:00:00Z" },
  { id: "d4", campaignId: "1", campaignTitle: "Medical Treatment for Maria's Daughter", amount: 10, donorEmail: "unknown@email.com", donorName: "Anonymous", anonymous: true, method: "digiwallet", status: "completed", createdAt: "2026-02-16T11:00:00Z" },
  { id: "d5", campaignId: "3", campaignTitle: "School Supplies for Rural Toledo District", amount: 25, donorEmail: "john.donor@email.com", donorName: "John Smith", anonymous: false, method: "credit-card", status: "completed", createdAt: "2026-02-15T14:00:00Z" },
  { id: "d6", campaignId: "4", campaignTitle: "Emergency Surgery for Carlos", amount: 75, donorEmail: "maria.g@email.com", donorName: "Maria G.", anonymous: false, method: "paypal", status: "completed", createdAt: "2026-02-15T10:00:00Z" },
  { id: "d7", campaignId: "5", campaignTitle: "Community Center Renovation in Orange Walk", amount: 200, donorEmail: "donor@company.bz", donorName: "Belize Corp", anonymous: false, method: "bank", status: "completed", createdAt: "2026-02-14T16:00:00Z" },
  { id: "d8", campaignId: "2", campaignTitle: "Hurricane Relief for Dangriga Community", amount: 50, donorEmail: "jane.d@email.com", donorName: "Jane Doe", anonymous: false, method: "credit-card", status: "pending", createdAt: "2026-02-14T12:00:00Z" },
  { id: "d9", campaignId: "6", campaignTitle: "Food Assistance for Elderly in Corozal", amount: 15, donorEmail: "elder.supporter@email.com", donorName: "Anonymous", anonymous: true, method: "digiwallet", status: "completed", createdAt: "2026-02-13T09:00:00Z" },
  { id: "d10", campaignId: "1", campaignTitle: "Medical Treatment for Maria's Daughter", amount: 100, donorEmail: "big.donor@email.com", donorName: "Anonymous", anonymous: true, method: "bank", status: "completed", createdAt: "2026-02-12T14:00:00Z" },
];
