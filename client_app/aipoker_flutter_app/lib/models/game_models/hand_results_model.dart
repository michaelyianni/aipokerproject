class HandResults {
  final List<Winner> winners;
  final List<String> otherActivePlayers;

  const HandResults({
    required this.winners,
    required this.otherActivePlayers,
  });

  factory HandResults.fromJson(Map<String, dynamic> json) {
    final winnersJson = json['winners'] as List<dynamic>? ?? [];
    final winners = winnersJson
        .map((winnerJson) => Winner.fromJson(winnerJson as Map<String, dynamic>))
        .toList();

    final otherActivePlayersJson = json['otherActivePlayers'] as List<dynamic>? ?? [];
    final otherActivePlayers = otherActivePlayersJson
        .map((e) => e.toString())
        .toList();

    return HandResults(
      winners: winners,
      otherActivePlayers: otherActivePlayers,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'winners': winners.map((w) => w.toJson()).toList(),
      'otherActivePlayers': otherActivePlayers,
    };
  }
}

class Winner {
  final String playerId;
  final int amount;
  final String reason;

  const Winner({
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