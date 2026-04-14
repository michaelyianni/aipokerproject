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
import '../widgets/game/player_widget.dart';
import '../widgets/game/pots_widget.dart';
import '../widgets/game/poker_action_buttons.dart';
import '../widgets/game/user_chip_amount_widget.dart';
import '../widgets/game/user_cards_widget.dart';
import '../widgets/game/hand_results_dialog.dart';

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
          '[GamePage] REBUILDING - Game state: ${_viewModel.gameState}, Community Cards: ${_viewModel.gameState?.communityCards.cards}, Players: ${_viewModel.gameState?.players.length}',
        );

        // Check and show hand results dialog
        WidgetsBinding.instance.addPostFrameCallback((_) {
          _showHandResults();
        });

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
          body: Container(
            padding: EdgeInsets.symmetric(horizontal: 5, vertical: 20),
            child: Column(
              mainAxisSize: MainAxisSize.max,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
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
                      padding: EdgeInsets.symmetric(
                        horizontal: 20,
                        vertical: 10,
                      ),
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
                            text: "Current Bet",
                            amount: _viewModel.gameState?.currentBet ?? 0,
                            assetPath: 'assets/icons/chip-128-red.png',
                          ),

                          SizedBox(
                            width: 48,
                          ), // Spacing - same size as icon button to keep Current Bet centered
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
                      child: buildPlayerWidget(2),
                    ),
                    SizedBox(height: 10),

                    // Row of players, pot, and more players
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        // Player widgets
                        Column(
                          children: [
                            // Player widget
                            buildPlayerWidget(1),
                            SizedBox(height: 8),
                            buildPlayerWidget(0),
                          ],
                        ),
                        // Pot widget
                        PotsWidget(pots: _viewModel.gameState?.pots ?? []),

                        // Player widgets
                        Column(
                          children: [
                            // Player widget
                            buildPlayerWidget(3),
                            SizedBox(height: 8),
                            buildPlayerWidget(4),
                          ],
                        ),
                      ],
                    ),
                  ],
                ),

                // This player section - only visible to current player, shows more details and action buttons
                Expanded(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.end,
                    mainAxisSize: MainAxisSize.max,
                    children: [
                      // Player Status section
                      Column(
                        children: [
                          Row(
                            children: [
                              // Dealer Button
                              Expanded(
                                flex: 1,
                                child: Center(
                                  child:
                                      _viewModel
                                              .gameState
                                              ?.thisPlayer
                                              .playerId ==
                                          _viewModel.gameState?.dealerId
                                      ? Image.asset(
                                          'assets/icons/dealer-coin.png',
                                          width: 28,
                                          height: 28,
                                        )
                                      : const SizedBox(width: 28, height: 28),
                                ),
                              ),

                              // Turn status label 
                              Expanded(
                                flex: 2,
                                child: Center(
                                  child:
                                      _viewModel
                                              .gameState
                                              ?.currentTurnPlayerId ==
                                          _viewModel
                                              .gameState
                                              ?.thisPlayer
                                              .playerId
                                      ? const Text(
                                          "Your Turn",
                                          style: TextStyle(
                                            color: Colors.yellow,
                                            fontSize: 18,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        )
                                      : const Text(
                                          "Waiting for other players...",
                                          style: TextStyle(
                                            color: Colors.white,
                                            fontSize: 16,
                                          ),
                                        ),
                                ),
                              ),

                              // SB/BB Button
                              Expanded(
                                flex: 1,
                                child: Center(
                                  child:
                                      _viewModel
                                              .gameState
                                              ?.thisPlayer
                                              .playerId ==
                                          _viewModel.gameState?.smallBlindId
                                      ? Image.asset(
                                          'assets/icons/sb-coin.png',
                                          width: 28,
                                          height: 28,
                                        )
                                      : _viewModel
                                                .gameState
                                                ?.thisPlayer
                                                .playerId ==
                                            _viewModel.gameState?.bigBlindId
                                      ? Image.asset(
                                          'assets/icons/bb-coin.png',
                                          width: 28,
                                          height: 28,
                                        )
                                      : const SizedBox(width: 28, height: 28),
                                ),
                              ),
                            ],
                          ),

                          // Total chips, cards, and current bet
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              // Total chips widget
                              UserChipAmountWidget(
                                text: "Total",
                                amount:
                                    _viewModel.gameState?.thisPlayer.chips ?? 0,
                                assetPath: "assets/icons/chip-128-blue.png",
                              ),

                              // Cards widget
                              UserCardsWidget(
                                userCards:
                                    _viewModel.gameState?.thisPlayer.hand ?? [],
                              ),

                              // Current bet widget
                              UserChipAmountWidget(
                                text: "Bet",
                                amount:
                                    _viewModel
                                        .gameState
                                        ?.thisPlayer
                                        .currentBet ??
                                    0,
                                assetPath: "assets/icons/chip-128-red.png",
                              ),
                            ],
                          ),
                        ],
                      ),

                      // Player action buttons widget
                      PokerActionButtons(
                        onFold: _onFold,
                        onCheckCall: _onCheckCall,
                        onBetRaise: _onBetRaise,
                        onAllIn: _onAllIn,
                        isTurn:
                            (_viewModel.gameState?.currentTurnPlayerId ==
                                _viewModel.gameState?.thisPlayer.playerId) &&
                            _viewModel.isDisplayingHandResults == false,
                        minBet: _viewModel.gameState?.minimumRaise ?? 0,
                        maxBet: calculateMaxRaise(),
                        currentChips:
                            _viewModel.gameState?.thisPlayer.chips ?? 0,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  void _showHandResults() {
    final gameState = _viewModel.gameState;
    final handResults = gameState?.handResults;
    final isDisplaying = _viewModel.isDisplayingHandResults;

    if (isDisplaying == true && gameState != null && handResults != null) {
      _viewModel.isDisplayingHandResults =
          false; // Reset the flag so that the dialog can be shown again for future hands

      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (context) => HandResultsDialog(
          players: gameState.players,
          thisPlayer: gameState.thisPlayer,
          handResults: handResults,
          communityCards: gameState.communityCards,
        ),
      );
    }
  }

  int calculateMaxRaise() {
    final playerChips = _viewModel.gameState?.thisPlayer.chips ?? 0;
    final currentBet = _viewModel.gameState?.currentBet ?? 0;
    final playerCurrentBet = _viewModel.gameState?.thisPlayer.currentBet ?? 0;

    // Max raise is all remaining chips after calling the current bet
    final maxRaise = playerChips - (currentBet - playerCurrentBet);
    debugPrint(
      '[GamePage] Calculating max raise - playerChips: $playerChips, currentBet: $currentBet, playerCurrentBet: $playerCurrentBet, maxRaise: $maxRaise',
    );
    return maxRaise;
  }

  void _onFold() {
    debugPrint('[GamePage] Fold button pressed');
    _viewModel.fold();
  }

  void _onCheckCall() {
    debugPrint('[GamePage] Check/Call button pressed');
    _viewModel.checkCall();
  }

  void _onBetRaise(int amount) {
    debugPrint('[GamePage] Bet/Raise button pressed');
    _viewModel.betRaise(amount);
  }

  void _onAllIn() {
    debugPrint('[GamePage] All-in button pressed');
    _viewModel.allIn();
  }

  Widget buildPlayerWidget(int tableIndex) {
    final playerId = _viewModel.gameState!.seatAssignments[tableIndex];

    if (playerId == null) {
      return SizedBox(width: 140, height: 100); // No player at this seat
    }

    final player = _viewModel.gameState!.players[playerId];
    if (player == null) {
      return SizedBox(width: 140, height: 100); // Player data not found
    }

    return PlayerWidget(
      player: player,
      currentTurnPlayerId: _viewModel.gameState?.currentTurnPlayerId ?? '',
      dealerId: _viewModel.gameState?.dealerId ?? '',
      smallBlindId: _viewModel.gameState?.smallBlindId ?? '',
      bigBlindId: _viewModel.gameState?.bigBlindId ?? '',
      isEliminated: player.isEliminated,
      hasLeft: player.hasLeft,
    );
  }
}
