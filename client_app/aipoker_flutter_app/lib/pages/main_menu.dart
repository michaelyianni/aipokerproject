import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:aipoker_flutter_app/widgets/general/menu_button.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:aipoker_flutter_app/models/user_model.dart';

class MainMenu extends ConsumerStatefulWidget {  // Changed to ConsumerStatefulWidget
  const MainMenu({super.key});

  @override
  ConsumerState<MainMenu> createState() => _MainMenuState();  // Changed to ConsumerState
}

class _MainMenuState extends ConsumerState<MainMenu> {  // Changed to ConsumerState
  int count = 0;

  @override
  void initState() {
    // TODO: implement initState
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    // Use ref.watch to read the username
    final username = ref.watch(userProvider).username ?? 'No username';
    
    return Scaffold(
      // Background hex color: #42943C
      backgroundColor: Color.fromRGBO(66, 148, 60, 1.0),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          SizedBox(height: 20),
          Row(
            children: [
              SizedBox(width: 10),
              Text(
                username,
                style: TextStyle(fontSize: 20),
              ),
            ],
          ),
          Center(child: Text('Apoki', style: TextStyle(fontSize: 60))),
          Expanded(
            child: Column(
              spacing: 5,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                MenuButton(text: 'Join Lobby', onPressed: onJoinLobbyPressed),
                MenuButton(text: 'AI Feedback', onPressed: onAIFeedbackPressed),
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