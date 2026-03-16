class PlayerActionRecord {
  final String playerId;
  final String action; // e.g., 'FOLD', 'CALL', 'RAISE', 'CHECK', 'POST_SB', 'POST_BB', etc.
  final int amountAddedToPot; // Amount involved in the action, if applicable
  final int betTo; // The total bet amount the player is now committed to after this action
  final bool isAllIn; // Whether this action resulted in the player going all-in

  PlayerActionRecord({
    required this.playerId,
    required this.action,
    required this.amountAddedToPot,
    required this.betTo,
    required this.isAllIn,
  });

  factory PlayerActionRecord.fromJson(Map<String, dynamic> json, String thisPlayerId) {

    String playerId = json['playerId'] ?? 'Unknown Player';

    if (json['playerId'] == thisPlayerId) {

      playerId = 'hero'; // Use 'hero' to represent the current player in the UI
    }

    return PlayerActionRecord(
      playerId: playerId,
      action: json['action'],
      amountAddedToPot: json['amountAddedToPot'],
      betTo: json['betTo'],
      isAllIn: json['isAllIn'],
    );
  }
}