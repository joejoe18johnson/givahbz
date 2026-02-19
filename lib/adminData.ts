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
  /** Optional message from the donor, max 100 characters. */
  note?: string;
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
  // Campaign 1: Medical Treatment for Maria's Daughter (12 donors)
  { id: "d1", campaignId: "1", campaignTitle: "Medical Treatment for Maria's Daughter", amount: 50, donorEmail: "john.donor@email.com", donorName: "John Smith", anonymous: false, method: "credit-card", status: "completed", createdAt: "2026-02-17T09:00:00Z" },
  { id: "d2", campaignId: "1", campaignTitle: "Medical Treatment for Maria's Daughter", amount: 20, donorEmail: "jane.d@email.com", donorName: "Anonymous", anonymous: true, method: "paypal", status: "completed", createdAt: "2026-02-17T08:30:00Z" },
  { id: "d4", campaignId: "1", campaignTitle: "Medical Treatment for Maria's Daughter", amount: 10, donorEmail: "unknown@email.com", donorName: "Anonymous", anonymous: true, method: "digiwallet", status: "completed", createdAt: "2026-02-16T11:00:00Z" },
  { id: "d10", campaignId: "1", campaignTitle: "Medical Treatment for Maria's Daughter", amount: 100, donorEmail: "big.donor@email.com", donorName: "Anonymous", anonymous: true, method: "bank", status: "completed", createdAt: "2026-02-12T14:00:00Z" },
  { id: "d11", campaignId: "1", campaignTitle: "Medical Treatment for Maria's Daughter", amount: 75, donorEmail: "patricia.m@email.com", donorName: "Patricia Martinez", anonymous: false, method: "credit-card", status: "completed", createdAt: "2026-02-11T16:20:00Z" },
  { id: "d12", campaignId: "1", campaignTitle: "Medical Treatment for Maria's Daughter", amount: 30, donorEmail: "robert.b@email.com", donorName: "Robert Brown", anonymous: false, method: "paypal", status: "completed", createdAt: "2026-02-10T10:15:00Z" },
  { id: "d13", campaignId: "1", campaignTitle: "Medical Treatment for Maria's Daughter", amount: 150, donorEmail: "lisa.w@email.com", donorName: "Anonymous", anonymous: true, method: "bank", status: "completed", createdAt: "2026-02-09T14:45:00Z" },
  { id: "d14", campaignId: "1", campaignTitle: "Medical Treatment for Maria's Daughter", amount: 25, donorEmail: "michael.t@email.com", donorName: "Michael Thompson", anonymous: false, method: "digiwallet", status: "completed", createdAt: "2026-02-08T09:30:00Z" },
  { id: "d15", campaignId: "1", campaignTitle: "Medical Treatment for Maria's Daughter", amount: 200, donorEmail: "sarah.j@email.com", donorName: "Sarah Johnson", anonymous: false, method: "credit-card", status: "completed", createdAt: "2026-02-07T11:00:00Z" },
  { id: "d16", campaignId: "1", campaignTitle: "Medical Treatment for Maria's Daughter", amount: 40, donorEmail: "david.l@email.com", donorName: "Anonymous", anonymous: true, method: "paypal", status: "completed", createdAt: "2026-02-06T15:20:00Z" },
  { id: "d17", campaignId: "1", campaignTitle: "Medical Treatment for Maria's Daughter", amount: 60, donorEmail: "emily.c@email.com", donorName: "Emily Chen", anonymous: false, method: "credit-card", status: "completed", createdAt: "2026-02-05T13:10:00Z" },
  { id: "d18", campaignId: "1", campaignTitle: "Medical Treatment for Maria's Daughter", amount: 35, donorEmail: "james.r@email.com", donorName: "James Rodriguez", anonymous: false, method: "digiwallet", status: "completed", createdAt: "2026-02-05T08:00:00Z" },
  
  // Campaign 2: Hurricane Relief for Dangriga Community (10 donors)
  { id: "d3", campaignId: "2", campaignTitle: "Hurricane Relief for Dangriga Community", amount: 100, donorEmail: "donor@company.bz", donorName: "Belize Corp", anonymous: false, method: "bank", status: "completed", createdAt: "2026-02-16T15:00:00Z" },
  { id: "d8", campaignId: "2", campaignTitle: "Hurricane Relief for Dangriga Community", amount: 50, donorEmail: "jane.d@email.com", donorName: "Jane Doe", anonymous: false, method: "credit-card", status: "pending", createdAt: "2026-02-14T12:00:00Z" },
  { id: "d19", campaignId: "2", campaignTitle: "Hurricane Relief for Dangriga Community", amount: 250, donorEmail: "belize.business@email.com", donorName: "Belize Business Alliance", anonymous: false, method: "bank", status: "completed", createdAt: "2026-02-15T10:30:00Z" },
  { id: "d20", campaignId: "2", campaignTitle: "Hurricane Relief for Dangriga Community", amount: 75, donorEmail: "maria.g@email.com", donorName: "Maria Gonzalez", anonymous: false, method: "paypal", status: "completed", createdAt: "2026-02-14T14:00:00Z" },
  { id: "d21", campaignId: "2", campaignTitle: "Hurricane Relief for Dangriga Community", amount: 120, donorEmail: "community.help@email.com", donorName: "Anonymous", anonymous: true, method: "bank", status: "completed", createdAt: "2026-02-13T16:45:00Z" },
  { id: "d22", campaignId: "2", campaignTitle: "Hurricane Relief for Dangriga Community", amount: 45, donorEmail: "thomas.k@email.com", donorName: "Thomas King", anonymous: false, method: "credit-card", status: "completed", createdAt: "2026-02-12T11:20:00Z" },
  { id: "d23", campaignId: "2", campaignTitle: "Hurricane Relief for Dangriga Community", amount: 300, donorEmail: "foundation@belize.bz", donorName: "Belize Foundation", anonymous: false, method: "bank", status: "completed", createdAt: "2026-02-11T09:00:00Z" },
  { id: "d24", campaignId: "2", campaignTitle: "Hurricane Relief for Dangriga Community", amount: 80, donorEmail: "nancy.p@email.com", donorName: "Nancy Perez", anonymous: false, method: "paypal", status: "completed", createdAt: "2026-02-10T13:30:00Z" },
  { id: "d25", campaignId: "2", campaignTitle: "Hurricane Relief for Dangriga Community", amount: 55, donorEmail: "charles.m@email.com", donorName: "Anonymous", anonymous: true, method: "digiwallet", status: "completed", createdAt: "2026-02-09T15:00:00Z" },
  { id: "d26", campaignId: "2", campaignTitle: "Hurricane Relief for Dangriga Community", amount: 90, donorEmail: "linda.s@email.com", donorName: "Linda Smith", anonymous: false, method: "credit-card", status: "completed", createdAt: "2026-02-08T10:15:00Z" },
  
  // Campaign 3: School Supplies for Rural Toledo District (8 donors)
  { id: "d5", campaignId: "3", campaignTitle: "School Supplies for Rural Toledo District", amount: 25, donorEmail: "john.donor@email.com", donorName: "John Smith", anonymous: false, method: "credit-card", status: "completed", createdAt: "2026-02-15T14:00:00Z" },
  { id: "d27", campaignId: "3", campaignTitle: "School Supplies for Rural Toledo District", amount: 40, donorEmail: "teacher.supporter@email.com", donorName: "Anonymous", anonymous: true, method: "paypal", status: "completed", createdAt: "2026-02-14T12:00:00Z" },
  { id: "d28", campaignId: "3", campaignTitle: "School Supplies for Rural Toledo District", amount: 15, donorEmail: "student.help@email.com", donorName: "Student Help Network", anonymous: false, method: "digiwallet", status: "completed", createdAt: "2026-02-13T09:30:00Z" },
  { id: "d29", campaignId: "3", campaignTitle: "School Supplies for Rural Toledo District", amount: 60, donorEmail: "education.fund@email.com", donorName: "Education Fund Belize", anonymous: false, method: "bank", status: "completed", createdAt: "2026-02-12T11:00:00Z" },
  { id: "d30", campaignId: "3", campaignTitle: "School Supplies for Rural Toledo District", amount: 30, donorEmail: "karen.w@email.com", donorName: "Karen Williams", anonymous: false, method: "credit-card", status: "completed", createdAt: "2026-02-11T14:20:00Z" },
  { id: "d31", campaignId: "3", campaignTitle: "School Supplies for Rural Toledo District", amount: 20, donorEmail: "mark.h@email.com", donorName: "Anonymous", anonymous: true, method: "paypal", status: "completed", createdAt: "2026-02-10T10:45:00Z" },
  { id: "d32", campaignId: "3", campaignTitle: "School Supplies for Rural Toledo District", amount: 50, donorEmail: "belize.teachers@email.com", donorName: "Belize Teachers Association", anonymous: false, method: "bank", status: "completed", createdAt: "2026-02-09T16:00:00Z" },
  { id: "d33", campaignId: "3", campaignTitle: "School Supplies for Rural Toledo District", amount: 35, donorEmail: "jennifer.l@email.com", donorName: "Jennifer Lee", anonymous: false, method: "credit-card", status: "completed", createdAt: "2026-02-08T13:15:00Z" },
  
  // Campaign 4: Emergency Surgery for Carlos (9 donors)
  { id: "d6", campaignId: "4", campaignTitle: "Emergency Surgery for Carlos", amount: 75, donorEmail: "maria.g@email.com", donorName: "Maria G.", anonymous: false, method: "paypal", status: "completed", createdAt: "2026-02-15T10:00:00Z" },
  { id: "d34", campaignId: "4", campaignTitle: "Emergency Surgery for Carlos", amount: 100, donorEmail: "carlos.friends@email.com", donorName: "Anonymous", anonymous: true, method: "bank", status: "completed", createdAt: "2026-02-14T15:30:00Z" },
  { id: "d35", campaignId: "4", campaignTitle: "Emergency Surgery for Carlos", amount: 50, donorEmail: "construction.union@email.com", donorName: "Construction Workers Union", anonymous: false, method: "credit-card", status: "completed", createdAt: "2026-02-13T11:20:00Z" },
  { id: "d36", campaignId: "4", campaignTitle: "Emergency Surgery for Carlos", amount: 125, donorEmail: "family.support@email.com", donorName: "Family Support Network", anonymous: false, method: "bank", status: "completed", createdAt: "2026-02-12T09:00:00Z" },
  { id: "d37", campaignId: "4", campaignTitle: "Emergency Surgery for Carlos", amount: 40, donorEmail: "paul.r@email.com", donorName: "Paul Rodriguez", anonymous: false, method: "paypal", status: "completed", createdAt: "2026-02-11T14:45:00Z" },
  { id: "d38", campaignId: "4", campaignTitle: "Emergency Surgery for Carlos", amount: 90, donorEmail: "medical.help@email.com", donorName: "Anonymous", anonymous: true, method: "digiwallet", status: "completed", createdAt: "2026-02-10T10:30:00Z" },
  { id: "d39", campaignId: "4", campaignTitle: "Emergency Surgery for Carlos", amount: 60, donorEmail: "susan.m@email.com", donorName: "Susan Martinez", anonymous: false, method: "credit-card", status: "completed", createdAt: "2026-02-09T12:15:00Z" },
  { id: "d40", campaignId: "4", campaignTitle: "Emergency Surgery for Carlos", amount: 200, donorEmail: "belize.medical@email.com", donorName: "Belize Medical Fund", anonymous: false, method: "bank", status: "completed", createdAt: "2026-02-08T16:00:00Z" },
  { id: "d41", campaignId: "4", campaignTitle: "Emergency Surgery for Carlos", amount: 30, donorEmail: "robert.t@email.com", donorName: "Robert Torres", anonymous: false, method: "paypal", status: "completed", createdAt: "2026-02-07T11:00:00Z" },
  
  // Campaign 5: Community Center Renovation in Orange Walk (11 donors)
  { id: "d7", campaignId: "5", campaignTitle: "Community Center Renovation in Orange Walk", amount: 200, donorEmail: "donor@company.bz", donorName: "Belize Corp", anonymous: false, method: "bank", status: "completed", createdAt: "2026-02-14T16:00:00Z" },
  { id: "d42", campaignId: "5", campaignTitle: "Community Center Renovation in Orange Walk", amount: 150, donorEmail: "orange.walk.business@email.com", donorName: "Orange Walk Business Council", anonymous: false, method: "bank", status: "completed", createdAt: "2026-02-13T14:00:00Z" },
  { id: "d43", campaignId: "5", campaignTitle: "Community Center Renovation in Orange Walk", amount: 80, donorEmail: "community.volunteer@email.com", donorName: "Anonymous", anonymous: true, method: "credit-card", status: "completed", createdAt: "2026-02-12T10:30:00Z" },
  { id: "d44", campaignId: "5", campaignTitle: "Community Center Renovation in Orange Walk", amount: 120, donorEmail: "local.chamber@email.com", donorName: "Local Chamber of Commerce", anonymous: false, method: "bank", status: "completed", createdAt: "2026-02-11T15:20:00Z" },
  { id: "d45", campaignId: "5", campaignTitle: "Community Center Renovation in Orange Walk", amount: 65, donorEmail: "frank.b@email.com", donorName: "Frank Brown", anonymous: false, method: "paypal", status: "completed", createdAt: "2026-02-10T09:45:00Z" },
  { id: "d46", campaignId: "5", campaignTitle: "Community Center Renovation in Orange Walk", amount: 95, donorEmail: "helen.j@email.com", donorName: "Helen Johnson", anonymous: false, method: "credit-card", status: "completed", createdAt: "2026-02-09T13:00:00Z" },
  { id: "d47", campaignId: "5", campaignTitle: "Community Center Renovation in Orange Walk", amount: 300, donorEmail: "belize.community@email.com", donorName: "Belize Community Foundation", anonymous: false, method: "bank", status: "completed", createdAt: "2026-02-08T11:30:00Z" },
  { id: "d48", campaignId: "5", campaignTitle: "Community Center Renovation in Orange Walk", amount: 45, donorEmail: "volunteer.group@email.com", donorName: "Anonymous", anonymous: true, method: "digiwallet", status: "completed", createdAt: "2026-02-07T14:15:00Z" },
  { id: "d49", campaignId: "5", campaignTitle: "Community Center Renovation in Orange Walk", amount: 110, donorEmail: "george.m@email.com", donorName: "George Martinez", anonymous: false, method: "paypal", status: "completed", createdAt: "2026-02-06T10:00:00Z" },
  { id: "d50", campaignId: "5", campaignTitle: "Community Center Renovation in Orange Walk", amount: 70, donorEmail: "diana.c@email.com", donorName: "Diana Chen", anonymous: false, method: "credit-card", status: "completed", createdAt: "2026-02-05T12:45:00Z" },
  { id: "d51", campaignId: "5", campaignTitle: "Community Center Renovation in Orange Walk", amount: 55, donorEmail: "local.resident@email.com", donorName: "Anonymous", anonymous: true, method: "paypal", status: "completed", createdAt: "2026-02-04T16:20:00Z" },
  
  // Campaign 6: Food Assistance for Elderly in Corozal (7 donors)
  { id: "d9", campaignId: "6", campaignTitle: "Food Assistance for Elderly in Corozal", amount: 15, donorEmail: "elder.supporter@email.com", donorName: "Anonymous", anonymous: true, method: "digiwallet", status: "completed", createdAt: "2026-02-13T09:00:00Z" },
  { id: "d52", campaignId: "6", campaignTitle: "Food Assistance for Elderly in Corozal", amount: 30, donorEmail: "senior.care@email.com", donorName: "Senior Care Network", anonymous: false, method: "credit-card", status: "completed", createdAt: "2026-02-12T11:30:00Z" },
  { id: "d53", campaignId: "6", campaignTitle: "Food Assistance for Elderly in Corozal", amount: 25, donorEmail: "corozal.community@email.com", donorName: "Corozal Community Group", anonymous: false, method: "paypal", status: "completed", createdAt: "2026-02-11T14:00:00Z" },
  { id: "d54", campaignId: "6", campaignTitle: "Food Assistance for Elderly in Corozal", amount: 50, donorEmail: "elderly.support@email.com", donorName: "Anonymous", anonymous: true, method: "bank", status: "completed", createdAt: "2026-02-10T10:15:00Z" },
  { id: "d55", campaignId: "6", campaignTitle: "Food Assistance for Elderly in Corozal", amount: 20, donorEmail: "local.family@email.com", donorName: "Local Family Fund", anonymous: false, method: "digiwallet", status: "completed", createdAt: "2026-02-09T13:45:00Z" },
  { id: "d56", campaignId: "6", campaignTitle: "Food Assistance for Elderly in Corozal", amount: 40, donorEmail: "belize.seniors@email.com", donorName: "Belize Seniors Association", anonymous: false, method: "credit-card", status: "completed", createdAt: "2026-02-08T09:30:00Z" },
  { id: "d57", campaignId: "6", campaignTitle: "Food Assistance for Elderly in Corozal", amount: 35, donorEmail: "community.help@email.com", donorName: "Anonymous", anonymous: true, method: "paypal", status: "completed", createdAt: "2026-02-07T15:20:00Z" },
  
  // Campaign 7: Fire Recovery for Belize City Family (9 donors)
  { id: "d58", campaignId: "7", campaignTitle: "Fire Recovery for Belize City Family", amount: 200, donorEmail: "fire.relief@email.com", donorName: "Fire Relief Fund", anonymous: false, method: "bank", status: "completed", createdAt: "2026-02-16T10:00:00Z" },
  { id: "d59", campaignId: "7", campaignTitle: "Fire Recovery for Belize City Family", amount: 100, donorEmail: "belize.city.help@email.com", donorName: "Belize City Help Network", anonymous: false, method: "credit-card", status: "completed", createdAt: "2026-02-15T14:30:00Z" },
  { id: "d60", campaignId: "7", campaignTitle: "Fire Recovery for Belize City Family", amount: 75, donorEmail: "emergency.fund@email.com", donorName: "Anonymous", anonymous: true, method: "paypal", status: "completed", createdAt: "2026-02-14T11:15:00Z" },
  { id: "d61", campaignId: "7", campaignTitle: "Fire Recovery for Belize City Family", amount: 150, donorEmail: "family.support@email.com", donorName: "Family Support Group", anonymous: false, method: "bank", status: "completed", createdAt: "2026-02-13T16:00:00Z" },
  { id: "d62", campaignId: "7", campaignTitle: "Fire Recovery for Belize City Family", amount: 50, donorEmail: "neighbor.help@email.com", donorName: "Neighbor Help Fund", anonymous: false, method: "digiwallet", status: "completed", createdAt: "2026-02-12T09:45:00Z" },
  { id: "d63", campaignId: "7", campaignTitle: "Fire Recovery for Belize City Family", amount: 125, donorEmail: "belize.emergency@email.com", donorName: "Anonymous", anonymous: true, method: "credit-card", status: "completed", createdAt: "2026-02-11T13:20:00Z" },
  { id: "d64", campaignId: "7", campaignTitle: "Fire Recovery for Belize City Family", amount: 80, donorEmail: "community.aid@email.com", donorName: "Community Aid Belize", anonymous: false, method: "paypal", status: "completed", createdAt: "2026-02-10T10:30:00Z" },
  { id: "d65", campaignId: "7", campaignTitle: "Fire Recovery for Belize City Family", amount: 60, donorEmail: "local.business@email.com", donorName: "Local Business Alliance", anonymous: false, method: "bank", status: "completed", createdAt: "2026-02-09T15:00:00Z" },
  { id: "d66", campaignId: "7", campaignTitle: "Fire Recovery for Belize City Family", amount: 90, donorEmail: "recovery.fund@email.com", donorName: "Anonymous", anonymous: true, method: "digiwallet", status: "completed", createdAt: "2026-02-08T12:00:00Z" },
  
  // Campaign 8: Youth Sports Equipment for Cayo District (8 donors)
  { id: "d67", campaignId: "8", campaignTitle: "Youth Sports Equipment for Cayo District", amount: 100, donorEmail: "sports.fund@email.com", donorName: "Belize Sports Fund", anonymous: false, method: "bank", status: "completed", createdAt: "2026-02-15T11:00:00Z" },
  { id: "d68", campaignId: "8", campaignTitle: "Youth Sports Equipment for Cayo District", amount: 75, donorEmail: "youth.program@email.com", donorName: "Youth Program Support", anonymous: false, method: "credit-card", status: "completed", createdAt: "2026-02-14T14:20:00Z" },
  { id: "d69", campaignId: "8", campaignTitle: "Youth Sports Equipment for Cayo District", amount: 50, donorEmail: "sports.coach@email.com", donorName: "Anonymous", anonymous: true, method: "paypal", status: "completed", createdAt: "2026-02-13T10:45:00Z" },
  { id: "d70", campaignId: "8", campaignTitle: "Youth Sports Equipment for Cayo District", amount: 125, donorEmail: "cayo.youth@email.com", donorName: "Cayo Youth Foundation", anonymous: false, method: "bank", status: "completed", createdAt: "2026-02-12T16:30:00Z" },
  { id: "d71", campaignId: "8", campaignTitle: "Youth Sports Equipment for Cayo District", amount: 40, donorEmail: "athletic.support@email.com", donorName: "Athletic Support Network", anonymous: false, method: "digiwallet", status: "completed", createdAt: "2026-02-11T09:15:00Z" },
  { id: "d72", campaignId: "8", campaignTitle: "Youth Sports Equipment for Cayo District", amount: 90, donorEmail: "sports.enthusiast@email.com", donorName: "Anonymous", anonymous: true, method: "credit-card", status: "completed", createdAt: "2026-02-10T13:00:00Z" },
  { id: "d73", campaignId: "8", campaignTitle: "Youth Sports Equipment for Cayo District", amount: 60, donorEmail: "belize.athletics@email.com", donorName: "Belize Athletics Association", anonymous: false, method: "paypal", status: "completed", createdAt: "2026-02-09T11:30:00Z" },
  { id: "d74", campaignId: "8", campaignTitle: "Youth Sports Equipment for Cayo District", amount: 85, donorEmail: "youth.sports@email.com", donorName: "Youth Sports Initiative", anonymous: false, method: "bank", status: "completed", createdAt: "2026-02-08T15:45:00Z" },
];
