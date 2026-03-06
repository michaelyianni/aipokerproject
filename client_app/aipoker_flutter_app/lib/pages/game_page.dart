import 'package:aipoker_flutter_app/widgets/game/comm_cards_widget.dart';
import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../providers/server_service_provider.dart';
import '../view_models/game_viewmodel.dart';
import '../models/game_state.dart';
import '../models/game_models/player_model.dart';
import '../models/game_models/comm_cards_model.dart';
import '../models/game_models/pot_model.dart';
import '../widgets/general/back_button.dart';
import '../widgets/game/chip_amount_widget.dart';

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
    return ListenableBuilder(
      listenable: _viewModel,
      builder: (context, _) {
        debugPrint(
          '[GamePage] REBUILDING - Game state: ${_viewModel.gameState}', //, Community Cards: ${_viewModel.communityCards}, Pot: ${_viewModel.pot}, Players: ${_viewModel.players.length}',
        );

        // Show loading indicator while connecting
        if (_viewModel.isLoading) {
          return Scaffold(
            backgroundColor: Color.fromRGBO(66, 148, 60, 1.0),
            body: Center(child: CircularProgressIndicator()),
          );
        }

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
                  CommunityCardsWidget(
                    communityCards:
                        _viewModel.gameState?.communityCards ??
                        CommunityCards.empty(),
                  ),

                  // Back Button and Current Bet
                  Container(
                    padding: EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        // Back Button
                        CustomBackButton(
                          onPressed: () => _viewModel.onBackPressed(context),
                          color: Colors.white,
                        ),

                        // Current Bet widget
                        ChipAmountWidget(
                          amount: _viewModel.gameState?.currentBet ?? 0,
                          assetPath: 'assets/icons/chip-128-red.png',
                        ),

                        SizedBox(width: 48), // Spacing - same size as icon button to keep Current Bet centered
                      ],
                    ),
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
      },
    );
  }
}
