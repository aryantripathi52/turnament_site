# Free Fire Frenzy - eSports Tournament Platform

This is a Next.js application built with Firebase Studio, designed as a comprehensive platform for hosting and participating in Free Fire eSports tournaments. It includes role-based access for Admins, Staff, and Players, along with features for tournament management, player wallets, and real-time updates.

## Key Features

- **Role-Based Dashboards:** Separate, feature-rich dashboards for Players, Staff, and Admins.
- **Tournament Management:** Admins and Staff can create, manage, and finalize tournaments, including setting prize pools, entry fees, and room details.
- **Player Wallet System:** Players can add funds to their wallets via simulated payment requests and withdraw their winnings.
- **Real-Time Tournament Joining:** Players can join upcoming tournaments, with their entry fee automatically deducted and the player count updated in real-time.
- **Live Match Info:** Once a tournament goes live, joined players can see the in-game room ID and password.
- **Automated Payouts:** Admins can set tournament winners, which automatically distributes the coin prizes to the winners' wallets.
- **Unified Transaction History:** Players have a comprehensive history tab showing all financial activities, including deposits, withdrawals, entry fees, and prize winnings.
- **Admin Global History:** A dedicated, filterable dashboard for admins to view every single transaction across the platform for complete oversight.
- **Staff Management:** Admins can create and manage Staff accounts directly from their dashboard.
- **Secure Authentication & Permissions:** The application uses Firebase Authentication and granular Firestore Security Rules to protect data and ensure users only access what they are permitted to.

## Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (App Router)
- **UI:** [React](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Tailwind CSS](https://tailwindcss.com/)
- **Component Library:** [ShadCN UI](https://ui.shadcn.com/)
- **Icons:** [Lucide React](https://lucide.dev/guide/packages/lucide-react)
- **Backend & Database:** [Firebase](https://firebase.google.com/) (Authentication, Firestore)
- **Form Management:** [React Hook Form](https://react-hook-form.com/) & [Zod](https://zod.dev/)

## Getting Started

To get started with the application, simply run the development server:

```bash
npm run dev
```

You can then access the application in your browser. You can register as a Player, or use the appropriate role keys during registration to access Staff or Admin functionality.

- **Player:** Register without a role key.
- **Staff/Admin:** Use the designated keys during registration to gain elevated permissions.
