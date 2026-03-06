class CardImageUtils {
  // Map server format to image filename
  static String getCardImagePath(String cardString) {
    if (cardString.isEmpty || cardString.length < 2) {
      return 'assets/cards/Back_Blue.png'; // Fallback
    }

    // Extract rank and suit from string like "2d", "Tc", "Ah"
    final rank = cardString[0].toUpperCase(); // '2', 'T', 'A', etc.
    final suitChar = cardString[1].toLowerCase(); // 'd', 'c', 'h', 's'

    // Map suit character to image prefix
    final suitPrefix = _getSuitPrefix(suitChar);
    
    // Map rank to image format (T -> 10)
    final rankForImage = rank == 'T' ? '10' : rank;

    return 'assets/cards/$suitPrefix$rankForImage.png';
  }

  static String _getSuitPrefix(String suitChar) {
    switch (suitChar) {
      case 'h':
        return 'H'; // Hearts
      case 'd':
        return 'D'; // Diamonds
      case 'c':
        return 'C'; // Clubs
      case 's':
        return 'S'; // Spades
      default:
        return 'H'; // Fallback
    }
  }

  // Get card back image
  static String getCardBackImage({bool isBlue = true}) {
    return isBlue ? 'assets/cards/Back_Blue.png' : 'assets/cards/Back_Red.png';
  }

  // Examples:
  // "2d" -> "assets/cards/D2.png"
  // "6s" -> "assets/cards/S6.png"
  // "Tc" -> "assets/cards/C10.png"
  // "Ah" -> "assets/cards/HA.png"
  // "Kd" -> "assets/cards/DK.png"
}