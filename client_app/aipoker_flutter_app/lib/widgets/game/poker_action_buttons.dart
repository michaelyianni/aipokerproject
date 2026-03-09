import 'package:flutter/material.dart';

class PokerActionButtons extends StatelessWidget {
  final VoidCallback onFold;
  final VoidCallback onCheckCall;
  final Function(int) onBetRaise;
  final VoidCallback onAllIn;

  // Optional: Custom button labels
  final String? checkCallLabel;
  final String? betRaiseLabel;

  const PokerActionButtons({
    super.key,
    required this.onFold,
    required this.onCheckCall,
    required this.onBetRaise,
    required this.onAllIn,
    this.checkCallLabel,
    this.betRaiseLabel,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        // Top row: Fold and Check/Call
        Row(
          children: [
            Expanded(
              child: _buildActionButton(
                label: 'Fold',
                color: Color.fromARGB(255, 226, 34, 34), // Red
                onPressed: onFold,
              ),
            ),
            SizedBox(width: 5),
            Expanded(
              child: _buildActionButton(
                label: checkCallLabel ?? 'Check/Call',
                // Hex: 0080EF, RGB: (0, 128, 239)
                color: Color.fromARGB(255, 0, 128, 239), // Blue
                onPressed: onCheckCall,
              ),
            ),
          ],
        ),
        SizedBox(height: 5),
        // Bottom row: Bet/Raise and All-in
        Row(
          children: [
            Expanded(
              child: _buildActionButton(
                label: betRaiseLabel ?? 'Bet/Raise',
                // Hex: 21A725, RGB: (33, 167, 37)
                color: Color.fromARGB(255, 33, 167, 37), // Green
                onPressed:
                    () => // TODO: Create pop up to enter bet amount
                    onBetRaise(
                      0,
                    ), // Placeholder amount, replace with actual input
              ),
            ),
            SizedBox(width: 5),
            Expanded(
              child: _buildActionButton(
                label: 'All-in',
                color: Color.fromARGB(255, 224, 168, 0), // Orange/Gold
                onPressed: onAllIn,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildActionButton({
    required String label,
    required Color color,
    required VoidCallback onPressed,
  }) {
    return SizedBox(
      height: 110,
      child: ElevatedButton(
        onPressed: onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: color,
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
            side: BorderSide(color: Colors.black, width: 1),
          ),
          elevation: 4,
          shadowColor: Colors.black.withOpacity(0.5),
          padding: EdgeInsets.symmetric(vertical: 20),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            letterSpacing: 0.5,
          ),
          textAlign: TextAlign.center,
        ),
      ),
    );
  }
}
