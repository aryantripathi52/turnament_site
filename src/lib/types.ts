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
