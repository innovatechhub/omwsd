export const queryKeys = {
  auth: {
    session: ["auth", "session"] as const,
    profile: (userId: string) => ["auth", "profile", userId] as const,
  },
  resident: {
    portal: (userId: string) => ["resident", "portal", userId] as const,
    profile: (userId: string) => ["resident", "profile", userId] as const,
    sectorRegistrations: (userId: string) => ["resident", "sector", userId] as const,
    appointmentSlots: (sectorType: string) => ["sector", "slots", sectorType] as const,
    appointment: (sectorRegistrationId: string) => ["resident", "appointment", sectorRegistrationId] as const,
  },
  admin: {
    sectorRegistrations: (filters?: object) => ["admin", "sector-registrations", filters ?? {}] as const,
    appointments: (date?: string) => ["admin", "appointments", date ?? "all"] as const,
    appointmentSlots: () => ["admin", "appointment-slots"] as const,
  },
} as const;
