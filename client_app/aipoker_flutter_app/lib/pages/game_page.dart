import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../providers/server_service_provider.dart';
import '../view_models/game_viewmodel.dart';
import '../widgets/general/back_button.dart';

class GamePage extends ConsumerStatefulWidget {
  const GamePage({super.key});

  @override
  ConsumerState<GamePage> createState() => _GamePageState();
}

class _GamePageState extends ConsumerState<GamePage> {
  late GameViewModel _viewModel;

  @override
  void initState() {
    super.initState();

    // Get the same ServerService instance that LobbyPage was using
    final serverService = ref.read(serverServiceProvider);
    _viewModel = GameViewModel(serverService);

    debugPrint('[GamePage] Initialized with existing ServerService connection');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      // Background hex color: #42943C
      backgroundColor: Color.fromRGBO(66, 148, 60, 1.0),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Padding for top of screen
          SizedBox(height: 20),
          // Community section
          Column(
            children: [
              // Community cards

              // Back Button and Current Bet
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  // Back Button
                  CustomBackButton(
                    onPressed: () => _viewModel.onBackPressed(context),
                    color: Colors.white,
                  ),

                  // Current Bet widget
                  SizedBox(width: 100), // Spacing
                ],
              ),
            ],
          ),

          // Players' section
          Column(
            children: [
              // Top player
              Center(
                // Player widget
              ),

              // Row of players, pot, and more players
              Row(
                children: [
                  // Player widgets
                  Column(
                    children: [
                      // Player widget
                      // Player widget
                    ],
                  ),
                  // Pot widget

                  // Player widgets
                  Column(
                    children: [
                      // Player widget
                      // Player widget
                    ],
                  ),
                ],
              ),
            ],
          ),

          // Player Status section
          Column(
            children: [
              // Turn status label

              // Total chips, cards, and current bet
              Row(
                children: [
                  // Total chips widget

                  // Cards widget

                  // Current bet widget
                ],
              ),
            ],
          ),

          // Player action buttons widget
        ],
      ),
    );
  }

}
