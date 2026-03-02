import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:go_router/go_router.dart';

import '../view_models/lobby_viewmodel.dart';
import '../services/lobby_service.dart';
import '../models/lobby_state.dart';


// class LobbyPage extends StatefulWidget {
//   const LobbyPage({super.key});

//   @override
//   State<LobbyPage> createState() => _LobbyPageState();
// }

// class _LobbyPageState extends State<LobbyPage> {
//   // TODO: Replace with actual player list from your game state/lobby service
//   final List<String> players = [
//     'Player 1',
//     'Player 2',
//     'Player 3',
//     'Player 4',
//     'Player 5',
//     'Player 6',
//   ];

//   // TODO: Set this based on whether the current user is the host
//   final bool isHost = true;

//   @override
//   Widget build(BuildContext context) {
//     return Scaffold(
//       // Background color matching the prototype (reddish-brown)
//       backgroundColor: Color.fromRGBO(168, 107, 107, 1.0),
//       body: SafeArea(
//         child: Padding(
//           padding: const EdgeInsets.all(24.0),
//           child: Column(
//             crossAxisAlignment: CrossAxisAlignment.start,
//             children: [
//               Row(
//                 mainAxisAlignment: MainAxisAlignment.spaceBetween,
//                 children: [
//                   // Title
//                   Text(
//                     'Lobby',
//                     style: TextStyle(fontSize: 60),
//                   ),
//                   // Back button
//                   IconButton(
//                     icon: Icon(Icons.arrow_back, color: Colors.black),
//                     onPressed: _onBackPressed,
//                   ),
//                 ],
//               ),
//               SizedBox(height: 40),

//               // Player list container
//               Expanded(
//                 child: Container(
//                   padding: EdgeInsets.all(8),
//                   decoration: BoxDecoration(
//                     color: Color.fromRGBO(217, 150, 150, 1.0),
//                     borderRadius: BorderRadius.circular(8),
//                   ),
//                   child: ListView.separated(
//                     // TODO: Replace with dynamic list based on actual players in lobby
//                     // Example: players.map((player) => _buildPlayerTile(player)).toList()
//                     itemCount: players.length,
//                     separatorBuilder: (context, index) => SizedBox(height: 8),
//                     itemBuilder: (context, index) {
//                       return _buildPlayerTile(players[index]);
//                     },
//                   ),
//                 ),
//               ),

//               SizedBox(height: 24),

//               // Start Game button
//               // TODO: Only show this button if isHost is true
//               // Wrap in conditional: if (isHost) ...
//               Center(
//                 child: SizedBox(
//                   width: 250,
//                   height: 50,
//                   child: ElevatedButton(
//                     onPressed: isHost ? _onStartGamePressed : null,
//                     style: ElevatedButton.styleFrom(
//                       backgroundColor: Color.fromRGBO(230, 230, 230, 1.0),
//                       foregroundColor: Colors.black,
//                       disabledBackgroundColor: Colors.grey[400],
//                       shape: RoundedRectangleBorder(
//                         borderRadius: BorderRadius.circular(8),
//                       ),
//                     ),
//                     child: Text(
//                       'Start Game',
//                       style: TextStyle(
//                         fontSize: 20,
//                         fontWeight: FontWeight.w500,
//                       ),
//                     ),
//                   ),
//                 ),
//               ),

//               SizedBox(height: 40),
//             ],
//           ),
//         ),
//       ),
//     );
//   }

//   Widget _buildPlayerTile(String playerName) {
//     return Container(
//       padding: EdgeInsets.symmetric(horizontal: 16, vertical: 16),
//       decoration: BoxDecoration(
//         color: Color.fromRGBO(230, 230, 230, 1.0),
//         borderRadius: BorderRadius.circular(4),
//       ),
//       child: Text(
//         playerName,
//         style: TextStyle(fontSize: 18, color: Colors.black),
//       ),
//     );
//   }

//   void _onStartGamePressed() {

//     if (kDebugMode) {
//       debugPrint('Start game pressed');
//     }

//     // TODO: Send start game signal to server

//     // For now, just navigate to the game screen (which we haven't implemented yet)
    
//     GoRouter.of(context).go('/game');

//   }

//   void _onBackPressed() {
//     if (kDebugMode) {
//       debugPrint('Back to Main Menu Pressed');
//     }

//     // TODO: Add any necessary cleanup before navigating back (e.g., leaving lobby, notifying server, etc.)

//     GoRouter.of(context).go('/');
//   }
// }

class LobbyPage extends StatefulWidget {

  const LobbyPage({
    super.key,
  });

  @override
  State<LobbyPage> createState() => _LobbyPageState();
}

class _LobbyPageState extends State<LobbyPage> {
  late LobbyViewModel _viewModel;

  String username = 'Player' + DateTime.now().millisecondsSinceEpoch.toString(); // TODO: Get this from user input

  @override
  void initState() {
    super.initState();
    
    // Initialize ViewModel with service

    _viewModel = LobbyViewModel(LobbyService());

    
    // Connect to lobby
    _connectToLobby();
  }

  Future<void> _connectToLobby() async {
    final success = await _viewModel.connectToLobby(username);
    
    if (!success && mounted) {
      // Show error and navigate back
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(_viewModel.errorMessage ?? 'Connection failed')),
      );
      GoRouter.of(context).go('/');
    }
  }

  @override
  void dispose() {
    _viewModel.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    // Listen to ViewModel changes
    return ListenableBuilder(
      listenable: _viewModel,
      builder: (context, _) {

        debugPrint('[LobbyPage] REBUILDING - Players: ${_viewModel.players.length}');

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
                      IconButton(
                        icon: Icon(Icons.arrow_back, color: Colors.black),
                        onPressed: _onBackPressed,
                      ),
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
                        separatorBuilder: (context, index) => SizedBox(height: 8),
                        itemBuilder: (context, index) {
                          final player = _viewModel.players[index];

                          debugPrint('[LobbyPage] Building player tile for: ${player.username} (ID: ${player.playerId})');

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
                            backgroundColor: Color.fromRGBO(230, 230, 230, 1.0),
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

     debugPrint('[LobbyPage] Building tile - Player: ${player.username}, ID: ${player.playerId}, isCurrentPlayer: $isCurrentPlayer, isHost: $isHost');

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
    GoRouter.of(context).go('/game');
  }

  void _onBackPressed() {
    _viewModel.disconnect();
    GoRouter.of(context).go('/');
  }
}
