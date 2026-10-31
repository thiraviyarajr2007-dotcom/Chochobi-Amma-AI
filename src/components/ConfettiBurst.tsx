import confetti from 'canvas-confetti';

export const triggerConfetti = () => {
  // Auspicious Pongal festive palette: Kumkum Rose, Turmeric Gold, Leaf Green, Sky Cream
  const colors = ['#C2185B', '#FFB300', '#2E7D32', '#FF8F00', '#FCE4EC'];

  confetti({
    particleCount: 80,
    spread: 70,
    origin: { y: 0.65 },
    colors: colors,
    ticks: 200,
    gravity: 1.1,
    scalar: 1.1,
  });

  // Secondary delayed burst for joyful effect
  setTimeout(() => {
    confetti({
      particleCount: 50,
      angle: 60,
      spread: 55,
      origin: { x: 0.2, y: 0.65 },
      colors: colors,
    });
    confetti({
      particleCount: 50,
      angle: 120,
      spread: 55,
      origin: { x: 0.8, y: 0.65 },
      colors: colors,
    });
  }, 250);
};

export const ConfettiBurst: React.FC<{ trigger?: boolean }> = () => {
  return null;
};

