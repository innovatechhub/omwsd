export const queryKeys = {
  auth: {
    session: ["auth", "session"] as const,
    profile: (userId: string) => ["auth", "profile", userId] as const,
  },
  resident: {
    portal: (userId: string) => ["resident", "portal", userId] as const,
    profile: (userId: string) => ["resident", "profile", userId] as const,
  },
} as const;
