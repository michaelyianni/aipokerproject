class PlayerActionRecord {
  final String playerId;
  final String action; // e.g., 'fold', 'call', 'raise', 'check', 'all-in'
  final int amount; // Amount involved in the action, if applicable
  final String street; // The street on which the action occurred (pre-flop, flop, turn, river)

  PlayerActionRecord({
    required this.playerId,
    required this.action,
    required this.amount,
    required this.street,
  });
}