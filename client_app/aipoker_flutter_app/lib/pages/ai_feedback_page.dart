import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:go_router/go_router.dart';
import 'package:path_provider/path_provider.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:aipoker_flutter_app/providers/user_model.dart';
import 'dart:io';

class AIFeedbackPage extends ConsumerStatefulWidget {
  const AIFeedbackPage({super.key});

  @override
  ConsumerState<AIFeedbackPage> createState() => _AIFeedbackPageState();
}

class _AIFeedbackPageState extends ConsumerState<AIFeedbackPage> {
  String? _filePath;
  bool _isWriting = false;

  @override
  void initState() {
    super.initState();

    // Write to file after first frame
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      await _writeRoundHistoriesToFile();
    });
  }

  Future<void> _writeRoundHistoriesToFile() async {
    setState(() => _isWriting = true);

    try {
      // ✅ Write to project root (works on desktop during development)
      final file = File('debug/round_histories.txt'); // Writes to project root

      // Get round histories
      final roundHistories = ref.read(userProvider).getRoundHistories();

      // Write to file
      await file.writeAsString(roundHistories);

      setState(() {
        _filePath = file.absolute.path;
        _isWriting = false;
      });

      if (kDebugMode) {
        debugPrint('✅ Round histories written to: ${file.absolute.path}');
      }
    } catch (e) {
      if (kDebugMode) {
        debugPrint('❌ Error writing round histories: $e');
      }
      setState(() => _isWriting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.amber,
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Center(child: Text('AI Feedback', style: TextStyle(fontSize: 60))),
          Expanded(
            child: SingleChildScrollView(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // Text(
                  //   'Display Round History data for now: \n ${ref.watch(userProvider).getRoundHistories()}',
                  // ),
                  TextButton(
                    onPressed: () {
                      if (kDebugMode) {
                        debugPrint('Back to Main Menu Pressed');
                      }

                      GoRouter.of(context).go('/main-menu');
                    },
                    child: Text("Go Back"),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
