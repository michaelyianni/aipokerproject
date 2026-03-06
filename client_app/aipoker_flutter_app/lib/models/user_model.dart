import 'package:flutter_riverpod/flutter_riverpod.dart';

class UserModel {
  final String? username;
  final String? playerId;

  UserModel({this.username, String? playerId}) : playerId = playerId ?? 'unknown_player_id';

  UserModel copyWith({String? username, String? playerId}) {
    return UserModel(
      username: username ?? this.username,
      playerId: playerId ?? this.playerId,
    );
  }
}

// Create the Riverpod provider
class UserNotifier extends Notifier<UserModel> {
  @override
  UserModel build() {
    return UserModel(username: null, playerId: null);
  }

  void setUsername(String username) {
    state = state.copyWith(username: username);
  }

  void clearUsername() {
    state = UserModel(username: null);
  }

  void setPlayerId(String playerId) {
    state = state.copyWith(playerId: playerId);
  }

  void clearPlayerId() {
    state = UserModel(username: state.username, playerId: null);
  }
}

// Provider definition
final userProvider = NotifierProvider<UserNotifier, UserModel>(() {
  return UserNotifier();
});