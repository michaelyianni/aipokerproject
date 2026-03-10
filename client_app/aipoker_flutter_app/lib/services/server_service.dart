import 'dart:async';
import 'package:aipoker_flutter_app/models/game_state.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'package:flutter/foundation.dart';
import '../models/lobby_state.dart';
import '../mocks/mock_game_data.dart'; // For testing without server

String serverUrl = 'http://10.0.2.2:3000'; // Localhost for Android emulator

class ServerService {
  IO.Socket? _socket;
  StreamController<LobbyState>? _lobbyStateController;
  StreamController<String>? _errorController;
  StreamController<void>? _gameStartedController;
  StreamController<GameState>? _gameStateController;
  StreamController<void>? _handResultsController;

  bool _isDisposed = false; // ✅ Add this flag

  // Expose streams for ViewModel to listen to
  Stream<LobbyState> get lobbyStateStream => _lobbyStateController!.stream;
  Stream<String> get errorStream => _errorController!.stream;
  Stream<void> get gameStartedStream => _gameStartedController!.stream;
  Stream<GameState> get gameStateStream => _gameStateController!.stream;
  Stream<void> get handResultsStream => _handResultsController!.stream;

  String? _currentPlayerId;
  String? get currentPlayerId => _currentPlayerId;

  bool _isHost = false;
  bool get isHost => _isHost;

  ServerService() {
    _initializeControllers();
  }

  // Initialize controllers
  void _initializeControllers() {
    _lobbyStateController = StreamController<LobbyState>.broadcast();
    _errorController = StreamController<String>.broadcast();
    _gameStartedController = StreamController<void>.broadcast();
    _gameStateController = StreamController<GameState>.broadcast();
    _handResultsController = StreamController<void>.broadcast();
    _isDisposed = false; // ✅ Reset flag
  }

  // ✅ Add safe methods
  void _safeAddError(String error) {
    if (!_isDisposed && _errorController != null && !_errorController!.isClosed) {
      _errorController!.add(error);
    } else {
      debugPrint('[ServerService] Skipped adding error (disposed): $error');
    }
  }

  void _safeAddLobbyState(LobbyState state) {
    if (!_isDisposed && _lobbyStateController != null && !_lobbyStateController!.isClosed) {
      _lobbyStateController!.add(state);
    } else {
      debugPrint('[ServerService] Skipped adding lobby state (disposed)');
    }
  }

  void _safeAddGameStarted() {
    if (!_isDisposed && _gameStartedController != null && !_gameStartedController!.isClosed) {
      _gameStartedController!.add(null);
    } else {
      debugPrint('[ServerService] Skipped adding game started (disposed)');
    }
  }

  void _safeAddGameState(GameState state) {
    if (!_isDisposed && _gameStateController != null && !_gameStateController!.isClosed) {
      _gameStateController!.add(state);
    } else {
      debugPrint('[ServerService] Skipped adding game state (disposed)');
    }
  }

  void _safeAddHandResults() {
    if (!_isDisposed && _handResultsController != null && !_handResultsController!.isClosed) {
      _handResultsController!.add(null);
    } else {
      debugPrint('[ServerService] Skipped adding hand results (disposed)');
    }
  }

  // Connect to lobby
  Future<LobbyConnectionResult> connectToLobby(String username) async {
    try {
      debugPrint(
        '[ServerService] Connecting to: $serverUrl with username: $username',
      );

      // Create a completer to wait for connection
      final connectionCompleter = Completer<void>();

      // Create Socket.IO connection
      _socket = IO.io(
        serverUrl,
        IO.OptionBuilder()
            .setTransports(['websocket']) // Use WebSocket transport
            .disableAutoConnect() // We'll connect manually
            .build(),
      );

      // Set up event listeners before connecting
      _setupSocketListeners();

      // Listen for connection success
      _socket!.onConnect((_) {
        debugPrint('[ServerService] Socket connected');
        if (!connectionCompleter.isCompleted) {
          connectionCompleter.complete();
        }
      });

      // Listen for connection errors
      _socket!.onConnectError((error) {
        debugPrint('[ServerService] Connection error: $error');
        if (!connectionCompleter.isCompleted) {
          connectionCompleter.completeError(error);
        }
      });

      // Connect to server
      _socket!.connect();

      // Wait for connection with timeout
      await connectionCompleter.future.timeout(
        Duration(seconds: 5),
        onTimeout: () => throw TimeoutException('Connection timeout'),
      );

      debugPrint('[ServerService] Socket connected, joining lobby...');

      // Join lobby and wait for acknowledgment
      final result = await _joinLobby(username);

      if (result.success) {
        debugPrint('[ServerService] Successfully joined lobby. Result: Player ID: ${result.playerId}, Host: ${result.isHost}, Initial Players: ${result.initialState?.playerCount ?? 0}');
        return result;
      } else {
        throw Exception(result.error ?? 'Failed to join lobby');
      }
    } catch (e) {
      debugPrint('[ServerService] Connection error: $e');
      _cleanupSocket();
      return LobbyConnectionResult.failure(e.toString());
    }
  }

