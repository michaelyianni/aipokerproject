import './player_action_record.dart';
import 'package:aipoker_flutter_app/models/game_models/pot_model.dart';

class StreetRecord {

  final String streetName;
  final List<String> communityCards; // Current set of community cards for this street
  final List<Pot> potsAtStart; // Pots for this street
  final List<PlayerActionRecord> playerActions; // Actions taken by players during this street

  StreetRecord({
    required this.streetName,
    required this.communityCards,
    required this.potsAtStart,
    required this.playerActions,
  });

  factory StreetRecord.fromJson(Map<String, dynamic> json, String thisPlayerId) {
    final streetName = json['streetName'] ?? 'Unknown Street';
    final communityCards = (json['communityCards'] as List<dynamic>?)
            ?.map((e) => e.toString())
            .toList() ??
        [];
    final potsJson = json['potsAtStart'] as List<dynamic>? ?? [];
    final pots = potsJson
        .map((e) => Pot.fromJson(e as Map<String, dynamic>))
        .toList();
    final playerActionsJson = json['playerActions'] as List<dynamic>? ?? [];
    final playerActions = playerActionsJson
        .map((actionJson) => PlayerActionRecord.fromJson(
            actionJson as Map<String, dynamic>, thisPlayerId))
        .toList();

    return StreetRecord(
      streetName: streetName,
      communityCards: communityCards,
      potsAtStart: pots,
      playerActions: playerActions,
    );
  }
}