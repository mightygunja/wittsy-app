/**
 * Room Name Generator
 * Generates unique, pretty names for ranked game rooms
 */

const ROOM_NAME_CATEGORIES = {
  planets: [
    'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Neptune', 'Uranus', 'Pluto',
    'Titan', 'Europa', 'Ganymede', 'Callisto', 'Io', 'Enceladus', 'Triton', 'Charon',
    'Ceres', 'Eris', 'Makemake', 'Haumea', 'Sedna', 'Quaoar', 'Orcus', 'Varuna'
  ],
  flowers: [
    'Rose', 'Lily', 'Orchid', 'Tulip', 'Dahlia', 'Peony', 'Iris', 'Jasmine',
    'Lavender', 'Magnolia', 'Azalea', 'Camellia', 'Gardenia', 'Hibiscus', 'Lotus',
    'Marigold', 'Poppy', 'Sunflower', 'Violet', 'Zinnia', 'Aster', 'Begonia',
    'Carnation', 'Daffodil', 'Freesia', 'Hyacinth', 'Lilac', 'Narcissus'
  ],
  gemstones: [
    'Diamond', 'Ruby', 'Sapphire', 'Emerald', 'Amethyst', 'Topaz', 'Opal', 'Pearl',
    'Jade', 'Garnet', 'Aquamarine', 'Citrine', 'Peridot', 'Turquoise', 'Onyx',
    'Moonstone', 'Tanzanite', 'Alexandrite', 'Morganite', 'Kunzite', 'Spinel',
    'Tourmaline', 'Zircon', 'Beryl', 'Jasper', 'Agate', 'Quartz', 'Obsidian'
  ],
  minerals: [
    'Amber', 'Coral', 'Crystal', 'Marble', 'Granite', 'Basalt', 'Obsidian', 'Pumice',
    'Slate', 'Limestone', 'Sandstone', 'Gypsum', 'Calcite', 'Feldspar', 'Mica',
    'Pyrite', 'Galena', 'Hematite', 'Magnetite', 'Malachite', 'Azurite', 'Fluorite'
  ],
  constellations: [
    'Orion', 'Cassiopeia', 'Andromeda', 'Perseus', 'Lyra', 'Cygnus', 'Aquila',
    'Phoenix', 'Draco', 'Pegasus', 'Hercules', 'Gemini', 'Leo', 'Scorpio',
    'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces', 'Aries', 'Taurus', 'Cancer',
    'Virgo', 'Libra', 'Ophiuchus', 'Serpens', 'Hydra', 'Corvus', 'Crater'
  ],
  mythical: [
    'Phoenix', 'Dragon', 'Griffin', 'Unicorn', 'Pegasus', 'Chimera', 'Sphinx',
    'Hydra', 'Kraken', 'Basilisk', 'Cerberus', 'Minotaur', 'Medusa', 'Siren',
    'Valkyrie', 'Banshee', 'Kitsune', 'Fenrir', 'Jormungandr', 'Sleipnir'
  ],
  colors: [
    'Crimson', 'Azure', 'Emerald', 'Golden', 'Silver', 'Violet', 'Indigo', 'Scarlet',
    'Amber', 'Ivory', 'Ebony', 'Coral', 'Teal', 'Magenta', 'Cyan', 'Maroon',
    'Burgundy', 'Turquoise', 'Lavender', 'Periwinkle', 'Cerulean', 'Vermillion'
  ],
  nature: [
    'Aurora', 'Cascade', 'Eclipse', 'Horizon', 'Meridian', 'Nebula', 'Solstice',
    'Equinox', 'Zenith', 'Twilight', 'Dawn', 'Dusk', 'Monsoon', 'Tempest',
    'Zephyr', 'Breeze', 'Thunder', 'Lightning', 'Rainfall', 'Snowfall', 'Starlight'
  ]
};

/**
 * Get all available room names across all categories
 */
const getAllRoomNames = (): string[] => {
  return Object.values(ROOM_NAME_CATEGORIES).flat();
};

/**
 * Generate a random unique room name
 * @param existingNames - Array of names already in use
 * @returns A unique room name
 */
export const generateUniqueRoomName = (existingNames: string[]): string => {
  const allNames = getAllRoomNames();
  const availableNames = allNames.filter(name => !existingNames.includes(name));
  
  // If we've run out of names, start combining them
  if (availableNames.length === 0) {
    const categories = Object.keys(ROOM_NAME_CATEGORIES);
    const category1 = categories[Math.floor(Math.random() * categories.length)];
    const category2 = categories[Math.floor(Math.random() * categories.length)];
    
    const names1 = ROOM_NAME_CATEGORIES[category1 as keyof typeof ROOM_NAME_CATEGORIES];
    const names2 = ROOM_NAME_CATEGORIES[category2 as keyof typeof ROOM_NAME_CATEGORIES];
    
    const name1 = names1[Math.floor(Math.random() * names1.length)];
    const name2 = names2[Math.floor(Math.random() * names2.length)];
    
    // Try different combinations until we find a unique one
    const combinations = [
      `${name1} ${name2}`,
      `${name2} ${name1}`,
      `${name1}'s ${name2}`,
      `${name2} of ${name1}`,
    ];
    
    for (const combo of combinations) {
      if (!existingNames.includes(combo)) {
        return combo;
      }
    }
    
    // If all combinations exist, add a number
    let counter = 1;
    while (existingNames.includes(`${name1} ${name2} ${counter}`)) {
      counter++;
    }
    return `${name1} ${name2} ${counter}`;
  }
  
  // Return a random available name
  return availableNames[Math.floor(Math.random() * availableNames.length)];
};

/**
 * Get a random category name (for display purposes)
 */
export const getRandomCategory = (): string => {
  const categories = Object.keys(ROOM_NAME_CATEGORIES);
  return categories[Math.floor(Math.random() * categories.length)];
};
