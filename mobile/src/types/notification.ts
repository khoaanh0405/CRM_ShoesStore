export type NotificationType = 'SURVEY_ASSIGNED' | 'FEEDBACK_APPROVED' | 'FEEDBACK_REJECTED';
export type NotificationRefType = 'SURVEY' | 'FEEDBACK';
export type AppNotification = {
  notificationId: number;
  customerId: number;
  type: NotificationType;
  title: string;
  message: string;
  refType: NotificationRefType | null;
  refId: number | null;
  isRead: boolean;
  createdAt: string;
};
