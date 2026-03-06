import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import '../services/server_service.dart';
import 'dart:async';
import 'package:go_router/go_router.dart';
import '../models/game_state.dart';  // You'll need to create this

class GameViewModel extends ChangeNotifier {
  final ServerService _serverService;
  
  GameState? _gameState;
  String? _errorMessage;
  bool _isLoading = true;

  StreamSubscription<GameState>? _gameStateSubscription;
  StreamSubscription<void>? _handResultsSubscription; // TODO: Change to correct type when HandResults is defined
  StreamSubscription<String>? _errorSubscription;

  // Getters
  GameState? get gameState => _gameState;
  String? get errorMessage => _errorMessage;
  bool get isLoading => _isLoading;

  GameViewModel(this._serverService) {
    _listenToServiceStreams();
  }

  void _listenToServiceStreams() {
    // Listen for game state updates from the server
    _gameStateSubscription = _serverService.gameStateStream.listen(
      (state) {
        debugPrint('[GameViewModel] Received game state update');
        _gameState = state;
        _isLoading = false;
        notifyListeners();
      },
      onError: (error) {
        debugPrint('[GameViewModel] Error in game state stream: $error');
        _errorMessage = error.toString();
        notifyListeners();
      },
    );

    _handResultsSubscription = _serverService.handResultsStream.listen(
      (results) {
        debugPrint('[GameViewModel] Received hand results update');
        // Handle hand results update
        notifyListeners();
      },
      onError: (error) {
        debugPrint('[GameViewModel] Error in hand results stream: $error');
        _errorMessage = error.toString();
        notifyListeners();
      },
    );

    // Listen for errors
    _errorSubscription = _serverService.errorStream.listen((error) {
      debugPrint('[GameViewModel] Received error: $error');
      _errorMessage = error;
      notifyListeners();
    });
  }

  // Game actions
  Future<void> performAction(String action, {dynamic data}) async {
    debugPrint('[GameViewModel] Performing action: $action');
    // await _serverService.sendGameAction(action, data: data);
  }

  // Add other game-specific methods here
  Future<void> fold() async {
    await performAction('fold');
  }

  Future<void> call() async {
    await performAction('call/check');
  }

  Future<void> raise(int amount) async {
    await performAction('bet/raise', data: {'amount': amount});
  }


  void onBackPressed(BuildContext context) {
    if (kDebugMode) {
      debugPrint('Back to Lobby Pressed');
    }
    
    
    disconnect();
    GoRouter.of(context).go('/main-menu');
  }


  void disconnect() {
    debugPrint('[GameViewModel] Disconnecting from game');
    _serverService.disconnect();
  }

  @override
  void dispose() {
    debugPrint('[GameViewModel] Disposing');
    _gameStateSubscription?.cancel();
    _handResultsSubscription?.cancel();
    _errorSubscription?.cancel();
    // Don't dispose the service - it's shared!
    super.dispose();
  }
}