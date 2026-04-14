import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

class PokerActionButtons extends StatelessWidget {
  final VoidCallback onFold;
  final VoidCallback onCheckCall;
  final Function(int) onBetRaise;
  final VoidCallback onAllIn;

  final bool isTurn;

  // Betting constraints
  final int minBet;
  final int maxBet;
  final int currentChips;

  const PokerActionButtons({
    super.key,
    required this.onFold,
    required this.onCheckCall,
    required this.onBetRaise,
    required this.onAllIn,
    required this.isTurn,
    required this.minBet,
    required this.maxBet,
    required this.currentChips,
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
                onPressed: isTurn ? onFold : null,
                isEnabled: isTurn,
              ),
            ),
            SizedBox(width: 5),
            Expanded(
              child: _buildActionButton(
                label: 'Check/Call',
                color: Color.fromARGB(255, 0, 128, 239), // Blue
                onPressed: isTurn ? onCheckCall : null,
                isEnabled: isTurn,
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
                label: 'Bet/Raise',
                color: Color.fromARGB(255, 33, 167, 37), // Green
                onPressed: isTurn && maxBet > minBet && currentChips > minBet ? () => _showBetRaiseDialog(context) : null,
                isEnabled: isTurn && maxBet > minBet && currentChips > minBet, // Enable only if betting is possible
              ),
            ),
            SizedBox(width: 5),
            Expanded(
              child: _buildActionButton(
                label: 'All-in',
                color: Color.fromARGB(255, 224, 168, 0), // Orange/Gold
                onPressed: isTurn ? onAllIn : null,
                isEnabled: isTurn,
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
    required VoidCallback? onPressed,
    required bool isEnabled,
  }) {
    // Calculate disabled color (desaturated and darkened)
    final disabledColor = Color.fromARGB(
      255,
      (color.red * 0.4).round(),
      (color.green * 0.4).round(),
      (color.blue * 0.4).round(),
    );

    return SizedBox(
      height: 110,
      child: ElevatedButton(
        onPressed: onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: isEnabled ? color : disabledColor,
          foregroundColor: isEnabled
              ? Colors.white
              : Colors.white.withOpacity(0.5),
          disabledBackgroundColor: disabledColor,
          disabledForegroundColor: Colors.white.withOpacity(0.5),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
            side: BorderSide(
              color: isEnabled ? Colors.black : Colors.black.withOpacity(0.3),
              width: 1,
            ),
          ),
          elevation: isEnabled ? 4 : 1,
          shadowColor: Colors.black.withOpacity(isEnabled ? 0.5 : 0.2),
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

  void _showBetRaiseDialog(BuildContext context) {
    showDialog(
      context: context,
      barrierDismissible: true,
      builder: (BuildContext context) {
        return _BetRaiseDialog(
          minBet: minBet,
          maxBet: maxBet,
          currentChips: currentChips,
          onPlaceBet: (amount) {
            Navigator.of(context).pop();
            onBetRaise(amount);
          },
        );
      },
    );
  }
}

// Separate stateful widget for the dialog
class _BetRaiseDialog extends StatefulWidget {
  final int minBet;
  final int maxBet;
  final int currentChips;
  final Function(int) onPlaceBet;

  const _BetRaiseDialog({
    required this.minBet,
    required this.maxBet,
    required this.currentChips,
    required this.onPlaceBet,
  });

  @override
  State<_BetRaiseDialog> createState() => _BetRaiseDialogState();
}

class _BetRaiseDialogState extends State<_BetRaiseDialog> {
  late double _sliderValue;
  late TextEditingController _textController;

  @override
  void initState() {
    super.initState();
    _sliderValue = widget.minBet.toDouble();
    _textController = TextEditingController(text: widget.minBet.toString());
  }

  @override
  void dispose() {
    _textController.dispose();
    super.dispose();
  }

  void _updateFromSlider(double value) {
    setState(() {
      _sliderValue = value;
      _textController.text = value.round().toString();
    });
  }

  void _updateFromTextField(String value) {
    final amount = int.tryParse(value);

    // Display warning if input is out of bounds
    if (amount != null && (amount < widget.minBet || amount > widget.maxBet)) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'Please enter an amount between \$${widget.minBet} and \$${widget.maxBet}.',
          ),
          backgroundColor: Colors.redAccent,
        ),
      );
    }

    if (amount != null) {
      setState(() {
        // Clamp value between min and max
        _sliderValue = amount.clamp(widget.minBet, widget.maxBet).toDouble();
      });
    }
  }

  void _placeBet() {
    final amount = _sliderValue.round();
    if (amount >= widget.minBet && amount <= widget.maxBet) {
      widget.onPlaceBet(amount);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      backgroundColor: Colors.transparent,
      child: Container(
        padding: EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Color.fromRGBO(66, 148, 60, 1.0), // Poker table green
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.black, width: 2),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Header with title and close button
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Bet/Raise Amount',
                  style: TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
                IconButton(
                  icon: Icon(Icons.close, color: Colors.white, size: 28),
                  onPressed: () => Navigator.of(context).pop(),
                  padding: EdgeInsets.zero,
                  constraints: BoxConstraints(),
                ),
              ],
            ),

            SizedBox(height: 20),

            // Chip count display
            Text(
              'Your chips: ${widget.currentChips}',
              style: TextStyle(fontSize: 16, color: Colors.white70),
            ),

            SizedBox(height: 10),

            // Current amount display
            Container(
              padding: EdgeInsets.symmetric(vertical: 16, horizontal: 24),
              decoration: BoxDecoration(
                color: Colors.black.withOpacity(0.3),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.white24, width: 1),
              ),
              child: Text(
                '\$${_sliderValue.round()}',
                style: TextStyle(
                  fontSize: 36,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
            ),

            SizedBox(height: 20),

            // Slider
            Column(
              children: [
                Slider(
                  value: _sliderValue,
                  min: widget.minBet.toDouble(),
                  max: widget.maxBet.toDouble(),
                  divisions: (widget.maxBet - widget.minBet) > 100
                      ? 100
                      : (widget.maxBet - widget.minBet),
                  label: '\$${_sliderValue.round()}',
                  activeColor: Colors.white,
                  inactiveColor: Colors.white30,
                  onChanged: _updateFromSlider,
                ),
                // Min and Max labels
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      '\$${widget.minBet}',
                      style: TextStyle(color: Colors.white70, fontSize: 14),
                    ),
                    Text(
                      '\$${widget.maxBet}',
                      style: TextStyle(color: Colors.white70, fontSize: 14),
                    ),
                  ],
                ),
              ],
            ),

            SizedBox(height: 16),

            // Minimum bet indicator
            Container(
              padding: EdgeInsets.symmetric(vertical: 8, horizontal: 16),
              decoration: BoxDecoration(
                color: Colors.black.withOpacity(0.2),
                borderRadius: BorderRadius.circular(6),
                border: Border.all(color: Colors.white24, width: 1),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.info_outline, color: Colors.white70, size: 18),
                  SizedBox(width: 8),
                  Text(
                    'Minimum raise: \$${widget.minBet}',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 15,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ),

            SizedBox(height: 16),

            // Text input
            TextField(
              controller: _textController,
              keyboardType: TextInputType.number,
              inputFormatters: [FilteringTextInputFormatter.digitsOnly],
              style: TextStyle(color: Colors.white, fontSize: 18),
              textAlign: TextAlign.center,
              decoration: InputDecoration(
                labelText: 'Enter amount',
                labelStyle: TextStyle(color: Colors.white70),
                filled: true,
                fillColor: Colors.black.withOpacity(0.3),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: BorderSide(color: Colors.white30),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: BorderSide(color: Colors.white30),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: BorderSide(color: Colors.white, width: 2),
                ),
              ),
              onChanged: _updateFromTextField,
            ),

            SizedBox(height: 24),

            // Place bet button
            SizedBox(
              width: double.infinity,
              height: 56,
              child: ElevatedButton(
                onPressed: _placeBet,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Color.fromARGB(255, 33, 167, 37), // Green
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                    side: BorderSide(color: Colors.black, width: 2),
                  ),
                  elevation: 4,
                ),
                child: Text(
                  'Place Bet',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
