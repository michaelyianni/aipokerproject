import 'package:flutter/material.dart';

import 'package:aipoker_flutter_app/models/game_models/player_model.dart';

class PlayerWidget extends StatelessWidget {
  final Player player;
  final String currentTurnPlayerId;
  final String dealerId;
  final String smallBlindId;
  final String bigBlindId;
  final bool isEliminated;
  final bool hasLeft;

  const PlayerWidget({
    required this.player,
    required this.currentTurnPlayerId,
    required this.dealerId,
    required this.smallBlindId,
    required this.bigBlindId,
    required this.isEliminated,
    required this.hasLeft,
    super.key,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 140,
      height: 100,
      padding: EdgeInsets.symmetric(horizontal: 4, vertical: 4),
      decoration: BoxDecoration(
        color: Color.fromRGBO(47, 129, 41, 1),
        border: Border.all(
          color: player.playerId == currentTurnPlayerId
              ? Colors.yellow
              : Color.fromRGBO(45, 100, 41, 1), // Highlight current turn
          width: 2,
        ),
        borderRadius: BorderRadius.circular(5),
      ),
      child: Column(
        children: [
          // Player name with icon
          Row(
            children: [
              Image.asset(
                'assets/icons/player_icon.png',
                width: 20,
                height: 20,
              ),
              SizedBox(width: 4),
              Text(
                player.name,
                style: TextStyle(
                  color: player.playerId == currentTurnPlayerId
                      ? Colors.yellow
                      : Colors.white,
                  fontSize: 16,
                ),
              ),
            ],
          ),
          SizedBox(height: 8),
          // Chips and Current Bet
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              // Chips
              Row(
                mainAxisAlignment: MainAxisAlignment.start,
                children: [
                  Image.asset(
                    'assets/icons/chip-128-blue.png',
                    width: 20,
                    height: 20,
                  ),
                  SizedBox(width: 4),
                  Text(
                    player.chips.toString(),
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
              SizedBox(width: 8),
              // Current Bet
              Row(
                mainAxisAlignment: MainAxisAlignment.start,
                children: [
                  Image.asset(
                    'assets/icons/chip-128-red.png',
                    width: 20,
                    height: 20,
                  ),
                  SizedBox(width: 4),
                  Text(
                    player.currentBet.toString(),
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ],
          ),
          SizedBox(height: 8),

          Row(
            mainAxisSize: MainAxisSize.max,
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              // Dealer Button
              Container(
                child: player.playerId == dealerId
                    ? Image.asset(
                        'assets/icons/dealer-coin.png',
                        width: 28,
                        height: 28,
                      )
                    : SizedBox(width: 28, height: 28),
              ),
              // Status Indicator
              Container(
                padding: EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                decoration: BoxDecoration(
                  color: player.hasLeft
                      ? Colors.blueGrey
                      : player.isEliminated
                      ? Colors.red
                      : player.hasFolded
                      ? Colors.grey
                      : player.isAllIn
                      ? Colors.orange
                      : Colors.green,
                  borderRadius: BorderRadius.circular(3),
                ),
                child: Text(
                  player.hasLeft
                      ? 'Left'
                      : player.isEliminated
                      ? 'Eliminated'
                      : player.hasFolded
                      ? 'Folded'
                      : player.isAllIn
                      ? 'All-In'
                      : 'Active',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              // Small Blind or Big Blind Button
              Container(
                child: player.playerId == smallBlindId
                    ? Image.asset(
                        'assets/icons/sb-coin.png',
                        width: 28,
                        height: 28,
                      )
                    : player.playerId == bigBlindId
                    ? Image.asset(
                        'assets/icons/bb-coin.png',
                        width: 28,
                        height: 28,
                      )
                    : SizedBox(width: 28, height: 28),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
