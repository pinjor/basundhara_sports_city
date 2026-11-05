import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { newIdempotencyKey } from "../lib/apiError";

export interface BookableFacility {
  id: string;
  name: string;
  type: string;
  bookable: boolean;
  zone?: { id: string; name: string } | null;
}

export interface DaySlot {
  id: string;
  timeSlotStart: string;
  timeSlotEnd: string;
  price: number;
  available: boolean;
}

export interface SessionHold {
  id: string;
  facility: { id: string; name: string };
  date: string;
  timeSlotStart: string;
  timeSlotEnd: string;
  status: string;
  amount: number;
  paymentStatus: string;
  holdExpiresAt: string | null;
  qrCode: string | null;
}

export function useBookableFacilities() {
  return useQuery({
    queryKey: ["session-facilities"],
    queryFn: async () => (await api.get<BookableFacility[]>("/customer/facilities")).data.filter((row) => row.bookable),
  });
}

export function useDaySlots(facilityId: string | null, date: string) {
  return useQuery({
    queryKey: ["session-slots", facilityId, date],
    queryFn: async () => (await api.get<DaySlot[]>(`/customer/facilities/${facilityId}/slots`, { params: { date } })).data,
    enabled: !!facilityId && !!date,
  });
}

export function useGuestHold() {
  return useMutation({
    mutationFn: async (body: {
      slotId: string;
      date: string;
      buyerName: string;
      buyerMobile: string;
      buyerEmail: string;
      termsAccepted: true;
    }) => (await api.post<SessionHold>("/customer/public-bookings", body)).data,
  });
}

export function useGuestPay(id: string) {
  return useMutation({
    mutationFn: async (body: { buyerMobile: string; method: string; simulateFailure?: boolean }) =>
      (
        await api.post<SessionHold>(`/customer/public-bookings/${id}/pay`, body, {
          headers: { "Idempotency-Key": newIdempotencyKey() },
        })
      ).data,
  });
}
