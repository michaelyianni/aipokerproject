import 'package:flutter/material.dart';

class UserChipAmountWidget extends StatelessWidget {
  final String text;
  final int amount;
  final String assetPath;

  const UserChipAmountWidget({
    required this.text,
    required this.amount,
    required this.assetPath,
    super.key,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 120,
      height: 80,
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
              text,
              style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
            ),
          ),
          SizedBox(height: 10),
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Image.asset(assetPath, width: 20, height: 20),
              SizedBox(width: 8),
              Text(
                '$amount',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
