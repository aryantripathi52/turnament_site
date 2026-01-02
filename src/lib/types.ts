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
  winners?: {
    first?: { userId: string; username: string };
    second?: { userId: string; username: string };
    third?: { userId: string; username: string };
  }
};

export type Registration = {
    id: string;
    tournamentId: string;
    teamName: string; // This is the user's username
    playerIds: string[]; // This is an array with just the user's ID
    registrationDate: Timestamp;
    userId: string;
};

export type JoinedTournament = {
  id: string; // This will be the tournamentId
  name: string;
  startDate: Timestamp;
  prizePoolFirst: number;
  entryFee: number;
};

export type WonTournament = {
    id: string; // tournamentId
    name: string;
    prizeWon: number;
    place: '1st' | '2nd' | '3rd';
    completionDate: Timestamp;
}


export type Announcement = {
  id: string;
  title: string;
  content: string;
  date: string;
};

export type AddCoinRequest = {
    id:string;
    userId: string;
    username: string;
    type: 'add';
    amountCoins: number;
    amountPaid: number;
    transactionId: string;
    status: 'pending' | 'approved' | 'denied';
    requestDate: Timestamp;
    decisionDate?: Timestamp | null;
};

export type WithdrawCoinRequest = {
    id:string;
    userId: string;
    username: string;
    type: 'withdraw';
    amountCoins: number;
    withdrawalDetails: string;
    status: 'pending' | 'approved' | 'denied';
    requestDate: Timestamp;
    decisionDate?: Timestamp | null;
};


export type Category = {
  id: string;
  name: string;
  imageUrl: string;
};