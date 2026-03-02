import 'package:flutter/foundation.dart';
import '../services/lobby_service.dart';
import '../models/lobby_state.dart';

class LobbyViewModel extends ChangeNotifier {
  final LobbyService _lobbyService;
  
  LobbyState? _lobbyState;
  String? _currentPlayerId;
  bool _isHost = false;
  String? _errorMessage;
  bool _isLoading = false;
  bool _shouldNavigateToGame = false;

  // Getters
  LobbyState? get lobbyState => _lobbyState;
  String? get currentPlayerId => _currentPlayerId;
  String? get errorMessage => _errorMessage;
  bool get isLoading => _isLoading;
  bool get shouldNavigateToGame => _shouldNavigateToGame;
  
  bool get isHost => _isHost;
  List<Player> get players => _lobbyState?.playerList ?? [];
  int get playerCount => players.length;

  LobbyViewModel(this._lobbyService) {
    _listenToServiceStreams();
  }

  void _listenToServiceStreams() {
    // Listen for lobby state updates
    _lobbyService.lobbyStateStream.listen(
      (state) {
        debugPrint('[ViewModel] Received lobby state update');
        _updateLobbyState(state);
        notifyListeners();
      },
      onError: (error) {
        debugPrint('[ViewModel] Error in lobby state stream: $error');
        _errorMessage = error.toString();
        notifyListeners();
      },
    );

    // Listen for errors
    _lobbyService.errorStream.listen((error) {
      debugPrint('[ViewModel] Received error: $error');
      _errorMessage = error;
      notifyListeners();
    });

    // Listen for game started event
    _lobbyService.gameStartedStream.listen((_) {
      debugPrint('[ViewModel] Game started, triggering navigation');
      _shouldNavigateToGame = true;
      notifyListeners();
    });
  }

  // Connect to lobby
  Future<bool> connectToLobby(String username) async {
    debugPrint('[ViewModel] Connecting to lobby with username: $username');
    
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    final result = await _lobbyService.connectToLobby(username);
    

    if (result.success) {
      debugPrint('[ViewModel] Connection successful');

      _updateLobbyState(result.initialState);

      _currentPlayerId = result.playerId;
      // _isHost = result.isHost; // Host status will be determined when we receive the lobby state update
      _isLoading = false;
      notifyListeners();
      return true;
    } else {
      debugPrint('[ViewModel] Connection failed: ${result.error}');
      _errorMessage = result.error;
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  // Start game (host only)
  Future<void> startGame({bool testingMode = false}) async {
    if (!isHost) {
      debugPrint('[ViewModel] Cannot start game - not host');
      _errorMessage = 'Only the host can start the game';
      notifyListeners();
      return;
    }

    debugPrint('[ViewModel] Requesting game start');
    final success = await _lobbyService.startGame(testingMode: testingMode);
    
    if (!success) {
      _errorMessage = 'Failed to start game';
      notifyListeners();
    }
  }


  void _updateLobbyState(LobbyState? newState) {

    if (newState == null) {
      debugPrint('[ViewModel] Received null lobby state, ignoring');
      return;
    }

    debugPrint('[ViewModel] Updating lobby state: ${newState.playerCount} players, host: ${newState.hostPlayerId}, gameStarted: ${newState.isGameStarted}');
    _lobbyState = newState;
    _isHost = (_currentPlayerId != null && newState.hostPlayerId == _currentPlayerId);
    
    notifyListeners();
  }

  // Disconnect from lobby
  void disconnect() {
    debugPrint('[ViewModel] Disconnecting from lobby');
    _lobbyService.disconnect();
  }

  // Clear error message
  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }

  // Reset navigation flag
  void resetNavigationFlag() {
    _shouldNavigateToGame = false;
  }

  @override
  void dispose() {
    debugPrint('[ViewModel] Disposing');
    _lobbyService.dispose();
    super.dispose();
  }
}