import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:aipoker_flutter_app/models/round_history/round_history.dart'; // Import RoundHistory model
import 'dart:convert'; // For JSON encoding

class UserModel {
  String? username;
  String? playerId;
  List<RoundHistory> roundHistories = []; // Add roundHistories to UserModel
  bool hasReceivedNewRoundHistory = false; // Flag to track if a new round history has been added
  String feedback = 'No feedback available - play some rounds to get feedback!'; // Add feedback field to UserModel

  UserModel({this.username, String? playerId}) : playerId = playerId ?? 'unknown_player_id';

  UserModel copyWith({String? username, String? playerId}) {
    return UserModel(
      username: username ?? this.username,
      playerId: playerId ?? this.playerId,
    );
  }

  String getRoundHistories() {
    

    return JsonEncoder.withIndent('  ').convert(getRoundHistoriesAsJson());
  }

  Map<String, dynamic> getRoundHistoriesAsJson() {
    // Convert round histories to JSON-serializable map with 'hands' parent
    final handsJson = roundHistories.map((round) => round.toJson()).toList();
    return {'hands': handsJson};
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
    
    if (state.roundHistories.length >= 10) {
      state.roundHistories.removeAt(0);
    }
    
    state.roundHistories.add(roundHistory);

    state.hasReceivedNewRoundHistory = true;
  }
  

  void setFeedback(String feedback) {
    state.feedback = feedback;
    state.hasReceivedNewRoundHistory = false; // Reset the flag after setting feedback
  }

}

// Provider definition
final userProvider = NotifierProvider<UserNotifier, UserModel>(() {
  return UserNotifier();
});