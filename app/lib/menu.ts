export const menu = [
  {
    id: "flakes",
    name: "The Golden Flake",
    description:
      "Our signature rainbow flakes. Light, crispy, and worth swimming in circles for.",
    price: 450,
    category: "Flake favourites",
    emoji: "🥣",
    color: "peach",
    tag: "Bestseller",
    detail: "Classic flakes · Tiny portion",
  },
  {
    id: "peas",
    name: "Peas, Love & Happiness",
    description:
      "Sweet garden peas, perfectly peeled. A little green goodness for your gills.",
    price: 375,
    category: "Plant-based",
    emoji: "🫛",
    color: "green",
    tag: "Plant-powered",
    detail: "Garden greens · Tiny portion",
  },
  {
    id: "pellets",
    name: "The Pellet Platter",
    description:
      "Slow-sinking, bite-sized delights. Good things come to fish who wait.",
    price: 595,
    category: "Pellet bowls",
    emoji: "🧆",
    color: "yellow",
    tag: "Fin favourite",
    detail: "Sinking pellets · Sharing bowl",
  },
  {
    id: "algae",
    name: "The Green Machine",
    description:
      "Spirulina wafers with a generous helping of main-character energy.",
    price: 425,
    category: "Plant-based",
    emoji: "🥬",
    color: "mint",
    tag: "Fresh pick",
    detail: "Algae wafers · Tiny portion",
  },
  {
    id: "shrimp",
    name: "Shrimply Irresistible",
    description:
      "A brine shrimp treat for the fish with a taste for the finer things.",
    price: 650,
    category: "Little treats",
    emoji: "🦐",
    color: "pink",
    tag: "Weekend energy",
    detail: "Brine shrimp · Treat portion",
  },
  {
    id: "duo",
    name: "The Bowl-mate Bundle",
    description:
      "Flakes, pellets, and a little green side. A date night with no awkward silences.",
    price: 995,
    category: "Pellet bowls",
    emoji: "🍱",
    color: "lavender",
    tag: "Made for two",
    detail: "Mixed favourites · Sharing bowl",
  },
];
export const categories = [
  "All dishes",
  "Flake favourites",
  "Pellet bowls",
  "Plant-based",
  "Little treats",
];
export const money = (pence: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(
    pence / 100,
  );
export const deliveryFee = 99;
