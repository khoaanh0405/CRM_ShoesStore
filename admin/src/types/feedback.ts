import type { PersonName } from '../utils/name';

export type FeedbackStatus = 'Pending' | 'Approved' | 'Rejected';

export interface Feedback {
  feedbackId: number;
  customerId: number;
  productId: number;
  title: string;
  content: string;
  rating: number;
  imageUrl?: string | null;
  status: FeedbackStatus;
  createdAt: string;
  customer?: PersonName & {
    customerId: number;
  };
  product?: {
    productId: number;
    productName: string;
  };
}

export interface FeedbackListResponse {
  data: Feedback[];
  total?: number;
}
