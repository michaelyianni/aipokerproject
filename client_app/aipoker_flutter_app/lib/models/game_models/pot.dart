class Pot {
  final int amount;
  final List<String> eligiblePlayerIds; // Player IDs eligible for this pot
  


  const Pot({required this.amount, required this.eligiblePlayerIds});

  factory Pot.fromJson(Map<String, dynamic> json) {
    return Pot(
      amount: json['amount'] ?? 0,
      eligiblePlayerIds: (json['eligiblePlayerIds'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          [],
    );
  }

  Map<String, dynamic> toJson() {
    return {'amount': amount, 'eligiblePlayerIds': eligiblePlayerIds};
  }
}