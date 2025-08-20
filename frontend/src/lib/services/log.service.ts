/**
 * @file This service is the single source of truth for creating all user-facing log messages.
 * It centralizes string formatting and ensures a consistent voice throughout the game log.
 */
import { Player, PokerState } from "@/types/pokerTypes";
import { formatCard } from "@/lib/utils";

/**
 * Generates the initial series of logs when a new hand is set up, including
 * dealt cards, dealer position, and posted blinds.
 * @param state The newly created PokerState for the hand.
 * @returns An array of formatted log message strings.
 */
export function createHandSetupLogs(state: PokerState): string[] {
    const logs: string[] = [];
    const { players, stakes } = state;

    players.forEach(p => {
        if (p.cards) {
            const formattedCards = `${formatCard(p.cards[0])}${formatCard(p.cards[1])}`;
            logs.push(`${p.name} is dealt ${formattedCards}`);
        }
    });

    logs.push("---");
    
    const dealer = players.find(p => p.position === 'dealer');
    if (dealer) logs.push(`${dealer.name} is the dealer`);

    const sbPlayer = players.find(p => p.position === 'smallblind');
    if (sbPlayer) logs.push(`${sbPlayer.name} posts small blind - ${stakes.smallBlind} chips`);

    const bbPlayer = players.find(p => p.position === 'bigblind');
    if (bbPlayer) logs.push(`${bbPlayer.name} posts big blind - ${stakes.bigBlind} chips`);

    logs.push("---");
    return logs;
}

/**
 * Generates a log message for a specific player action (e.g., fold, call, raise).
 * @param state The PokerState *before* the action was processed.
 * @param action The action object dispatched to the reducer.
 * @returns A single formatted log message string.
 */
export function createPlayerActionLog(state: PokerState, action: { type: string, amount?: number }): string {
    const player = state.players.find(p => p.id === state.currentPlayer)!;
    switch (action.type) {
        case 'HANDLE_FOLD': return `${player.name} folds`;
        case 'HANDLE_CALL_CHECK': {
            return state.currentBet > player.bet ? `${player.name} calls` : `${player.name} checks`;
        }
        case 'HANDLE_BET_RAISE': {
            const isRaise = state.currentBet > 0;
            return isRaise ? `${player.name} raises to ${action.amount} chips` : `${player.name} bets ${action.amount} chips`;
        }
        case 'HANDLE_ALL_IN': return `${player.name} goes all-in for ${player.stack} chips`;
        default: return "";
    }
}

/**
 * Generates a log message for community cards being dealt.
 * @param stage The current game stage ('flop', 'turn', or 'river').
 * @param cards The array of community cards that were just dealt.
 * @returns An array containing a separator and the formatted log message.
 */
export function createCommunityCardLog(stage: 'flop' | 'turn' | 'river', cards: string[]): string[] {
    const stageName = stage.charAt(0).toUpperCase() + stage.slice(1);
    const formattedCards = cards.map(formatCard).join('');
    return ["---", `${stageName} cards dealt: ${formattedCards}`];
}

/**
 * Generates the final logs for when a hand ends, declaring the winner and the final pot.
 * @param state The final PokerState of the hand.
 * @param winner The winning player object.
 * @param pot The final pot amount won.
 * @returns An array of formatted log message strings.
 */
export function createEndOfHandLogs(state: PokerState, winner: Player, pot: number): string[] {
    return [
        `${winner.name} wins the pot of ${pot}`,
        `Hand #${state.handId} ended`,
        `Final pot was ${pot}`
    ];
}
