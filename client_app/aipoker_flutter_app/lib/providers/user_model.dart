import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:aipoker_flutter_app/models/round_history/round_history.dart'; // Import RoundHistory model

class UserModel {
  final String? username;
  final String? playerId;
  List<RoundHistory> roundHistories = []; // Add roundHistories to UserModel

  UserModel({this.username, String? playerId}) : playerId = playerId ?? 'unknown_player_id';

  UserModel copyWith({String? username, String? playerId}) {
    return UserModel(
      username: username ?? this.username,
      playerId: playerId ?? this.playerId,
    );
  }

  String getRoundHistories() {
    return roundHistories.map((rh) => rh.toJsonString()).join('\n');
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

  void addRoundHistory(RoundHistory roundHistory) {
    
    if (state.roundHistories.length >= 20) {
      state.roundHistories.removeAt(0);
    }
    
    state.roundHistories.add(roundHistory);
    // Notify listeners that the state has changed
    state = UserModel(username: state.username, playerId: state.playerId)..roundHistories = state.roundHistories;
  }

}

// Provider definition
final userProvider = NotifierProvider<UserNotifier, UserModel>(() {
  return UserNotifier();
});