import 'package:aipoker_flutter_app/models/game_models/pot_model.dart';
import 'package:aipoker_flutter_app/models/round_history/street_record.dart';
import 'dart:convert'; // For JSON encoding

class RoundHistory {
  final int smallBlindAmount;
  final int bigBlindAmount;
  final Map<String, PlayerInfo> players; // playerId to PlayerInfo
  final List<StreetRecord>
  streetRecords; // Records for each street (pre-flop, flop, turn, river)
  final List<Pot> potsBeforeAward; // Final pots at the end of the hand
  final List<WinnerRecord> winners; // Final winners of the hand
  final Map<String, List<String>>
  shownHoleCards; // playerId to their hole cards if shown at showdown

  RoundHistory({
    required this.smallBlindAmount,
    required this.bigBlindAmount,
    required this.players,
    required this.streetRecords,
    required this.potsBeforeAward,
    required this.winners,
    required this.shownHoleCards, // Map of playerId to their hole cards if shown at showdown
  });

  factory RoundHistory.fromJson(
    Map<String, dynamic> json,
    String thisPlayerId,
  ) {
    /*

    Example server JSON format for RoundHistory:


    */

    final smallBlindAmount = json['smallBlindAmount'] ?? 0;
    final bigBlindAmount = json['bigBlindAmount'] ?? 0;

    final playersJson = json['players'] as Map<String, dynamic>? ?? {};
    final players = <String, PlayerInfo>{};
    playersJson.forEach((playerId, playerData) {
      if (playerData is Map<String, dynamic>) {
        players[playerId] = PlayerInfo.fromJson(playerData);
      }
    });

    final streetRecordsJson = json['streetRecords'] as List<dynamic>? ?? [];
    final streetRecords = streetRecordsJson
        .map(
          (e) => StreetRecord.fromJson(e as Map<String, dynamic>, thisPlayerId),
        )
        .toList();

    final potsAtEndOfHandJson = json['potsBeforeAward'] as List<dynamic>? ?? [];
    final potsBeforeAward = potsAtEndOfHandJson
        .map((e) => Pot.fromJson(e as Map<String, dynamic>))
        .toList();

    final winnersJson = json['winners'] as List<dynamic>? ?? [];
    final winners = winnersJson
        .map((e) => WinnerRecord.fromJson(e as Map<String, dynamic>))
        .toList();

    final shownHoleCardsJson =
        json['shownHoleCards'] as Map<String, dynamic>? ?? {};
    final shownHoleCards = <String, List<String>>{};
    shownHoleCardsJson.forEach((playerId, cards) {
      if (cards is List<dynamic>) {
        shownHoleCards[playerId] = cards.map((e) => e.toString()).toList();
      }
    });



    return RoundHistory(
      smallBlindAmount: smallBlindAmount,
      bigBlindAmount: bigBlindAmount,
      players: players,
      streetRecords: streetRecords,
      potsBeforeAward: potsBeforeAward,
      winners: winners,
      shownHoleCards: shownHoleCards,
    );
  }

  void obscureUnshownHoleCards(String thisPlayerId) {
    // For any player who did not show their hole cards at showdown (except the current player), replace with 'XX'
    players.forEach((playerId, playerInfo) {
      if (playerId != thisPlayerId && !shownHoleCards.containsKey(playerId)) {
        shownHoleCards[playerId] = ['XX', 'XX']; // Obscure hole cards
      }
    });
  }

  String toJsonString() {
    // Used for LLM API calls
    final Map<String, dynamic> jsonMap = {
      'smallBlindAmount': smallBlindAmount,
      'bigBlindAmount': bigBlindAmount,
      'players': players.map(
        (playerId, playerInfo) => MapEntry(playerId, {
          'holeCards': playerInfo.holeCards,
          'seatPosition': playerInfo.seatPosition,
          'blindPosition': playerInfo.blindPosition,
          'startingStack': playerInfo.startingStack,
        }),
      ),
      'streetRecords': streetRecords
          .map(
            (streetRecord) => {
              'streetName': streetRecord.streetName,
              'communityCards': streetRecord.communityCards,
              'potsAtStart': streetRecord.potsAtStart
                  .map(
                    (pot) => {
                      'amount': pot.amount,
                      'eligiblePlayerIds': pot.eligiblePlayerIds,
                    },
                  )
                  .toList(),
              'playerActions': streetRecord.playerActions
                  .map(
                    (action) => {
                      'playerId': action.playerId,
                      'action': action.action,
                      'amountAddedToPot': action.amountAddedToPot,
                      'betTo': action.betTo,
                      'isAllIn': action.isAllIn,
                    },
                  )
                  .toList(),
            },
          )
          .toList(),
      'potsBeforeAward': potsBeforeAward
          .map(
            (pot) => {
              'amount': pot.amount,
              'eligiblePlayerIds': pot.eligiblePlayerIds,
            },
          )
          .toList(),
      'winners': winners
          .map(
            (winner) => {
              'playerId': winner.playerId,
              'amount': winner.amount,
              'reason': winner.reason,
            },
          )
          .toList(),
    };

    // Pretty-printed for readability in prompts (still valid JSON)
    return JsonEncoder.withIndent('  ').convert(jsonMap);
  }
}

class PlayerInfo {
  final List<String> holeCards; // The player's hole cards
  final String seatPosition; // e.g., 'SB', 'BB', 'UTG', etc.
  final String blindPosition; // 'small_blind', 'big_blind', or null
  final int startingStack; // The player's stack at the start of the hand

  PlayerInfo({
    required this.holeCards,
    required this.seatPosition,
    required this.blindPosition,
    required this.startingStack,
  });

  factory PlayerInfo.fromJson(Map<String, dynamic> json) {
    return PlayerInfo(
      holeCards: (json['holeCards'] as List<dynamic>)
          .map((e) => e.toString())
          .toList(),
      seatPosition: json['seatPosition'] ?? 'Unknown',
      blindPosition: json['blindPosition'] ?? 'none',
      startingStack: json['startingStack'] ?? 0,
    );
  }
}

class WinnerRecord {
  final String playerId;
  final int amount; // Amount won from the pot
  final String reason; // e.g., 'best hand' or 'last player standing'

  WinnerRecord({
    required this.playerId,
    required this.amount,
    required this.reason,
  });

  factory WinnerRecord.fromJson(Map<String, dynamic> json) {
    return WinnerRecord(
      playerId: json['playerId'] ?? '',
      amount: json['amount'] ?? 0,
      reason: json['reason'] ?? 'Unknown',
    );
  }
}
