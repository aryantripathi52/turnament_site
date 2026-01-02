import { Timestamp } from 'firebase/firestore';

export type Tournament = {
  id: string;
  name: string;
  startDate: Timestamp;
  endDate: Timestamp;
  prizePoolFirst: number;
  prizePoolSecond: number;
  prizePoolThird: number;
  description: string;
  rules: string;
  registrationLink: string;
  contactEmail: string;
  categoryId: string;
};

export type Announcement = {
  id: string;
  title: string;
  content: string;
  date: string;
};

export type CoinRequest = {
  id: string;
  userId: string;
  username: string;
  type: 'add' | 'withdraw';
  amountCoins: number;
  amountPaid?: number; // Optional for withdrawals
  transactionId?: string; // Optional for withdrawals
  withdrawalDetails?: string; // Optional for add requests
  status: 'pending' | 'approved' | 'denied';
  requestDate: Timestamp;
  decisionDate?: Timestamp;
};

export type Category = {
  id: string;
  name: string;
  imageUrl: string;
};
