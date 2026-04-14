import 'package:flutter/foundation.dart';
import '../services/server_service.dart';
import '../models/lobby_state.dart';
import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/user_model.dart';

class AIFeedbackViewmodel extends ChangeNotifier{

  final ServerService _serverService;
  final UserModel _userModel;
  final UserNotifier _userNotifier;

  String? _feedback; 
  String? _errorMessage;
  bool _isLoading = false;
  String? _username;


  // Getters
  String? get feedback => _feedback; 
  bool get isLoading => _isLoading;

  String get username => _username ?? 'Unknown';
  set username(String value) {
    _username = value;
  }

  AIFeedbackViewmodel(this._serverService, this._userModel, this._userNotifier) {
    // Initialize any necessary streams or data here
    debugPrint('[AIFeedbackViewmodel] Initialized with ServerService and UserModel');

    if (_userModel.hasReceivedNewHandHistory) {
      debugPrint('[AIFeedbackViewmodel] Detected new hand history on initialization, fetching AI feedback');
      fetchAIFeedback();
    }
    else {
      debugPrint('[AIFeedbackViewmodel] No new hand history detected on initialization, displaying previous feedback.');

      _feedback = _userModel.feedback; // Load existing feedback from UserModel
      notifyListeners(); // Notify listeners to update UI with existing feedback
    }

  }


  void fetchAIFeedback() {
    final handHistoryJson = _userModel.getHandHistories();

    _feedback = null; // Clear previous feedback
    _isLoading = true; // Set loading state

    notifyListeners(); // Notify listeners to update UI with loading state

    Future<String?> aiFeedbackFuture = _serverService.getAIFeedback(handHistoryJson);


    aiFeedbackFuture.then((feedback) {
      debugPrint('[AIFeedbackViewmodel] Received AI feedback: $feedback');

      _isLoading = false;

      if (feedback != null) {
        _feedback = feedback;
        _userNotifier.setFeedback(feedback);
      }

      notifyListeners(); // Notify listeners to update UI with new feedback

    }).catchError((error) {
      debugPrint('[AIFeedbackViewmodel] Error fetching AI feedback: $error');
      _errorMessage = 'Failed to fetch AI feedback: $error';
      _isLoading = false;
      notifyListeners();
    });
  }



}