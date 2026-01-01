import { Timestamp } from 'firebase/firestore';

export type Tournament = {
  id: string;
  name: string;
  date: string;
  prizePool: string;
  region: string;
  rules: string[];
  registrationDeadline: string;
  contact: string;
  imageUrl: string;
  imageHint: string;
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
  amountPaid: number;
  transactionId: string;
  status: 'pending' | 'approved' | 'denied';
  requestDate: Timestamp;
  decisionDate?: Timestamp;
};
