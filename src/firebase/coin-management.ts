
'use client';

import { Firestore, doc, getDoc, writeBatch } from 'firebase/firestore';

interface HandleDecisionParams {
    requestId: string;
    userId: string;
    amount: number;
    decision: 'approved' | 'denied';
    requestType: 'add' | 'withdraw';
}

/**
 * Handles the logic for approving or denying a coin request.
 * This function uses a batch write to ensure atomicity.
 * @param firestore - The Firestore instance.
 * @param params - The parameters for the decision.
 */
export async function handleCoinRequestDecision(firestore: Firestore, params: HandleDecisionParams) {
    const { requestId, userId, amount, decision, requestType } = params;

    const batch = writeBatch(firestore);

    // 1. Update the coin request status
    const requestRef = doc(firestore, 'coinRequests', requestId);
    batch.update(requestRef, {
        status: decision,
        decisionDate: new Date(),
    });

    // 2. If approved, update the user's coin balance
    if (decision === 'approved') {
        const userRef = doc(firestore, 'users', userId);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
            const currentCoins = userDoc.data()?.coins ?? 0;
            let newBalance;

            if (requestType === 'add') {
                newBalance = currentCoins + amount;
            } else {
                newBalance = currentCoins - amount;
                if (newBalance < 0) {
                    throw new Error("Withdrawal amount exceeds user's balance.");
                }
            }
            batch.update(userRef, { coins: newBalance });
        } else {
            throw new Error(`User document not found for userId: ${userId}`);
        }
    }

    // 3. Commit the atomic batch
    await batch.commit();
}
