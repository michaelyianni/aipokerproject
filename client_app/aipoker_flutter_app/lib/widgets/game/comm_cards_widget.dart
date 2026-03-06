import 'package:aipoker_flutter_app/models/game_models/comm_cards_model.dart';
import 'package:flutter/material.dart';
import '../../utils/card_image_utils.dart';

class CommunityCardsWidget extends StatelessWidget {
  final CommunityCards communityCards;
  final double cardWidth;
  final double cardSpacing;

  const CommunityCardsWidget({
    super.key,
    required this.communityCards,
    this.cardWidth = 60.0,
    this.cardSpacing = 8.0,
  });

  @override
  Widget build(BuildContext context) {
    // Show 5 card slots, with backs for unrevealed cards
    final cardsToShow = List.generate(5, (index) {
      if (index < communityCards.cards.length) {
        // Show revealed card
        return _buildCard(communityCards.cards[index]);
      } else {
        // Show card back for unrevealed cards
        return _buildCardBack();
      }
    });

    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        for (int i = 0; i < cardsToShow.length; i++) ...[
          cardsToShow[i],
          if (i < cardsToShow.length - 1) SizedBox(width: cardSpacing),
        ],
      ],
    );
  }

  Widget _buildCard(String cardString) {
    final imagePath = CardImageUtils.getCardImagePath(cardString);
    
    return Container(
      width: cardWidth,
      height: cardWidth * 1.4, // Standard playing card ratio
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(8),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.3),
            blurRadius: 4,
            offset: Offset(0, 2),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(8),
        child: Image.asset(
          imagePath,
          fit: BoxFit.cover,
          errorBuilder: (context, error, stackTrace) {
            // Fallback if image doesn't load
            return Container(
              color: Colors.grey[300],
              child: Center(
                child: Text(
                  cardString,
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                ),
              ),
            );
          },
        ),
      ),
    );
  }

  Widget _buildCardBack() {
    final imagePath = CardImageUtils.getCardBackImage();
    
    return Container(
      width: cardWidth,
      height: cardWidth * 1.4,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(8),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.3),
            blurRadius: 4,
            offset: Offset(0, 2),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(8),
        child: Image.asset(
          imagePath,
          fit: BoxFit.cover,
        ),
      ),
    );
  }
}