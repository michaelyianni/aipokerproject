import 'package:flutter/widgets.dart';
import 'game_models/player_model.dart';
import 'game_models/comm_cards_model.dart';
import 'game_models/pot_model.dart';

class GameState {
  // Community cards
  final CommunityCards communityCards;
  // Players
  final Map<String, Player> players; // Server sends object/map, not array
  // thisPlayer
  final Player thisPlayer; // The player object for the current user
  // seatAssignments
  final Map<int, String>
  seatAssignments; // Array of player IDs in seating order
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
  });

  // Convert to list for UI
  List<Player> get playerList => players.values.toList();
  int get playerCount => players.length;

  factory GameState.fromJson(Map<String, dynamic> json, String thisPlayerId) {
    /* Server format:  
  {
    "communityCards": [
      "2d",
      "6s",
      "6c",
      "2s",
      "7c"
    ],
    "players": {
      "id49": {
        "id": "id49",
        "name": "Alice",
        "chips": 0,
        "currentBet": 890,
        "totalBetThisHand": 1000,
        "hasFolded": false,
        "isAllIn": true,
        "hasLeft": false
      },
      ...
    },
    "playerOrder": [
      "id49",
      "id50",
      "id51",
      "id52"
    ],
    "currentTurnPlayerId": "id52",
    "activePlayerIds": [
      "id49",
      "id52"
    ],
    "pots": [
      {
        "amount": 335,
        "eligiblePlayerIds": [
          "id49",
          "id52"
        ]
      }
    ],
    "currentBet": 890,
    "currentStreet": "river",
    "smallBlindId": "id50",
    "bigBlindId": "id51",
    "dealerId": "id49",
    "handResults": null
  }
  */

    // Hard-code json string for now, will replace with real server data later

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
    final thisPlayer =
        players[thisPlayerId] ??
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

    // Parse seat assignments (Re-order playerOrder such that thisPlayerId is first, then the rest in order)
    final playerOrder =
        (json['playerOrder'] as List<dynamic>?)
            ?.map((e) => e.toString())
            .toList() ??
        [];

    final seatAssignments = _reorderSeats(playerOrder, thisPlayerId);

    // Parse pots
    final potsJson = json['pots'] as List<dynamic>? ?? [];
    final pots = potsJson
        .map((potJson) => Pot.fromJson(potJson as Map<String, dynamic>))
        .toList();

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
    // e.g., ["id49", "id50", "id51", "id52"] with thisPlayerId = "id51"
    // becomes ["id51", "id52", "id49", "id50"]
    final reordered = [
      ...playerOrder.sublist(thisPlayerIndex),
      ...playerOrder.sublist(0, thisPlayerIndex),
    ];

    // Remove thisPlayerId from the list
    final reorderedWithoutThisPlayer = reordered
        .where((id) => id != thisPlayerId)
        .toList();

    final int maxSeats = 5; // Assuming max 5 players at the table (not including thisPlayer)

    // Map players at end to end of seat assignments, players at start to start of seat assignments
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
}
