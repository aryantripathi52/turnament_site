import type { Tournament, Announcement } from './types';
import { PlaceHolderImages } from './placeholder-images';

const findImage = (id: string) => PlaceHolderImages.find(img => img.id === id);

export const tournaments: Tournament[] = [];

export const announcements: Announcement[] = [];
