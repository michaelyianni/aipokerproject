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
  bool isDisplayingHandResults = false; // New state for hand results display

  StreamSubscription<GameState>? _gameStateSubscription;
  StreamSubscription<GameState>? _handResultsSubscription; 
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
        isDisplayingHandResults = false;
        notifyListeners();
      },
      onError: (error) {
        debugPrint('[GameViewModel] Error in game state stream: $error');
        _errorMessage = error.toString();
        notifyListeners();
      },
    );

    _handResultsSubscription = _serverService.handResultsStream.listen(
      (state) {
        debugPrint('[GameViewModel] Received hand results update');
        // Handle hand results update
        _gameState = state;
        isDisplayingHandResults = true;
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
 Future<void> fold() async {
  await _serverService.sendGameAction('FOLD');
}

Future<void> check() async {
  await _serverService.sendGameAction('CHECK');
}

Future<void> call() async {
  await _serverService.sendGameAction('CALL');
}

Future<void> bet(int amount) async {
  await _serverService.sendGameAction('BET', data: {'amount': amount});
}

Future<void> raise(int amount) async {
  await _serverService.sendGameAction('RAISE', data: {'amount': amount});
}

Future<void> allIn() async {
  await _serverService.sendGameAction('ALL-IN');
}

// Helper to determine check vs call
Future<void> checkCall() async {
  if (gameState?.thisPlayer.currentBet == gameState?.currentBet) {
    await check();
  } else {
    await call();
  }
}

// Helper to determine bet vs raise
Future<void> betRaise(int amount) async {
  if (gameState?.currentBet == 0) {
    await bet(amount);
  } else {
    await raise(amount);
  }
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