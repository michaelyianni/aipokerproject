import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:aipoker_flutter_app/models/hand_history/hand_history.dart'; // Import RoundHistory model
import 'dart:convert'; // For JSON encoding

class UserModel {
  String? username;
  String? playerId;
  List<HandHistory> handHistories = []; // Add handHistories to UserModel
  bool hasReceivedNewHandHistory = false; // Flag to track if a new hand history has been added
  String feedback = 'No feedback available - play some rounds to get feedback!'; // Add feedback field to UserModel

  UserModel({this.username, String? playerId}) : playerId = playerId ?? 'unknown_player_id';

  UserModel copyWith({String? username, String? playerId}) {
    return UserModel(
      username: username ?? this.username,
      playerId: playerId ?? this.playerId,
    );
  }

  String getHandHistories() {
    

    return JsonEncoder.withIndent('  ').convert(getHandHistoriesAsJson());
  }

  Map<String, dynamic> getHandHistoriesAsJson() {
    // Convert hand histories to JSON-serializable map with 'hands' parent
    final handsJson = handHistories.map((hand) => hand.toJson()).toList();
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

  void addHandHistory(HandHistory handHistory) {
    
    if (state.handHistories.length >= 10) {
      state.handHistories.removeAt(0);
    }
    
    state.handHistories.add(handHistory);

    state.hasReceivedNewHandHistory = true;
  }
  

  void setFeedback(String feedback) {
    state.feedback = feedback;
    state.hasReceivedNewHandHistory = false; // Reset the flag after setting feedback
  }

}

// Provider definition
final userProvider = NotifierProvider<UserNotifier, UserModel>(() {
  return UserNotifier();
});