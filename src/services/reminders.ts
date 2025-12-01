import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
  Timestamp,
} from "firebase/firestore";
import { AgendaItem, ReminderConfig } from "@/types";

export interface ScheduledReminder {
  id: string;
  userId: string;
  appointmentId: string;
  appointmentDate: string;
  appointmentTime: string;
  clientName: string;
  serviceName: string;
  reminderTime: number; // timestamp when notification should be sent
  reminderConfig: ReminderConfig;
  sent: boolean;
  createdAt: number;
}

/**
 * Calculate when a reminder should be sent based on appointment date/time and reminder config
 */
export function calculateReminderTime(
  appointmentDate: string | number,
  appointmentTime: string,
  reminderConfig: ReminderConfig
): number {
  let dateStr: string;

  // Handle Excel serial dates
  if (typeof appointmentDate === "number") {
    const excelEpoch = new Date(1899, 11, 30);
    const tempDate = new Date(
      excelEpoch.getTime() + appointmentDate * 86400000
    );
    dateStr = tempDate.toISOString().split("T")[0];
  } else {
    dateStr = appointmentDate.includes("T")
      ? appointmentDate.split("T")[0]
      : appointmentDate;
  }

  // Parse appointment date and time
  const [hours, minutes] = appointmentTime.split(":").map(Number);
  const appointmentDateTime = new Date(dateStr);
  appointmentDateTime.setHours(hours, minutes, 0, 0);

  // Calculate reminder time based on config
  let reminderTime = new Date(appointmentDateTime);

  switch (reminderConfig.type) {
    case "days":
      reminderTime.setDate(reminderTime.getDate() - reminderConfig.value);
      break;
    case "hours":
      reminderTime.setHours(reminderTime.getHours() - reminderConfig.value);
      break;
    case "minutes":
      reminderTime.setMinutes(reminderTime.getMinutes() - reminderConfig.value);
      break;
  }

  return reminderTime.getTime();
}

/**
 * Schedule reminders for an appointment
 */
export async function scheduleReminders(
  userId: string,
  appointment: AgendaItem
): Promise<void> {
  if (!appointment.reminders || appointment.reminders.length === 0) {
    return;
  }

  // Remove existing reminders for this appointment
  await deleteRemindersForAppointment(userId, appointment.id);

  // Create new reminders
  const remindersRef = collection(db, "reminders");
  const enabledReminders = appointment.reminders.filter((r) => r.enabled);

  for (const reminderConfig of enabledReminders) {
    const reminderTime = calculateReminderTime(
      appointment.date,
      appointment.startTime || appointment.time,
      reminderConfig
    );

    // Only schedule if reminder time is in the future
    if (reminderTime > Date.now()) {
      await addDoc(remindersRef, {
        userId,
        appointmentId: appointment.id,
        appointmentDate: appointment.date,
        appointmentTime: appointment.startTime || appointment.time,
        clientName: appointment.client,
        serviceName: appointment.service,
        reminderTime,
        reminderConfig,
        sent: false,
        createdAt: Date.now(),
      });
    }
  }
}

/**
 * Delete all reminders for a specific appointment
 */
export async function deleteRemindersForAppointment(
  userId: string,
  appointmentId: string
): Promise<void> {
  const remindersRef = collection(db, "reminders");
  const q = query(
    remindersRef,
    where("userId", "==", userId),
    where("appointmentId", "==", appointmentId)
  );

  const snapshot = await getDocs(q);
  const deletePromises = snapshot.docs.map((doc) => deleteDoc(doc.ref));
  await Promise.all(deletePromises);
}

/**
 * Get pending reminders that should be sent now
 */
export async function getPendingReminders(
  userId: string
): Promise<ScheduledReminder[]> {
  try {
    const remindersRef = collection(db, "reminders");
    const now = Date.now();

    const q = query(
      remindersRef,
      where("userId", "==", userId),
      where("sent", "==", false),
      where("reminderTime", "<=", now)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        } as ScheduledReminder)
    );
  } catch (error: any) {
    // Handle index building errors gracefully
    if (
      error?.code === "failed-precondition" &&
      error?.message?.includes("index")
    ) {
      console.log(
        "Firestore index is building. Reminders will be available once indexing completes."
      );
      return [];
    }
    throw error;
  }
}

/**
 * Mark a reminder as sent
 */
export async function markReminderAsSent(reminderId: string): Promise<void> {
  const reminderRef = doc(db, "reminders", reminderId);
  await deleteDoc(reminderRef);
}

/**
 * Send a browser notification for a reminder
 */
export function sendBrowserNotification(reminder: ScheduledReminder): void {
  if (!("Notification" in window)) {
    console.log("This browser does not support notifications");
    return;
  }

  if (Notification.permission === "granted") {
    const notification = new Notification("Recordatorio de Cita", {
      body: `Recordatorio: ${reminder.clientName} - ${reminder.serviceName}\nHora: ${reminder.appointmentTime}`,
      icon: "/icon-192x192.png",
      badge: "/icon-192x192.png",
      tag: reminder.appointmentId,
      requireInteraction: true,
    });

    notification.onclick = () => {
      window.focus();
      window.location.href = `/appointments/${reminder.appointmentId}`;
    };
  }
}

/**
 * Request notification permission from the user
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!("Notification" in window)) {
    console.log("This browser does not support notifications");
    return "denied";
  }

  if (Notification.permission === "default") {
    return await Notification.requestPermission();
  }

  return Notification.permission;
}

/**
 * Check for pending reminders and send notifications
 * This should be called periodically (e.g., every minute)
 */
export async function checkAndSendReminders(userId: string): Promise<void> {
  try {
    const pendingReminders = await getPendingReminders(userId);

    for (const reminder of pendingReminders) {
      sendBrowserNotification(reminder);
      await markReminderAsSent(reminder.id);
    }
  } catch (error) {
    console.error("Error checking reminders:", error);
  }
}
