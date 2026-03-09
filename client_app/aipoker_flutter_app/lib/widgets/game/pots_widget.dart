import 'package:flutter/material.dart';
import 'package:aipoker_flutter_app/models/game_models/pot_model.dart';

class PotsWidget extends StatelessWidget {
  final List<Pot> pots;

  const PotsWidget({
    required this.pots,
    super.key,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 100,
      padding: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: Color.fromRGBO(47, 129, 41, 1),
        border: Border.all(
          color: Color.fromRGBO(45, 100, 41, 1), // Highlight current turn
          width: 2,
        ),
        borderRadius: BorderRadius.circular(5),
      ),
      child: Column(
        children: [
          Center(
            child: Text(
              "POTS",
              style: TextStyle(color: Colors.white, fontSize: 16),
            ),
          ),
          SizedBox(height: 4),
          Column(
            mainAxisSize: MainAxisSize.min,
            children: pots.map((pot) {
              return Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Image.asset("assets/icons/chipStack.png", width: 20, height: 20),
                  SizedBox(width: 4),
                  Text(
                    '${pot.amount}',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              );
            }).toList(),
          ),
        ],
      ),
    );
  }
}
