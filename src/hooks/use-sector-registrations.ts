import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import {
  getSectorRegistrations,
  getSectorRegistration,
  createSectorRegistration,
  resubmitSectorRegistration,
  bookAppointment,
  cancelAppointment,
  uploadSectorDocument,
  getAvailableAppointmentSlots,
  getAppointmentForRegistration,
  getResidentAppointments,
  bookStandaloneAppointment,
} from "@/services/sector-service";
import type { SectorType } from "@/types/sector";

export function useSectorRegistrations(userId: string) {
  return useQuery({
    queryKey: queryKeys.resident.sectorRegistrations(userId),
    queryFn: getSectorRegistrations,
    enabled: !!userId,
  });
}

export function useSectorRegistration(sectorType: SectorType, userId: string) {
  return useQuery({
    queryKey: [...queryKeys.resident.sectorRegistrations(userId), sectorType],
    queryFn: () => getSectorRegistration(sectorType),
    enabled: !!userId,
  });
}

export function useAvailableAppointmentSlots(sectorType: SectorType) {
  return useQuery({
    queryKey: queryKeys.resident.appointmentSlots(sectorType),
    queryFn: () => getAvailableAppointmentSlots(sectorType),
  });
}

export function useAppointmentForRegistration(sectorRegistrationId: string | null) {
  return useQuery({
    queryKey: queryKeys.resident.appointment(sectorRegistrationId ?? ""),
    queryFn: () => getAppointmentForRegistration(sectorRegistrationId!),
    enabled: !!sectorRegistrationId,
  });
}

export function useCreateSectorRegistration(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createSectorRegistration,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.resident.sectorRegistrations(userId) });
    },
  });
}

export function useResubmitSectorRegistration(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: resubmitSectorRegistration,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.resident.sectorRegistrations(userId) });
    },
  });
}

export function useBookAppointment(userId: string, sectorType: SectorType) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: bookAppointment,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.resident.sectorRegistrations(userId) });
      void qc.invalidateQueries({ queryKey: queryKeys.resident.appointmentSlots(sectorType) });
    },
  });
}

export function useCancelAppointment(userId: string, sectorType: SectorType) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: cancelAppointment,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.resident.sectorRegistrations(userId) });
      void qc.invalidateQueries({ queryKey: queryKeys.resident.appointmentSlots(sectorType) });
    },
  });
}

export function useUploadSectorDocument(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: uploadSectorDocument,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.resident.sectorRegistrations(userId) });
    },
  });
}

export function useResidentAppointments(userId: string) {
  return useQuery({
    queryKey: queryKeys.resident.appointments(userId),
    queryFn: getResidentAppointments,
    enabled: !!userId,
  });
}

export function useBookStandaloneAppointment(userId: string, sectorType: SectorType) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: bookStandaloneAppointment,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.resident.appointments(userId) });
      void qc.invalidateQueries({ queryKey: queryKeys.resident.appointmentSlots(sectorType) });
    },
  });
}
