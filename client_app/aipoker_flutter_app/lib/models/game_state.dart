import 'package:flutter/widgets.dart';
import 'game_models/player_model.dart';
import 'game_models/comm_cards_model.dart';
import 'game_models/pot_model.dart';
import 'game_models/hand_results_model.dart';

class GameState {
  // Community cards
  final CommunityCards communityCards;
  // Players
  final Map<String, Player> players; // Server sends object/map, not array
  // thisPlayer
  final Player thisPlayer; // The player object for the current user
  // seatAssignments
  final Map<int, String> seatAssignments; // Array of player IDs in seating order
  // currentTurnPlayerId
  final String currentTurnPlayerId;
  // pots
  final List<Pot> pots;
  // currentBet
  final int currentBet;
  // minimumRaise
  final int minimumRaise;
  // currentStreet
  final String currentStreet;
  // smallBlindId
  final String smallBlindId;
  // bigBlindId
  final String bigBlindId;
  // dealerId
  final String dealerId;
  // handResults (nullable)
  final HandResults? handResults;

  const GameState({
    required this.players,
    required this.communityCards,
    required this.thisPlayer,
    required this.seatAssignments,
    required this.currentTurnPlayerId,
    required this.pots,
    required this.currentBet,
    required this.minimumRaise,
    required this.currentStreet,
    required this.smallBlindId,
    required this.bigBlindId,
    required this.dealerId,
    this.handResults,
  });

  // Convert to list for UI
  List<Player> get playerList => players.values.toList();
  int get playerCount => players.length;

  // Helper getters for hand results
  bool get hasHandResults => handResults != null;
  bool get isHandComplete => currentStreet == 'hand_complete';
  List<Winner> get winners => handResults?.winners ?? [];
  
  // Check if this player won
  bool isWinner(String playerId) {
    return winners.any((winner) => winner.playerId == playerId);
  }
  
  // Get winnings for a specific player
  int getWinnings(String playerId) {
    final winner = winners.firstWhere(
      (w) => w.playerId == playerId,
      orElse: () => Winner(playerId: '', amount: 0, reason: ''),
    );
    return winner.amount;
  }

  factory GameState.fromJson(Map<String, dynamic> json, String thisPlayerId) {
    // Parse players
    final playersJson = json['players'] as Map<String, dynamic>? ?? {};
    final players = playersJson.map(
      (key, value) =>
          MapEntry(key, Player.fromJson(value as Map<String, dynamic>)),
    );

    // Parse community cards
    final communityCardsJson = json['communityCards'] as List<dynamic>? ?? [];
    final communityCards = CommunityCards(
      cards: communityCardsJson.map((e) => e.toString()).toList(),
    );

    // Find thisPlayer (matches thisPlayerId)
    final thisPlayer = players[thisPlayerId] ??
        Player(
          playerId: thisPlayerId,
          name: 'Unknown',
          chips: 0,
          hand: [],
          currentBet: 0,
          totalBetThisHand: 0,
          hasFolded: false,
          isAllIn: false,
          hasLeft: false,
        );

    // Parse seat assignments
    final playerOrder = (json['playerOrder'] as List<dynamic>?)
            ?.map((e) => e.toString())
            .toList() ??
        [];

    final seatAssignments = _reorderSeats(playerOrder, thisPlayerId);

    // Parse pots
    final potsJson = json['pots'] as List<dynamic>? ?? [];
    final pots = potsJson
        .map((potJson) => Pot.fromJson(potJson as Map<String, dynamic>))
        .toList();

    // Parse hand results (nullable)
    final handResultsJson = json['handResults'];
    final handResults = handResultsJson != null
        ? HandResults.fromJson(handResultsJson as Map<String, dynamic>)
        : null;

    // Parse the rest as normal
    return GameState(
      players: players,
      communityCards: communityCards,
      thisPlayer: thisPlayer,
      seatAssignments: seatAssignments,
      currentTurnPlayerId: json['currentTurnPlayerId'] ?? '',
      pots: pots,
      currentBet: json['currentBet'] ?? 0,
      minimumRaise: json['minimumRaise'] ?? 0,
      currentStreet: json['currentStreet'] ?? '',
      smallBlindId: json['smallBlindId'] ?? '',
      bigBlindId: json['bigBlindId'] ?? '',
      dealerId: json['dealerId'] ?? '',
      handResults: handResults,
    );
  }

  // Helper method to reorder seats so thisPlayerId is first
  static Map<int, String> _reorderSeats(
    List<String> playerOrder,
    String thisPlayerId,
  ) {
    if (playerOrder.isEmpty || !playerOrder.contains(thisPlayerId)) {
      debugPrint(
        'Warning: playerOrder is empty or does not contain thisPlayerId. Returning original order.',
      );
      return playerOrder.asMap();
    }

    final thisPlayerIndex = playerOrder.indexOf(thisPlayerId);

    // Rotate the list so thisPlayerId is first
    final reordered = [
      ...playerOrder.sublist(thisPlayerIndex),
      ...playerOrder.sublist(0, thisPlayerIndex),
    ];

    // Remove thisPlayerId from the list
    final reorderedWithoutThisPlayer =
        reordered.where((id) => id != thisPlayerId).toList();

    final int maxSeats = 5;

    // Map players at end to end of seat assignments, players at start to start
    final seatAssignments = <int, String>{};
    for (int i = 0; i < reorderedWithoutThisPlayer.length / 2; i++) {
      seatAssignments[i] = reorderedWithoutThisPlayer[i];

      if (i != reorderedWithoutThisPlayer.length - 1 - i) {
        seatAssignments[maxSeats - 1 - i] =
            reorderedWithoutThisPlayer[reorderedWithoutThisPlayer.length - 1 - i];
      }
    }

    debugPrint('Original player order: $playerOrder');
    debugPrint('Reordered seat assignments: $seatAssignments');

    return seatAssignments;
  }

  GameState copyWith({
    Map<String, Player>? players,
    CommunityCards? communityCards,
    Player? thisPlayer,
    Map<int, String>? seatAssignments,
    String? currentTurnPlayerId,
    List<Pot>? pots,
    int? currentBet,
    int? minimumRaise,
    String? currentStreet,
    String? smallBlindId,
    String? bigBlindId,
    String? dealerId,
    HandResults? handResults,
  }) {
    return GameState(
      players: players ?? this.players,
      communityCards: communityCards ?? this.communityCards,
      thisPlayer: thisPlayer ?? this.thisPlayer,
      seatAssignments: seatAssignments ?? this.seatAssignments,
      currentTurnPlayerId: currentTurnPlayerId ?? this.currentTurnPlayerId,
      pots: pots ?? this.pots,
      currentBet: currentBet ?? this.currentBet,
      minimumRaise: minimumRaise ?? this.minimumRaise,
      currentStreet: currentStreet ?? this.currentStreet,
      smallBlindId: smallBlindId ?? this.smallBlindId,
      bigBlindId: bigBlindId ?? this.bigBlindId,
      dealerId: dealerId ?? this.dealerId,
      handResults: handResults ?? this.handResults,
    );
  }
}