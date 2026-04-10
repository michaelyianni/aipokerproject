import 'winner_model.dart';

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

