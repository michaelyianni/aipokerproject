class PlayerActionRecord {
  String playerId;
  final String action; // e.g., 'FOLD', 'CALL', 'RAISE', 'CHECK', 'POST_SB', 'POST_BB', etc.
  final int amountAddedToPot; // Amount involved in the action, if applicable
  final int toCallBefore; // Amount the player needed to call before taking this action
  final int streetContributionAfter; // Total amount the player has contributed to the pot in this street after this action
  final int tableCurrentBetAfter; // Current bet on the table after this action
  final bool isAllIn; // Whether this action resulted in the player going all-in

  PlayerActionRecord({
    required this.playerId,
    required this.action,
    required this.amountAddedToPot,
    required this.toCallBefore,
    required this.streetContributionAfter,
    required this.tableCurrentBetAfter,
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
      toCallBefore: json['toCallBefore'],
      streetContributionAfter: json['streetContributionAfter'],
      tableCurrentBetAfter: json['tableCurrentBetAfter'],
      isAllIn: json['isAllIn'],
    );
  }
}