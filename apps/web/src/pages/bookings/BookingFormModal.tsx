import { SessionBookingFlow } from "../../components/booking/SessionBookingFlow";
import { Modal } from "../../components/ui/Modal";

export function BookingFormModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="New booking" wide>
      {open && <SessionBookingFlow key={String(open)} mode="staff" onStaffCreated={onClose} />}
    </Modal>
  );
}
