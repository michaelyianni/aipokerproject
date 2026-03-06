import 'package:aipoker_flutter_app/widgets/general/back_button.dart';
import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:aipoker_flutter_app/models/user_model.dart';

import '../view_models/lobby_viewmodel.dart';
import '../services/server_service.dart';
import '../providers/server_service_provider.dart';
import '../models/lobby_state.dart';
import 'dart:async';

class LobbyPage extends ConsumerStatefulWidget {
  // Changed to ConsumerStatefulWidget

  const LobbyPage({super.key});

  @override
  ConsumerState<LobbyPage> createState() => _LobbyPageState(); // Changed to ConsumerState
}

class _LobbyPageState extends ConsumerState<LobbyPage> {
  // Changed to ConsumerState
  late LobbyViewModel _viewModel;
  StreamSubscription? _gameStartedSubscription;

  String username =
      'Player${DateTime.now().millisecondsSinceEpoch}'; // Default username if not set in provider

  @override
  void initState() {
    super.initState();

    // Initialize ViewModel with service - we'll inject UserModel in didChangeDependencies


     final serverService = ref.read(serverServiceProvider);
    _viewModel = LobbyViewModel(serverService, ref);

     debugPrint('[LobbyPage] ViewModel initialized with ServerService and UserModel');

     // Listen for game start events to navigate to game page
     

    _gameStartedSubscription = _viewModel.gameStartedStream.listen((_) {
      if (mounted) {
        debugPrint('[LobbyPage] Game started, navigating to game');
        GoRouter.of(context).go('/game');
      }
    });
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();

    final username =
        ref.read(userProvider).username ??
        'Player${DateTime.now().millisecondsSinceEpoch}';
    _viewModel.username = username;

    // Now we can safely access ref
    _connectToLobby();
  }

  Future<void> _connectToLobby() async {
    final success = await _viewModel.connectToLobby();

    if (!success && mounted) {
      // Show error and navigate back
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(_viewModel.errorMessage ?? 'Connection failed')),
      );
      GoRouter.of(context).go('/main-menu');
    }
  }

  @override
  void dispose() {
    _gameStartedSubscription?.cancel();
    _viewModel.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    // Update username from Riverpod if it changes
    _viewModel.username =
        ref.watch(userProvider).username ??
        'Player${DateTime.now().millisecondsSinceEpoch}';

    // Listen to ViewModel changes
    return ListenableBuilder(
      listenable: _viewModel,
      builder: (context, _) {
        debugPrint(
          '[LobbyPage] REBUILDING - Players: ${_viewModel.players.length}',
        );

        // Show loading indicator while connecting
        if (_viewModel.isLoading) {
          return Scaffold(
            backgroundColor: Color.fromRGBO(168, 107, 107, 1.0),
            body: Center(child: CircularProgressIndicator()),
          );
        }

        final lobbyState = _viewModel.lobbyState;

        // Safety check
        if (lobbyState == null) {
          return Scaffold(
            backgroundColor: Color.fromRGBO(168, 107, 107, 1.0),
            body: Center(child: Text('No lobby data available')),
          );
        }

        // Loading symbol should appear if viewModel.isLoading is true
        return Scaffold(
          backgroundColor: Color.fromRGBO(168, 107, 107, 1.0),
          body: _viewModel.isLoading
              ? Center(child: CircularProgressIndicator())
              : SafeArea(
                  child: Padding(
                    padding: const EdgeInsets.all(24.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text('Lobby', style: TextStyle(fontSize: 60)),
                            CustomBackButton(onPressed: _onBackPressed),
                          ],
                        ),
                        SizedBox(height: 40),

                        // Player list - now using real data from ViewModel
                        Expanded(
                          child: Container(
                            padding: EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: Color.fromRGBO(217, 150, 150, 1.0),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: ListView.separated(
                              itemCount: _viewModel.players.length,
                              separatorBuilder: (context, index) =>
                                  SizedBox(height: 8),
                              itemBuilder: (context, index) {
                                final player = _viewModel.players[index];

                                debugPrint(
                                  '[LobbyPage] Building player tile for: ${player.username} (ID: ${player.playerId})',
                                );

                                return _buildPlayerTile(player);
                              },
                            ),
                          ),
                        ),

                        SizedBox(height: 24),

                        // Start Game button - only visible to host
                        if (_viewModel.isHost)
                          Center(
                            child: SizedBox(
                              width: 250,
                              height: 50,
                              child: ElevatedButton(
                                onPressed: _onStartGamePressed,
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: Color.fromRGBO(
                                    230,
                                    230,
                                    230,
                                    1.0,
                                  ),
                                  foregroundColor: Colors.black,
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                ),
                                child: Text(
                                  'Start Game',
                                  style: TextStyle(
                                    fontSize: 20,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              ),
                            ),
                          ),

                        SizedBox(height: 40),
                      ],
                    ),
                  ),
                ),
        );
      },
    );
  }

  Widget _buildPlayerTile(Player player) {
    final isCurrentPlayer = player.playerId == _viewModel.currentPlayerId;
    final isHost = player.playerId == _viewModel.lobbyState?.hostPlayerId;

    debugPrint(
      '[LobbyPage] Building tile - Player: ${player.username}, ID: ${player.playerId}, isCurrentPlayer: $isCurrentPlayer, isHost: $isHost',
    );

    // Highlight the current player and indicate host status
    return Container(
      padding: EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      decoration: BoxDecoration(
        color: Color.fromRGBO(230, 230, 230, 1.0),
        borderRadius: BorderRadius.circular(4),
        border: isCurrentPlayer
            ? Border.all(color: Colors.black, width: 2)
            : null,
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            player.username + (isHost ? ' (Host)' : ''),
            style: TextStyle(fontSize: 18, color: Colors.black),
          ),
          // if (player.isReady)
          //   Icon(Icons.check_circle, color: Colors.green),
        ],
      ),
    );
  }

  void _onStartGamePressed() {
    _viewModel.startGame();

    // Navigate to game when lobby status changes to 'starting'
    // You might want to listen to lobbyState.status changes instead
    // GoRouter.of(context).go('/game');
  }

  void _onBackPressed() {
    _viewModel.disconnect();
    GoRouter.of(context).go('/main-menu');
  }
}
