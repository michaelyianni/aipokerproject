import 'package:aipoker_flutter_app/models/game_models/pot_model.dart';
import 'package:aipoker_flutter_app/models/round_history/street_record.dart';
import 'dart:convert';

import 'package:flutter/cupertino.dart'; // For JSON encoding

class RoundHistory {
  final int smallBlindAmount;
  final int bigBlindAmount;
  final Map<String, PlayerInfo> playerInfo; // playerId to PlayerInfo
  final List<StreetRecord>
  streetRecords; // Records for each street (pre-flop, flop, turn, river)
  final List<Pot> potsBeforeAward; // Final pots at the end of the hand
  final List<WinnerRecord> winners; // Final winners of the hand
  final Map<String, List<String>> shownHoleCards; // playerId to their hole cards if shown at showdown

  RoundHistory({
    required this.smallBlindAmount,
    required this.bigBlindAmount,
    required this.playerInfo,
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

    final playersJson = json['playerInfo'] as Map<String, dynamic>? ?? {};
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
      playerInfo: players,
      streetRecords: streetRecords,
      potsBeforeAward: potsBeforeAward,
      winners: winners,
      shownHoleCards: shownHoleCards,
    );
  }

  void obscureUnshownHoleCards(String thisPlayerId) {
    // For any player who did not show their hole cards at showdown (except the current player), replace with 'XX'
    playerInfo.forEach((playerId, playerInfo) {
      if (playerId != thisPlayerId) {
        playerInfo.holeCards = ['XX', 'XX']; // Obscure hole cards

      }
    });
  }

  void renameThisPlayerAsHero(String thisPlayerId) {
    
    // Player info
    if (playerInfo.containsKey(thisPlayerId)) {
      final info = playerInfo[thisPlayerId]!;
      playerInfo['hero'] = PlayerInfo(
        holeCards: info.holeCards,
        seatPosition: info.seatPosition,
        blindPosition: info.blindPosition,
        startingStack: info.startingStack,
      );
      playerInfo.remove(thisPlayerId);
    }

    // Shown hole cards
    if (shownHoleCards.containsKey(thisPlayerId)) {
      shownHoleCards['hero'] = shownHoleCards[thisPlayerId]!;
      shownHoleCards.remove(thisPlayerId);
    }

    // Pots before award
    for (var pot in potsBeforeAward) {
      if (pot.eligiblePlayerIds.contains(thisPlayerId)) {
        pot.eligiblePlayerIds.remove(thisPlayerId);
        pot.eligiblePlayerIds.add('hero');
      }
    }


    // Street records
    for (var street in streetRecords) {
      // Player actions
      for (var action in street.playerActions) {
        if (action.playerId == thisPlayerId) {
          action.playerId = 'hero';
        }
      }
      
      // Pots
      for (var pot in street.potsAtStart) {
        if (pot.eligiblePlayerIds.contains(thisPlayerId)) {
          pot.eligiblePlayerIds.remove(thisPlayerId);
          pot.eligiblePlayerIds.add('hero');
        }
      }
    }

    // Winners
    for (var winner in winners) {
      if (winner.playerId == thisPlayerId) {
        winner.playerId = 'hero';
      }
    }
  }

  void postProcessAfterDataCollection(String thisPlayerId) {
    // Call this after processing the showdown to obscure unshown hole cards for any players who did not show
    obscureUnshownHoleCards(thisPlayerId);
    renameThisPlayerAsHero(thisPlayerId);
  }

  String toJsonString() {
    // Used for LLM API calls
    final Map<String, dynamic> jsonMap = {
      'smallBlindAmount': smallBlindAmount,
      'bigBlindAmount': bigBlindAmount,
      'playerInfo': this.playerInfo.map(
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
                      'toCallBefore': action.toCallBefore,
                      'streetContributionAfter': action.streetContributionAfter,
                      'tableCurrentBetAfter': action.tableCurrentBetAfter,
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
      'shownHoleCards': shownHoleCards,
    };

    // Pretty-printed for readability in prompts (still valid JSON)
    return JsonEncoder.withIndent('  ').convert(jsonMap);
  }
}

class PlayerInfo {
  List<String> holeCards; // The player's hole cards
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
  String playerId;
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
