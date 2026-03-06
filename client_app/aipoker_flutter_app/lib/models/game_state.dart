import 'package:flutter/widgets.dart';
import 'game_models/player.dart';
import 'game_models/community_cards.dart';
import 'game_models/pot.dart';
class GameState {
  // Community cards
  final CommunityCards communityCards;
  // Players
  final Map<String, Player> players; // Server sends object/map, not array
  // thisPlayer
  final Player thisPlayer; // The player object for the current user
  // currentTurnPlayerId
  final String currentTurnPlayerId;
  // pots
  final List<Pot> pots;
  // currentBet
  final int currentBet;
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
    required this.currentTurnPlayerId,
    required this.pots,
    required this.currentBet,
    required this.currentStreet,
    required this.smallBlindId,
    required this.bigBlindId,
    required this.dealerId,
  });

  // Convert to list for UI
  List<Player> get playerList => players.values.toList();
  int get playerCount => players.length;

  factory GameState.fromJson(Map<String, dynamic> json) {
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

    final playersMap = <String, Player>{};

    final playersJson = json['players'] ?? json;
    for (var entry in playersJson.entries) {
      if (entry.value is Map<String, dynamic>) {
        final player = Player.fromJson(entry.value);
        playersMap[player.playerId] = player; // Use playerId as key
      }
    }

    return GameState(
      players: playersMap,
      communityCards: CommunityCards.fromJson(json['communityCards'] ?? {}),
      thisPlayer: Player.fromJson(json['thisPlayer'] ?? {}),
      currentTurnPlayerId: json['currentTurnPlayerId'] ?? '',
      pots: (json['pots'] as List<dynamic>?)
              ?.map((e) => Pot.fromJson(e))
              .toList() ??
          [],
      currentBet: json['currentBet'] ?? 0,
      currentStreet: json['currentStreet'] ?? '',
      smallBlindId: json['smallBlindId'] ?? '',
      bigBlindId: json['bigBlindId'] ?? '',
      dealerId: json['dealerId'] ?? '',
    );
  }

  GameState copyWith({
    Map<String, Player>? players,
    String? hostPlayerId,
    bool? isGameStarted,
  }) {
    return GameState(
      players: players ?? this.players,
      communityCards: communityCards,
      thisPlayer: thisPlayer,
      currentTurnPlayerId: currentTurnPlayerId,
      pots: pots,
      currentBet: currentBet,
      currentStreet: currentStreet,
      smallBlindId: smallBlindId,
      bigBlindId: bigBlindId,
      dealerId: dealerId,
    );
  }
}


