class CommunityCards {
  final List<String> cards;


  const CommunityCards({required this.cards});

  factory CommunityCards.fromJson(Map<String, dynamic> json) {
    final cards = (json['cards'] as List<dynamic>?)?.map((e) => e.toString()).toList() ?? [];
    return CommunityCards(cards: cards);
  }

  Map<String, dynamic> toJson() {
    return {'cards': cards};
  }

  factory CommunityCards.empty() {
    return const CommunityCards(cards: []);
  }
}
