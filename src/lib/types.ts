import { Timestamp } from 'firebase/firestore';

export type Tournament = {
  id: string;
  name: string;
  startDate: Timestamp;
  endDate: Timestamp;
  prizePoolFirst: number;
  prizePoolSecond: number;
  prizePoolThird: number;
  entryFee: number;
  description: string;
  rules: string;
  registrationLink: string;
  contactEmail: string;
  categoryId: string;
  status: 'upcoming' | 'live' | 'completed' | 'cancelled';
  maxPlayers: number;
  registeredCount: number;
};

export type Registration = {
    id: string;
    tournamentId: string;
    teamName: string;
    playerIds: string[];
    registrationDate: Timestamp;
};

export type JoinedTournament = {
  id: string; // This will be the tournamentId
  name: string;
  startDate: Timestamp;
  prizePoolFirst: number;
  entryFee: number;
};


export type Announcement = {
  id: string;
  title: string;
  content: string;
  date: string;
};

export type CoinRequest = {
  id:string;
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
