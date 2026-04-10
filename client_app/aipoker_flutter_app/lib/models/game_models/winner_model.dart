class Winner {
  String playerId;
  final int amount;
  final String reason;

  Winner({
    required this.playerId,
    required this.amount,
    required this.reason,
  });

  factory Winner.fromJson(Map<String, dynamic> json) {
    return Winner(
      playerId: json['playerId'] ?? '',
      amount: json['amount'] ?? 0,
      reason: json['reason'] ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'playerId': playerId,
      'amount': amount,
      'reason': reason,
    };
  }
}

