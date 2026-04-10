import 'package:flutter/material.dart';
import '../../models/game_models/player_model.dart';
import '../../models/game_models/hand_results_model.dart';
import '../../models/game_models/comm_cards_model.dart';
import '../../utils/card_image_utils.dart';
import '../../models/game_models/winner_model.dart';

class HandResultsDialog extends StatelessWidget {
  final Map<String, Player> players;
  final Player thisPlayer;
  final HandResults handResults;
  final CommunityCards communityCards;

  const HandResultsDialog({
    super.key,
    required this.players,
    required this.thisPlayer,
    required this.handResults,
    required this.communityCards,
  });

  @override
  Widget build(BuildContext context) {
    final didIWin = handResults.winners.any(
      (w) => w.playerId == thisPlayer.playerId,
    );
    final showCards = handResults.winners.any((w) => w.reason == 'best hand');

    return Dialog(
      backgroundColor: Colors.transparent,
      child: Container(
        constraints: BoxConstraints(maxWidth: 500, maxHeight: 700),
        padding: EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: Color.fromRGBO(66, 148, 60, 1.0),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.black, width: 3),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.5),
              blurRadius: 20,
              offset: Offset(0, 10),
            ),
          ],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Header
            _buildHeader(didIWin),

            SizedBox(height: 20),

            // Winners list and cards section
            Flexible(
              child: SingleChildScrollView(
                child: Column(
                  children: [
                    

                    // Winners list with compact cards
                    _buildWinnersSection(showCards),
                    SizedBox(height: 20),
                    // Community cards
                    _buildCommunityCardsSection(),
                  ],
                ),
              ),
            ),

            SizedBox(height: 20),

            // Continue button
            SizedBox(
              width: double.infinity,
              height: 56,
              child: ElevatedButton(
                onPressed: () => Navigator.of(context).pop(),
                style: ElevatedButton.styleFrom(
                  backgroundColor: didIWin
                      ? Color.fromARGB(255, 224, 168, 0)
                      : Color.fromARGB(255, 0, 128, 239),
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                    side: BorderSide(color: Colors.black, width: 2),
                  ),
                  elevation: 4,
                ),
                child: Text(
                  'Continue',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader(bool didIWin) {
    return Column(
      children: [
        Text(
          didIWin ? '🎉 You Won! 🎉' : 'Hand Complete',
          style: TextStyle(
            fontSize: didIWin ? 32 : 28,
            fontWeight: FontWeight.bold,
            color: Colors.white,
          ),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }

  Widget _buildCommunityCardsSection() {
    return Column(
      children: [
        Text(
          'Board',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: Colors.white,
          ),
        ),
        SizedBox(height: 8),
        Container(
          padding: EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.black.withOpacity(0.25),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: Colors.white30, width: 1),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            mainAxisSize: MainAxisSize.max,
            children: communityCards.cards
                .map((card) => _buildCard(card, size: 40))
                .toList(),
          ),
        ),
      ],
    );
  }

  Widget _buildWinnersSection(bool showCards) {
    // Collect all players to show (winners + other active players)
    final playersToShow = <String, bool>{}; // playerId -> isWinner

    for (var winner in handResults.winners) {
      if (winner.reason == 'best hand') {
        playersToShow[winner.playerId] = true;
      }
    }

    for (var playerId in handResults.otherActivePlayers) {
      playersToShow[playerId] = false;
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          handResults.winners.length == 1 ? 'Winner:' : 'Winners:',
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: Colors.white,
          ),
        ),
        SizedBox(height: 12),

        // Show winners with their winnings
        ...handResults.winners.map(
          (winner) => _buildWinnerTile(winner, showCards),
        ),

        // Show showdown section if cards should be displayed
        if (showCards && playersToShow.isNotEmpty) ...[
          SizedBox(height: 16),
          Divider(color: Colors.white30, thickness: 2),
          SizedBox(height: 16),
          Text(
            'Showdown',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
          SizedBox(height: 12),
          ...playersToShow.entries.map(
            (entry) =>
                _buildCompactPlayerCards(entry.key, isWinner: entry.value),
          ),
        ],
      ],
    );
  }

  Widget _buildWinnerTile(Winner winner, bool showCards) {
    final player = players[winner.playerId];
    final isThisPlayer = winner.playerId == thisPlayer.playerId;

    return Container(
      margin: EdgeInsets.only(bottom: 12),
      padding: EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isThisPlayer
            ? Color.fromARGB(255, 224, 168, 0).withOpacity(0.3)
            : Colors.black.withOpacity(0.3),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: isThisPlayer
              ? Color.fromARGB(255, 224, 168, 0)
              : Colors.white30,
          width: isThisPlayer ? 3 : 1,
        ),
      ),
      child: Row(
        children: [
          // Player name
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(
                      player?.name ?? 'Unknown',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                    if (isThisPlayer) ...[
                      SizedBox(width: 8),
                      Container(
                        padding: EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: Color.fromARGB(255, 224, 168, 0),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          'YOU',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            color: Colors.black,
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
                SizedBox(height: 4),
                Text(
                  _formatReason(winner.reason),
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.white70,
                    fontStyle: FontStyle.italic,
                  ),
                ),
              ],
            ),
          ),
          // Amount won
          Text(
            '+\$${winner.amount}',
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: Color.fromARGB(255, 0, 255, 100), // Green
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCompactPlayerCards(String playerId, {required bool isWinner}) {
    final player = players[playerId];
    if (player == null) return SizedBox.shrink();

    final isThisPlayer = player.playerId == thisPlayer.playerId;

    return Container(
      margin: EdgeInsets.only(bottom: 10),
      padding: EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: isWinner
            ? Color.fromARGB(255, 224, 168, 0).withOpacity(0.2)
            : Colors.black.withOpacity(0.2),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: isWinner ? Color.fromARGB(255, 224, 168, 0) : Colors.white24,
          width: isWinner ? 2 : 1,
        ),
      ),
      child: Row(
        children: [
          // Player name
          Expanded(
            child: Row(
              children: [
                Text(
                  player.name,
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
                if (isThisPlayer) ...[
                  SizedBox(width: 6),
                  Text(
                    '(You)',
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.white70,
                      fontStyle: FontStyle.italic,
                    ),
                  ),
                ],
              ],
            ),
          ),
          // Compact cards display
          Row(
            children: player.hand
                .map((card) => _buildCard(card, size: 45))
                .toList(),
          ),
          // Winner trophy
          if (isWinner) ...[
            SizedBox(width: 8),
            Icon(
              Icons.emoji_events,
              color: Color.fromARGB(255, 255, 215, 0),
              size: 20,
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildCard(String cardString, {double size = 50}) {
    final imagePath = CardImageUtils.getCardImagePath(cardString);

    return Container(
      width: size,
      height: size * 1.4,
      margin: EdgeInsets.only(right: 6),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(6),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.3),
            blurRadius: 4,
            offset: Offset(0, 2),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(6),
        child: Image.asset(imagePath, fit: BoxFit.cover),
      ),
    );
  }

  String _formatReason(String reason) {
    return reason
        .split(' ')
        .map(
          (word) =>
              word.isEmpty ? '' : word[0].toUpperCase() + word.substring(1),
        )
        .join(' ');
  }
}
