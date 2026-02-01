export default class Pot {
    constructor(chips = 0, eligiblePlayerIds = []) {
        this.amount = chips;
        this.eligiblePlayerIds = eligiblePlayerIds;
    }

    addChips(amount) {
        if (amount < 0) {
            throw new Error('Cannot add negative chips');
        }
        this.amount += amount;
    }

    addEligiblePlayer(playerId) {
        if (!this.eligiblePlayerIds.includes(playerId)) {
            this.eligiblePlayerIds.push(playerId);
        }
    }

    getTotal() {
        return this.amount;
    }

    clear() {
        this.amount = 0;
    }

}