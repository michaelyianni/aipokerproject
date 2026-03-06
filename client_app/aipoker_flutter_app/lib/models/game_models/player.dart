class Player {
  final String playerId;
  final String name;
  final int chips;
  final int currentBet;
  final int totalBetThisHand;
  final bool hasFolded;
  final bool isAllIn;
  final bool hasLeft;


  const Player({required this.playerId, required this.name, required this.chips, required this.currentBet, required this.totalBetThisHand, required this.hasFolded, required this.isAllIn, required this.hasLeft});

  factory Player.fromJson(Map<String, dynamic> json) {
    return Player(
      playerId: json['id'] ?? '',
      name: json['name'] ?? 'Unknown',
      chips: json['chips'] ?? 0,
      currentBet: json['currentBet'] ?? 0,
      totalBetThisHand: json['totalBetThisHand'] ?? 0,
      hasFolded: json['hasFolded'] ?? false,
      isAllIn: json['isAllIn'] ?? false,
      hasLeft: json['hasLeft'] ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {'playerId': playerId, 'name': name, 'chips': chips, 'currentBet': currentBet, 'totalBetThisHand': totalBetThisHand, 'hasFolded': hasFolded, 'isAllIn': isAllIn, 'hasLeft': hasLeft};
  }
}