import pokersolver from 'pokersolver';

import assert from 'assert';

var game = 'standard';

var Hand = pokersolver.Hand;
var hand1 = Hand.solve(['Ad', 'As', 'Jc', 'Th', '2d', '3c', 'Kd'], game);
var hand2 = Hand.solve(['Ad', 'As', 'Jc', 'Th', '2d', 'Qs', 'Qd'], game);
var winner = Hand.winners([hand1, hand2]); // hand2

assert.strictEqual(winner[0], hand2);

console.log('BLARG');

var hand3 = Hand.solve(['2d', '3d', '4d', '5d', '6d', '9c', 'Ks'], game);
assert.strictEqual(hand3.name, 'Straight Flush', "Hand should be identified as Straight Flush");
console.log(hand3.descr); // "6d 5d 4d 3d 2d, Straight Flush"#
console.log(hand3.name); // "Straight Flush"

var hand4 = Hand.solve(['Td', 'Jd', 'Qd', 'Kd', 'Ad'], game);
// assert.strictEqual(hand4.name, 'Royal Flush', "Hand should be identified as Royal Flush");
console.log(hand4.descr); // 
console.log(hand4.name); // "Royal Flush"

var hand5 = Hand.solve(['Ad', 'As', 'Jc', 'Th', '2d', '3c', '3d'], game);
var hand6 = Hand.solve(['Ad', 'As', 'Jc', 'Th', '2d', '3s', '3h'], game);
var winner = Hand.winners([hand5, hand6]);

//TIE

console.log('Winners:');
winner.forEach(w => {
    console.log(w.descr);
});