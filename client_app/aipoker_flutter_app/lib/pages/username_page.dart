import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:aipoker_flutter_app/providers/user_model.dart';

import 'package:aipoker_flutter_app/widgets/general/menu_button.dart';

class UsernamePage extends ConsumerStatefulWidget {  
  const UsernamePage({super.key});

  @override
  ConsumerState<UsernamePage> createState() => _UsernamePageState();  
}

class _UsernamePageState extends ConsumerState<UsernamePage> { 
  final TextEditingController _usernameController = TextEditingController();

  @override
  void dispose() {
    _usernameController.dispose();
    super.dispose();
  }

  @override
  void initState() {
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      // Background hex color: #D1D1D1
      backgroundColor: Color(0xFFD1D1D1),
      body: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Text('Enter username', style: TextStyle(fontSize: 24)),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 10),
            child: TextField(
              controller: _usernameController,
              maxLength: 20,
              decoration: InputDecoration(
                hintText: 'Username',
                border: OutlineInputBorder(),
                contentPadding: EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 8,
                ),
              ),
              onSubmitted: (value) {
                submitUsername(value);
              },
            ),
          ),
          MenuButton(
            text: 'Submit',
            onPressed: () {
              String username = _usernameController.text;
              submitUsername(username);
            },
          ),
        ],
      ),
    );
  }

  void submitUsername(String username) {
    if (username.isEmpty) {
      if (kDebugMode) {
        debugPrint('Username cannot be empty');
      }
      return;
    }

    if (kDebugMode) {
      debugPrint('Username submitted: $username');
    }

    ref.read(userProvider.notifier).setUsername(username);
    GoRouter.of(context).go('/main-menu');
  }
}