import pokersolver from 'pokersolver';
import Card from '../models/Card.js';
import FullHand from '../models/FullHand.js';

export const evaluateHand = (fullHand) => {
    const cardStrings = fullHand.convertCardsToStringArray();
    const hand = pokersolver.Hand.solve(cardStrings);
    return hand;
}

export const compareHands = (fullHands) => {
    
    // Evaluate each full hand
    const evaluatedHands = fullHands.map(fullHand => {
        return {
            player: fullHand.getPlayer(),
            hand: evaluateHand(fullHand)
        };
    });

    // Determine the winner(s)
    const winningHands = pokersolver.Hand.winners(evaluatedHands.map(eh => eh.hand));
    const winners = evaluatedHands.filter(eh => winningHands.includes(eh.hand));

    return winners;
}