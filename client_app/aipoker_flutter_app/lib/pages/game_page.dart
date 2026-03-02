import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:go_router/go_router.dart';

class GamePage extends StatefulWidget {
  const GamePage({super.key});

  @override
  State<GamePage> createState() => _GamePageState();
}

class _GamePageState extends State<GamePage> {
  int count = 0;

  @override
  void initState() {
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      // Background hex color: #42943C
      backgroundColor: Color.fromRGBO(66, 148, 60, 1.0),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Center(child: Text('Game', style: TextStyle(fontSize: 60))),
          Expanded(
            child: Column(
              spacing: 5,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text('This page is under construction.'),
                TextButton(
                  onPressed: () {
                    if (kDebugMode) {
                      debugPrint('Back to Main Menu Pressed');
                    }

                    GoRouter.of(context).go('/');
                  },
                  child: Text("Go Back"),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
