import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:go_router/go_router.dart';

class AIFeedbackPage extends StatefulWidget {
  const AIFeedbackPage({super.key});

  @override
  State<AIFeedbackPage> createState() => _AIFeedbackPageState();
}

class _AIFeedbackPageState extends State<AIFeedbackPage> {
  int count = 0;

  @override
  void initState() {
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      // Background hex color: #42943C
      backgroundColor: Colors.amber,
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Center(child: Text('AI Feedback', style: TextStyle(fontSize: 60))),
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
