import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/server_service.dart';

// Create a provider for ServerService that persists
final serverServiceProvider = Provider<ServerService>((ref) {
  final service = ServerService();
  
  // Dispose when provider is destroyed (app closes)
  ref.onDispose(() {
    service.dispose();
  });
  
  return service;
});