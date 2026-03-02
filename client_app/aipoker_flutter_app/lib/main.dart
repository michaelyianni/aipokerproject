import 'package:flutter/material.dart';
import 'package:aipoker_flutter_app/pages/main_menu.dart';
import 'package:aipoker_flutter_app/pages/ai_feedback_page.dart';
import 'package:aipoker_flutter_app/pages/lobby_page.dart';
import 'package:aipoker_flutter_app/pages/game_page.dart';
import 'package:go_router/go_router.dart';

void main() {
  runApp( MyApp() );
}

class MyApp extends StatefulWidget {
  const MyApp({ Key? key }) : super(key: key);

  @override
  State<MyApp> createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> {

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      theme: ThemeData(fontFamily: 'Sans Serif'),
      routerConfig: _router,
    );
  }
}

final GoRouter _router = GoRouter(
  routes: [
    GoRoute(
      path: '/',
      builder: (context, state) => MainMenu(),
    ),
    GoRoute(
      path: '/ai-feedback', 
      builder: (context, state) => AIFeedbackPage(),
    ),
    GoRoute(
      path: '/lobby',
      builder: (context, state) => LobbyPage(),
    ),
    GoRoute(
      path: '/game', 
      builder: (context, state) => GamePage(),
    ),
  ],
);