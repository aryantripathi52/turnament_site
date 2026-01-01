import type { Tournament, Announcement } from './types';
import { PlaceHolderImages } from './placeholder-images';

const findImage = (id: string) => PlaceHolderImages.find(img => img.id === id);

export const tournaments: Tournament[] = [
  {
    id: '1',
    name: 'Free Fire Frenzy: Season 1',
    date: '2024-08-15',
    prizePool: '$10,000',
    region: 'North America',
    rules: [
      'Squads of 4.',
      'All matches played on Bermuda map.',
      'Standard competitive ruleset applies.',
      'No emulators allowed.'
    ],
    registrationDeadline: '2024-08-10',
    contact: 'tournaments@freefirefrenzy.com',
    imageUrl: findImage('tournament-1')?.imageUrl || '',
    imageHint: findImage('tournament-1')?.imageHint || ''
  },
  {
    id: '2',
    name: 'Summer Skirmish',
    date: '2024-09-01',
    prizePool: '$5,000',
    region: 'Europe',
    rules: [
      'Duos mode.',
      'Points system based on placement and kills.',
      'Finals will be a best of 5.',
    ],
    registrationDeadline: '2024-08-25',
    contact: 'support@summerskirmish.gg',
    imageUrl: findImage('tournament-2')?.imageUrl || '',
    imageHint: findImage('tournament-2')?.imageHint || ''
  },
  {
    id: '3',
    name: 'Asia Invitational',
    date: '2024-09-20',
    prizePool: '$25,000',
    region: 'Asia',
    rules: [
      'Invite-only for top 12 teams.',
      'Round-robin group stage followed by a double-elimination bracket.',
      'All DLC characters are permitted.',
    ],
    registrationDeadline: '2024-09-01',
    contact: 'invites@asiainvitational.com',
    imageUrl: findImage('tournament-3')?.imageUrl || '',
    imageHint: findImage('tournament-3')?.imageHint || ''
  },
];

export const announcements: Announcement[] = [
  {
    id: '1',
    title: 'Platform Launch!',
    content: 'Welcome to Free Fire Frenzy, your new home for competitive Free Fire tournaments. We are excited to have you!',
    date: '2024-07-20'
  },
  {
    id: '2',
    title: 'Season 1 Registration Now Open',
    content: 'Registration for the inaugural Free Fire Frenzy: Season 1 is now live! Sign up your squad and compete for a share of the $10,000 prize pool.',
    date: '2024-07-21'
  },
  {
    id: '3',
    title: 'New AI Highlight Feature',
    content: 'Check out our new AI-powered tool to automatically generate highlight reels from your match streams. Try it on the home page!',
    date: '2024-07-22'
  }
];
