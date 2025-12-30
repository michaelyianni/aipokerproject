export default class Pot {
    constructor() {
        this.total = 0;
    }

    addChips(amount) {
        if (amount < 0) {
            throw new Error('Cannot add negative chips');
        }
        this.total += amount;
    }

    getTotal() {
        return this.total;
    }

    clear() {
        this.total = 0;
    }

}