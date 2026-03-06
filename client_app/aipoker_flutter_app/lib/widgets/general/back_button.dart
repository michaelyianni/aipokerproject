import 'package:flutter/material.dart';

class CustomBackButton extends StatelessWidget {
  final VoidCallback onPressed;
  final Color color;

  const CustomBackButton({required this.onPressed, this.color = Colors.black, super.key});

  @override
  Widget build(BuildContext context) {
    return IconButton(
      icon: Icon(Icons.arrow_back, color: color),
      onPressed: onPressed,
    );
  }
}
