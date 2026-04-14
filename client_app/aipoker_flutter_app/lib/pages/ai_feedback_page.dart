import 'package:aipoker_flutter_app/view_models/ai_feedback_viewmodel.dart';
import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:aipoker_flutter_app/providers/user_model.dart';
import 'dart:io';

import 'package:aipoker_flutter_app/widgets/general/back_button.dart';

import '../providers/server_service_provider.dart';

class AIFeedbackPage extends ConsumerStatefulWidget {
  const AIFeedbackPage({super.key});

  @override
  ConsumerState<AIFeedbackPage> createState() => _AIFeedbackPageState();
}

class _AIFeedbackPageState extends ConsumerState<AIFeedbackPage> {
  late AIFeedbackViewmodel _viewModel;

  @override
  @override
  void initState() {
    super.initState();

    final serverService = ref.read(serverServiceProvider);
    final userModel = ref.read(userProvider); 
    final userNotifier = ref.read(userProvider.notifier);

     _viewModel = AIFeedbackViewmodel(serverService, userModel, userNotifier);

     debugPrint('[AIFeedbackPage] ViewModel initialized with ServerService and UserModel');

    // Write to file after first frame (only works on desktop during development, ignored in production)
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      await _writeRoundHistoriesToFile();
    });
  }

  Future<void> _writeRoundHistoriesToFile() async {
    try {
      // Write to project root (works on desktop during development)
      final file = File('debug/round_histories.txt'); // Writes to project root

      // Get round histories
      final roundHistories = ref.read(userProvider).getHandHistories();

      // Write to file
      await file.writeAsString(roundHistories);

      if (kDebugMode) {
        debugPrint('Success - Round histories written to: ${file.absolute.path}');
      }
    } catch (e) {
      if (kDebugMode) {
        debugPrint('Error writing round histories: $e');
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: _viewModel,
      builder: (context, child) {
        if (_viewModel.isLoading) {
          return Scaffold(
            backgroundColor: Colors.amber,
            body: Center(child: CircularProgressIndicator()),
          );
        }

        if (_viewModel.feedback == null) {
          return Scaffold(
            backgroundColor: Colors.amber,
            body: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text('Error - no AI feedback available.'),
                  TextButton(onPressed: _onBackPressed, child: Text("Go Back")),
                ],
              ),
            ),
          );
        }

        return Scaffold(
          backgroundColor: Color(0xFFE5BB48),
          body: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              SizedBox(height: 15),

              // Header row
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16.0),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Feedback & Advice',
                      style: TextStyle(
                        fontSize: 32,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    CustomBackButton(onPressed: _onBackPressed),
                  ],
                ),
              ),

              SizedBox(height: 20),

              Expanded(
                child: Container(
                  margin: EdgeInsets.symmetric(
                    horizontal: 16.0,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(
                      12,
                    ), 
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(
                          0.5,
                        ), 
                        blurRadius: 8,
                        offset: Offset(0, 2),
                      ),
                    ],
                  ),
                  child: SingleChildScrollView(
                    padding: EdgeInsets.all(16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Feedback:',
                          style: TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        SizedBox(height: 10),
                        MarkdownBody(
                          data: _viewModel.feedback ?? 'No feedback available',
                          styleSheet: MarkdownStyleSheet(
                            p: TextStyle(fontSize: 14),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),

              // Bottom spacing
              SizedBox(height: 30),
            ],
          ),
        );
      },
    );
  }

  void _onBackPressed() {
    if (kDebugMode) {
      debugPrint('Back to Main Menu Pressed');
    }

    GoRouter.of(context).go('/main-menu');
  }
}