  // Join lobby and wait for server response
  Future<LobbyConnectionResult> _joinLobby(String username) async {
    final completer = Completer<LobbyConnectionResult>();

    _socket!.emitWithAck(
      'lobby:join',
      {'username': username},
      ack: (response) {
        try {
          debugPrint('[ServerService] Join response: $response');

          if (response['ok'] == true) {
            _currentPlayerId = response['playerId'];
            _isHost = response['isHost'] ?? false;

            // Parse initial lobby state
            final lobbyData = response['lobby'];
            final initialState = LobbyState.fromJson(lobbyData);

            debugPrint(
              '[ServerService] Player ID: $_currentPlayerId, IsHost: $_isHost, Initial Players: ${initialState.playerCount}',
            );

            completer.complete(
              LobbyConnectionResult.success(
                playerId: _currentPlayerId!,
                initialState: initialState,
                isHost: _isHost,
              ),
            );
          } else {
            completer.complete(
              LobbyConnectionResult.failure(response['error'] ?? 'Join failed'),
            );
          }
        } catch (e) {
          debugPrint('[ServerService] Error parsing join response: $e');
          completer.complete(LobbyConnectionResult.failure(e.toString()));
        }
      },
    );

    return completer.future.timeout(
      Duration(seconds: 5),
      onTimeout: () => LobbyConnectionResult.failure('Join timeout'),
    );
  }

  // Set up Socket.IO event listeners - ✅ USE SAFE METHODS
  void _setupSocketListeners() {
    // Connection events
    _socket!.onConnect((_) {
      debugPrint('[ServerService] Socket.IO connected');
    });

    _socket!.onDisconnect((_) {
      debugPrint('[ServerService] Socket.IO disconnected');
      // _safeAddError('Disconnected from server'); // ✅
    });

    _socket!.onConnectError((error) {
      debugPrint('[ServerService] Socket.IO connect error: $error');
      _safeAddError('Connection error: $error'); // ✅
    });

    _socket!.onError((error) {
      debugPrint('[ServerService] Socket.IO error: $error');
      _safeAddError('Socket error: $error'); // ✅
    });

    // Lobby state updates
    _socket!.on('lobby:update', (data) {
      try {
        debugPrint('[ServerService] Received lobby:update');
        final lobbyData = data['lobby'];
        final updatedState = LobbyState.fromJson(lobbyData);
        _safeAddLobbyState(updatedState); // ✅
      } catch (e) {
        debugPrint('[ServerService] Error parsing lobby update: $e');
        _safeAddError('Error parsing lobby update: $e'); // ✅
      }
    });

    // Game started event
    _socket!.on('game:started', (data) {
      debugPrint('[ServerService] Game started by: ${data['startedBy']}');
      _safeAddGameStarted(); // ✅
    });

    // You can add more event listeners here for game events later
    _socket!.on('game:state', (data) {
      debugPrint('[ServerService] Received game state update');

    // Use mock data for now
    // TODO: Remove this and use real data when server is implemented
      // Map<String, dynamic> mockGameState = MockGameData.getFlopScenario();
      // final updatedState = GameState.fromJson(mockGameState, MockGameData.getTestPlayerIdFlop());

      final updatedState = GameState.fromJson(data, _currentPlayerId!);
      _safeAddGameState(updatedState); 
    });

    _socket!.on('game:hand_results', (data) {
      debugPrint('[ServerService] Received hand results update');
      _safeAddHandResults(); // ✅ Just notify listeners for now
    });
  }

