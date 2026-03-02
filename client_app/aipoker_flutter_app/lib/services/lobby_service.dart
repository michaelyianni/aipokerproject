import 'dart:async';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'package:flutter/foundation.dart';
import '../models/lobby_state.dart';

String serverUrl = 'http://10.0.2.2:3000'; // Localhost for Android emulator

class LobbyService {
  IO.Socket? _socket;
  StreamController<LobbyState>? _lobbyStateController;
  StreamController<String>? _errorController;
  StreamController<void>? _gameStartedController;

  bool _isDisposed = false; // ✅ Add this flag

  // Expose streams for ViewModel to listen to
  Stream<LobbyState> get lobbyStateStream => _lobbyStateController!.stream;
  Stream<String> get errorStream => _errorController!.stream;
  Stream<void> get gameStartedStream => _gameStartedController!.stream;

  String? _currentPlayerId;
  String? get currentPlayerId => _currentPlayerId;

  bool _isHost = false;
  bool get isHost => _isHost;

  LobbyService() {
    _initializeControllers();
  }

  // Initialize controllers
  void _initializeControllers() {
    _lobbyStateController = StreamController<LobbyState>.broadcast();
    _errorController = StreamController<String>.broadcast();
    _gameStartedController = StreamController<void>.broadcast();
    _isDisposed = false; // ✅ Reset flag
  }

  // ✅ Add safe methods
  void _safeAddError(String error) {
    if (!_isDisposed && _errorController != null && !_errorController!.isClosed) {
      _errorController!.add(error);
    } else {
      debugPrint('[LobbyService] Skipped adding error (disposed): $error');
    }
  }

  void _safeAddLobbyState(LobbyState state) {
    if (!_isDisposed && _lobbyStateController != null && !_lobbyStateController!.isClosed) {
      _lobbyStateController!.add(state);
    } else {
      debugPrint('[LobbyService] Skipped adding lobby state (disposed)');
    }
  }

  void _safeAddGameStarted() {
    if (!_isDisposed && _gameStartedController != null && !_gameStartedController!.isClosed) {
      _gameStartedController!.add(null);
    } else {
      debugPrint('[LobbyService] Skipped adding game started (disposed)');
    }
  }

  // Connect to lobby
  Future<LobbyConnectionResult> connectToLobby(String username) async {
    try {
      debugPrint(
        '[LobbyService] Connecting to: $serverUrl with username: $username',
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
        debugPrint('[LobbyService] Socket connected');
        if (!connectionCompleter.isCompleted) {
          connectionCompleter.complete();
        }
      });

      // Listen for connection errors
      _socket!.onConnectError((error) {
        debugPrint('[LobbyService] Connection error: $error');
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

      debugPrint('[LobbyService] Socket connected, joining lobby...');

      // Join lobby and wait for acknowledgment
      final result = await _joinLobby(username);

      if (result.success) {
        debugPrint('[LobbyService] Successfully joined lobby. Result: Player ID: ${result.playerId}, Host: ${result.isHost}, Initial Players: ${result.initialState?.playerCount ?? 0}');
        return result;
      } else {
        throw Exception(result.error ?? 'Failed to join lobby');
      }
    } catch (e) {
      debugPrint('[LobbyService] Connection error: $e');
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
          debugPrint('[LobbyService] Join response: $response');

          if (response['ok'] == true) {
            _currentPlayerId = response['playerId'];
            _isHost = response['isHost'] ?? false;

            // Parse initial lobby state
            final lobbyData = response['lobby'];
            final initialState = LobbyState.fromJson(lobbyData);

            debugPrint(
              '[LobbyService] Player ID: $_currentPlayerId, IsHost: $_isHost, Initial Players: ${initialState.playerCount}',
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
          debugPrint('[LobbyService] Error parsing join response: $e');
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
      debugPrint('[LobbyService] Socket.IO connected');
    });

    _socket!.onDisconnect((_) {
      debugPrint('[LobbyService] Socket.IO disconnected');
      _safeAddError('Disconnected from server'); // ✅
    });

    _socket!.onConnectError((error) {
      debugPrint('[LobbyService] Socket.IO connect error: $error');
      _safeAddError('Connection error: $error'); // ✅
    });

    _socket!.onError((error) {
      debugPrint('[LobbyService] Socket.IO error: $error');
      _safeAddError('Socket error: $error'); // ✅
    });

    // Lobby state updates
    _socket!.on('lobby:update', (data) {
      try {
        debugPrint('[LobbyService] Received lobby:update');
        final lobbyData = data['lobby'];
        final updatedState = LobbyState.fromJson(lobbyData);
        _safeAddLobbyState(updatedState); // ✅
      } catch (e) {
        debugPrint('[LobbyService] Error parsing lobby update: $e');
        _safeAddError('Error parsing lobby update: $e'); // ✅
      }
    });

    // Game started event
    _socket!.on('game:started', (data) {
      debugPrint('[LobbyService] Game started by: ${data['startedBy']}');
      _safeAddGameStarted(); // ✅
    });

    // You can add more event listeners here for game events later
    _socket!.on('game:state', (data) {
      debugPrint('[LobbyService] Received game state update');
      // TODO: Handle game state updates
    });
  }

  // Send start game command (host only)
  Future<bool> startGame({bool testingMode = false}) async {
    if (!_isHost) {
      debugPrint('[LobbyService] Cannot start game - not host');
      return false;
    }

    try {
      final completer = Completer<bool>();

      _socket!.emitWithAck(
        'lobby:start',
        {'testingMode': testingMode},
        ack: (response) {
          if (response['ok'] == true) {
            debugPrint('[LobbyService] Game start acknowledged');
            completer.complete(true);
          } else {
            debugPrint(
              '[LobbyService] Game start failed: ${response['error']}',
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
      debugPrint('[LobbyService] Error starting game: $e');
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
            debugPrint('[LobbyService] Error parsing lobby state: $e');
            completer.complete(null);
          }
        },
      );

      return await completer.future.timeout(
        Duration(seconds: 5),
        onTimeout: () => null,
      );
    } catch (e) {
      debugPrint('[LobbyService] Error getting lobby state: $e');
      return null;
    }
  }

  void _cleanupSocket() {
    debugPrint('[LobbyService] Cleaning up socket...');
    _socket?.clearListeners();
    _socket?.disconnect();
    _socket?.dispose();
    _socket = null;
    _currentPlayerId = null;
    _isHost = false;
  }

  // Disconnect (leave lobby)
  void disconnect() {
    debugPrint('[LobbyService] Disconnecting...');
    _cleanupSocket();
  }

  void dispose() {
    debugPrint('[LobbyService] Disposing service...');
    _isDisposed = true; // ✅ Set flag BEFORE cleanup
    disconnect();
    _lobbyStateController?.close();
    _errorController?.close();
    _gameStartedController?.close();
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