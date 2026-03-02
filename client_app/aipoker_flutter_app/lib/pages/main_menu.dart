import 'dart:math';

import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:aipoker_flutter_app/widgets/menu/menu_button.dart';
import 'package:go_router/go_router.dart';

class MainMenu extends StatefulWidget {
  const MainMenu({super.key});

  @override
  State<MainMenu> createState() => _MainMenuState();
}

class _MainMenuState extends State<MainMenu> {
  int count = 0;

  @override
  void initState() {
    // TODO: implement initState
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
        Center(child: Text('Apoki', style: TextStyle(fontSize: 60))),
        Expanded(
          child: Column(
            spacing: 5,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              MenuButton(
                text: 'Join Lobby',
                onPressed: onJoinLobbyPressed,
              ),
              MenuButton(
                text: 'AI Feedback',
                onPressed: onAIFeedbackPressed,
              ),
            ],
          ),
        ),
      ],
    ),
  );
}


  void onJoinLobbyPressed() {
    if (kDebugMode) {
      debugPrint('Join Lobby Pressed');
    }

    GoRouter.of(context).go('/lobby');
  }

  void onAIFeedbackPressed() {
    if (kDebugMode) {
      debugPrint('AI Feedback Pressed');
    }

    // TODO: Join the lobby before navigating to the AI Feedback page. Pass the lobby state and assigned player id to the AI Feedback page.

    GoRouter.of(context).go('/ai-feedback');
  }
}