  // Send start game command (host only)
  Future<bool> startGame({bool testingMode = false}) async {
    if (!_isHost) {
      debugPrint('[ServerService] Cannot start game - not host');
      return false;
    }

    try {
      final completer = Completer<bool>();

      _socket!.emitWithAck(
        'lobby:start',
        {'testingMode': testingMode},
        ack: (response) {
          if (response['ok'] == true) {
            debugPrint('[ServerService] Game start acknowledged');
            completer.complete(true);
          } else {
            debugPrint(
              '[ServerService] Game start failed: ${response['error']}',
            );
            _safeAddError(response['error'] ?? 'Failed to start game'); // ✅
            completer.complete(false);
          }
        },
      );

      return await completer.future.timeout(
        Duration(seconds: 5),
        onTimeout: () {
          _safeAddError('Start game timeout'); // ✅
          return false;
        },
      );
    } catch (e) {
      debugPrint('[ServerService] Error starting game: $e');
      _safeAddError('Error starting game: $e'); // ✅
      return false;
    }
  }

  // Get current lobby state
  Future<LobbyState?> getLobbyState() async {
    try {
      final completer = Completer<LobbyState?>();

      _socket!.emitWithAck(
        'lobby:get',
        null,
        ack: (response) {
          try {
            if (response['ok'] == true) {
              final lobbyData = response['lobby'];
              final state = LobbyState.fromJson(lobbyData);
              completer.complete(state);
            } else {
              completer.complete(null);
            }
          } catch (e) {
            debugPrint('[ServerService] Error parsing lobby state: $e');
            completer.complete(null);
          }
        },
      );

      return await completer.future.timeout(
        Duration(seconds: 5),
        onTimeout: () => null,
      );
    } catch (e) {
      debugPrint('[ServerService] Error getting lobby state: $e');
      return null;
    }
  }

  // Add this method to your ServerService class

/// Send a game action to the server
/// 
/// Actions: 'fold', 'check', 'call', 'bet', 'raise', 'all-in'
Future<bool> sendGameAction(String action, {Map<String, dynamic>? data}) async {
  if (_socket == null || !_socket!.connected) {
    debugPrint('[ServerService] Cannot send action - not connected');
    return false;
  }

  try {
    debugPrint('[ServerService] Sending action: $action with data: $data');
    
    final completer = Completer<bool>();

    // Prepare the payload
    final payload = {
      'playerId': _currentPlayerId,
      'action': action,
      if (data != null) ...data,
    };

    _socket!.emitWithAck(
      'game:action',
      payload,
      ack: (response) {
        try {
          debugPrint('[ServerService] Action response: $response');
          
          if (response['ok'] == true) {
            debugPrint('[ServerService] Action "$action" acknowledged successfully');
            completer.complete(true);
          } else {
            debugPrint('[ServerService] Action "$action" failed: ${response['error']}');
            _safeAddError(response['error'] ?? 'Action failed');
            completer.complete(false);
          }
        } catch (e) {
          debugPrint('[ServerService] Error parsing action response: $e');
          _safeAddError('Error processing action response');
          completer.complete(false);
        }
      },
    );

    return await completer.future.timeout(
      Duration(seconds: 5),
      onTimeout: () {
        debugPrint('[ServerService] Action "$action" timeout');
        _safeAddError('Action timeout');
        return false;
      },
    );
  } catch (e) {
    debugPrint('[ServerService] Error sending action: $e');
    _safeAddError('Error sending action: $e');
    return false;
  }
}

  void _cleanupSocket() {
    debugPrint('[ServerService] Cleaning up socket...');
    _socket?.clearListeners();
    _socket?.disconnect();
    _socket?.dispose();
    _socket = null;
    _currentPlayerId = null;
    _isHost = false;
  }

  // Disconnect (leave lobby)
  void disconnect() {
    debugPrint('[ServerService] Disconnecting...');
    _cleanupSocket();
  }

  void dispose() {
    debugPrint('[ServerService] Disposing service...');
    _isDisposed = true; // ✅ Set flag BEFORE cleanup
    disconnect();
    _lobbyStateController?.close();
    _errorController?.close();
    _gameStartedController?.close();
    _gameStateController?.close();
    _handResultsController?.close();
  }
}

// Result class for connection attempt
class LobbyConnectionResult {
  final bool success;
  final String? playerId;
  final LobbyState? initialState;
  final bool isHost;
  final String? error;

  LobbyConnectionResult.success({
    required this.playerId,
    required this.initialState,
    required this.isHost,
  }) : success = true,
       error = null;

  LobbyConnectionResult.failure(this.error)
    : success = false,
      playerId = null,
      initialState = null,
      isHost = false;
}