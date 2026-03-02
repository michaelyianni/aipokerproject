import 'package:flutter/widgets.dart';

class LobbyState {
  final Map<String, Player> players; // Server sends object/map, not array
  final String? hostPlayerId;
  final bool isGameStarted;

  const LobbyState({
    required this.players,
    this.hostPlayerId,
    this.isGameStarted = false,
  });

  // Convert to list for UI
  List<Player> get playerList => players.values.toList();
  int get playerCount => players.length;

  factory LobbyState.fromJson(Map<String, dynamic> json) {
    // Server format: {players: [{id: id10, username: Player1772415094235}], isGameStarted: false}

    final playersMap = <String, Player>{};

    final playersJson = json['players'] ?? json;
    for (var playerData in playersJson) {
      if (playerData is Map<String, dynamic>) {
        final player = Player.fromJson(playerData);
        playersMap[player.playerId] = player; // Use playerId as key
      }
    }

    return LobbyState(
      players: playersMap,
      hostPlayerId: json['hostPlayerId'],
      isGameStarted: json['isGameStarted'] ?? false,
    );
  }

  LobbyState copyWith({
    Map<String, Player>? players,
    String? hostPlayerId,
    bool? isGameStarted,
  }) {
    return LobbyState(
      players: players ?? this.players,
      hostPlayerId: hostPlayerId ?? this.hostPlayerId,
      isGameStarted: isGameStarted ?? this.isGameStarted,
    );
  }
}

class Player {
  final String playerId;
  final String username;

  const Player({required this.playerId, required this.username});

  factory Player.fromJson(Map<String, dynamic> json) {
    return Player(
      playerId: json['id'] ?? '',
      username: json['username'] ?? 'Unknown',
    );
  }

  Map<String, dynamic> toJson() {
    return {'playerId': playerId, 'username': username};
  }
}
