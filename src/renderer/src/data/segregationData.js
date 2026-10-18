/**
 * Comprehensive waste segregation directory data and quiz questions
 * aligned with urban municipal solid waste segregation guidelines.
 */

export const WASTE_CATEGORIES = {
  WET: {
    id: 'wet',
    name: 'Wet / Biodegradable',
    binColor: 'Green',
    colorClass: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    badgeBg: 'bg-emerald-600',
    hex: '#10B981',
    description: 'Kitchen organic waste, cooked and uncooked food scraps, garden prunings that decompose naturally.'
  },
  DRY: {
    id: 'dry',
    name: 'Dry / Recyclable',
    binColor: 'Blue',
    colorClass: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    badgeBg: 'bg-blue-600',
    hex: '#3B82F6',
    description: 'Clean paper, plastic bottles, metal cans, glass containers, and clean cardboard packaging.'
  },
  HAZARDOUS: {
    id: 'hazardous',
    name: 'Domestic Hazardous',
    binColor: 'Red / Hazard Receptacle',
    colorClass: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    badgeBg: 'bg-rose-600',
    hex: '#F43F5E',
    description: 'Paints, chemical solvents, batteries, pesticide containers, and expired pharmaceuticals.'
  },
  EWASTE: {
    id: 'ewaste',
    name: 'Electronic Waste (E-Waste)',
    binColor: 'Orange / E-Waste Bin',
    colorClass: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    badgeBg: 'bg-amber-600',
    hex: '#F59E0B',
    description: 'Old computers, phones, cables, circuit boards, LED bulbs, and electrical appliances.'
  },
  SANITARY: {
    id: 'sanitary',
    name: 'Sanitary Waste',
    binColor: 'Yellow / Marked Wrap',
    colorClass: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    badgeBg: 'bg-yellow-600',
    hex: '#EAB308',
    description: 'Diapers, sanitary pads, medical bandages, cotton swabs. Must be wrapped in newspaper and marked with a red cross.'
  },
  REJECT: {
    id: 'reject',
    name: 'Reject / Non-Recyclable',
    binColor: 'Black / Gray',
    colorClass: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
    badgeBg: 'bg-slate-600',
    hex: '#64748B',
    description: 'Contaminated items, thermal receipts, broken ceramics, composites, vacuum cleaner dust.'
  }
};

export const WASTE_ITEMS = [
  {
    id: 'item-01',
    name: 'Vegetable & Fruit Peels',
    category: 'Wet / Biodegradable',
    categoryId: 'wet',
    binColor: 'Green Bin',
    specialHandling: false,
    method: 'Home composting or municipal wet waste collection.',
    instructions: 'Keep dry without plastic packaging. Can be directly added to aerobic compost tumblers or vermicompost beds.',
    precautions: 'Do not mix with plastic stickers or rubber bands often found on produce.',
    tips: 'Fruit peels add moisture and nitrogen to compost. Citrus peels should be balanced with dry brown matter.'
  },
  {
    id: 'item-02',
    name: 'Leftover Cooked Food',
    category: 'Wet / Biodegradable',
    categoryId: 'wet',
    binColor: 'Green Bin',
    specialHandling: false,
    method: 'Drain liquids, place in kitchen organic bin.',
    instructions: 'Strain excess gravy or soup before disposal to prevent leachate and unpleasant odor.',
    precautions: 'Keep meat and dairy in sealed bio-bins to prevent attracting rodents.',
    tips: 'Ideal for city biomethanation plants generating electricity or biogas.'
  },
  {
    id: 'item-03',
    name: 'Paper & Cardboard Boxes',
    category: 'Dry / Recyclable',
    categoryId: 'dry',
    binColor: 'Blue Bin',
    specialHandling: false,
    method: 'Flatten boxes, bundle neatly, keep completely dry.',
    instructions: 'Remove excessive packing tape, plastic bubble wraps, and Styrofoam before bundling.',
    precautions: 'Wet or greasy paper (like used pizza bottoms) cannot be recycled and goes into wet or reject waste.',
    tips: 'Recycling 1 ton of clean cardboard saves up to 17 mature trees and 7,000 gallons of water.'
  },
  {
    id: 'item-04',
    name: 'Plastic Bottles (PET / HDPE)',
    category: 'Dry / Recyclable',
    categoryId: 'dry',
    binColor: 'Blue Bin',
    specialHandling: false,
    method: 'Rinse, crush flat, replace cap loosely.',
    instructions: 'Empty all liquids. Crushing bottles saves 70% of storage space in collection vehicles.',
    precautions: 'Do not throw bottles containing toxic liquids or engine oil into the standard blue bin.',
    tips: 'Recycled PET is repurposed into polyester fibers, backpacks, and food-grade packaging.'
  },
  {
    id: 'item-05',
    name: 'Glass Bottles & Jars',
    category: 'Dry / Recyclable',
    categoryId: 'dry',
    binColor: 'Blue Bin',
    specialHandling: true,
    method: 'Rinse clean, keep intact, dispose in glass designated section.',
    instructions: 'Do not break glass bottles. Broken glass poses injury risk to waste workers and sorting crews.',
    precautions: 'Window panes, mirrors, and heat-resistant Pyrex glass have different melting temperatures and are NOT recyclable with bottles.',
    tips: 'Glass is 100% recyclable indefinitely without loss of purity or quality.'
  },
  {
    id: 'item-06',
    name: 'Metal & Aluminum Cans',
    category: 'Dry / Recyclable',
    categoryId: 'dry',
    binColor: 'Blue Bin',
    specialHandling: false,
    method: 'Rinse clean and flatten beverage cans.',
    instructions: 'Tin food cans should have lids tucked inside. Aluminum beverage cans should be crushed.',
    precautions: 'Avoid sharp exposed edges that could cut collectors.',
    tips: 'Recycling aluminum consumes 95% less energy than mining and smelting virgin bauxite ore.'
  },
  {
    id: 'item-07',
    name: 'Dry Cell & Lithium Batteries',
    category: 'Domestic Hazardous',
    categoryId: 'hazardous',
    binColor: 'Red Hazard Receptacle / Battery Drop-box',
    specialHandling: true,
    method: 'Store in dry container; tape terminals of lithium batteries with masking tape.',
    instructions: 'Take to municipal battery drop-off kiosks, hardware store drop-points, or hand over during specialized hazardous waste drives.',
    precautions: 'NEVER discard batteries in wet or dry bins. Crushed batteries cause severe compactor truck fires and leach heavy metals (cadmium, lead, lithium) into groundwater.',
    tips: 'Specialized metallurgical facilities extract cobalt, nickel, and lithium for manufacturing new cells.'
  },
  {
    id: 'item-08',
    name: 'Expired Medicines & Blister Packs',
    category: 'Domestic Hazardous',
    categoryId: 'hazardous',
    binColor: 'Red Hazard Receptacle / Pharmacy Takeback',
    specialHandling: true,
    method: 'Hand over to authorized pharmacy drug return programs or hazardous waste centers.',
    instructions: 'Keep in original blister foil. Never flush down toilet or sink, which contaminates municipal water tables and aquatic life.',
    precautions: 'Keep out of reach of children and animals until collection.',
    tips: 'High-temperature medical incineration ensures active pharmaceutical chemicals are destroyed without toxic release.'
  },
  {
    id: 'item-09',
    name: 'Diapers & Sanitary Napkins',
    category: 'Sanitary Waste',
    categoryId: 'sanitary',
    binColor: 'Yellow / Marked Wrap',
    specialHandling: true,
    method: 'Wrap securely in newspaper, mark with a red cross (X) or red sticker.',
    instructions: 'Never flush down the toilet. Ensure wrapping is secure to prevent odor and pathogen exposure for sanitary sanitation workers.',
    precautions: 'Contains bio-hazardous pathogens. Must be transferred to municipal biomedical incinerator.',
    tips: 'Consider biodegradable or reusable cloth menstrual cups and modern cloth diapers for zero-waste living.'
  },
  {
    id: 'item-10',
    name: 'Old Smartphones, Laptops & Cables',
    category: 'Electronic Waste (E-Waste)',
    categoryId: 'ewaste',
    binColor: 'Orange / E-Waste Bin',
    specialHandling: true,
    method: 'Remove personal data, deposit at certified e-waste recovery centers.',
    instructions: 'Keep appliances whole. Store cords wrapped neatly. Do not dismantle batteries or CRTs at home.',
    precautions: 'Contains hazardous lead solder, mercury vapor, and flame retardants.',
    tips: 'Urban mining of 1 million mobile phones yields approximately 35,000 lbs of copper, 772 lbs of silver, and 75 lbs of gold!'
  },
  {
    id: 'item-11',
    name: 'Garden Prunings, Twigs & Leaves',
    category: 'Wet / Biodegradable',
    categoryId: 'wet',
    binColor: 'Green Bin',
    specialHandling: false,
    method: 'Shred large branches, collect dry leaves for carbon brown compost layer.',
    instructions: 'Bundle large tree branches under 3 feet for municipal yard waste collection.',
    precautions: 'Ensure no plastic plant tags, wire ties, or pesticide bottles are mixed in.',
    tips: 'Dry leaves make perfect mulch for city gardens, retaining moisture and suppressing weeds naturally.'
  },
  {
    id: 'item-12',
    name: 'Used Cooking Oil',
    category: 'Domestic Hazardous',
    categoryId: 'hazardous',
    binColor: 'Red Hazard Receptacle / Biodiesel Drop-off',
    specialHandling: true,
    method: 'Allow to cool completely, filter food bits, pour into a sealed plastic jug or tin.',
    instructions: 'NEVER pour hot or cold oil down the sink drain. It solidifies into "fatbergs" that block city sewer systems and costs millions to unblock.',
    precautions: 'Store in cool place away from open flames.',
    tips: 'Collected used cooking oil is refined by certified processors into clean-burning commercial biodiesel (B100).'
  },
  {
    id: 'item-13',
    name: 'Aerosol Spray Cans (Deodorants, Spray Paint)',
    category: 'Domestic Hazardous',
    categoryId: 'hazardous',
    binColor: 'Red Hazard Receptacle',
    specialHandling: true,
    method: 'Discharge all remaining gas outdoors safely, do not puncture or burn.',
    instructions: 'If completely empty, can go into metal recycling in some municipalities; otherwise, treat as domestic hazardous.',
    precautions: 'Pressurized propellant can explode in standard waste compactor trucks.',
    tips: 'Check the bottom of the can for propellant symbols.'
  },
  {
    id: 'item-14',
    name: 'Broken Ceramic Mugs & Plates',
    category: 'Reject / Non-Recyclable',
    categoryId: 'reject',
    binColor: 'Black / Gray',
    specialHandling: true,
    method: 'Wrap in thick paper or cardboard, label "Broken Ceramics", place in reject bin.',
    instructions: 'Ceramic melts at much higher temperatures than glass and cannot be recycled with container glass.',
    precautions: 'Wrap sharp shards to avoid slicing waste handling bags and injuring workers.',
    tips: 'Can be crushed and used as drainage gravel in garden flowerpots.'
  },
  {
    id: 'item-15',
    name: 'Milk & Juice Tetra Paks',
    category: 'Dry / Recyclable',
    categoryId: 'dry',
    binColor: 'Blue Bin',
    specialHandling: false,
    method: 'Rinse thoroughly, flatten completely, replace cap.',
    instructions: 'Multi-layer composite cartons require specialized hydrapulping mills that separate paper pulp from polyethylene and aluminum foil.',
    precautions: 'Rinsing is critical to prevent bacterial mold during storage.',
    tips: 'Recovered paper pulp is converted into high-grade stationery and packaging paperboard.'
  },
  {
    id: 'item-16',
    name: 'Fluorescent Tubes & CFL Bulbs',
    category: 'Domestic Hazardous',
    categoryId: 'hazardous',
    binColor: 'Red Hazard Receptacle / E-Waste Bin',
    specialHandling: true,
    method: 'Wrap in bubble wrap or cardboard sleeve, deliver to toxic drop depot.',
    instructions: 'Keep bulb intact. If broken, ventilate the room for 15 minutes before cleaning up with cardboard (do not vacuum).',
    precautions: 'Contains toxic mercury vapor. A single broken CFL bulb can contaminate 6,000 liters of drinking water beyond safety limits.',
    tips: 'Upgrade to modern LED bulbs which contain zero mercury and consume 80% less power.'
  },
  {
    id: 'item-17',
    name: 'Pizza Delivery Boxes (Greasy)',
    category: 'Reject / Non-Recyclable',
    categoryId: 'reject',
    binColor: 'Black / Gray (or Wet if composting allowed)',
    specialHandling: false,
    method: 'Tear off clean top lid for paper recycling; discard oil-soaked bottom into reject/compost.',
    instructions: 'Oil and cheese residue cannot be washed out during the paper recycling process and ruins entire batches of pulp.',
    precautions: 'Do not bundle greasy cardboard with clean office paper.',
    tips: 'Many urban vermicomposting facilities accept unbleached corrugated cardboard torn into small strips.'
  },
  {
    id: 'item-18',
    name: 'Tea Bags & Coffee Grounds',
    category: 'Wet / Biodegradable',
    categoryId: 'wet',
    binColor: 'Green Bin',
    specialHandling: false,
    method: 'Directly add to kitchen wet bin or garden composter.',
    instructions: 'Check if tea bags have plastic mesh or staples. If so, cut open and compost only the tea leaves.',
    precautions: 'Discard nylon silky pyramid tea bags into reject waste.',
    tips: 'Coffee grounds are rich in nitrogen, potassium, and magnesium, making them extraordinary fertilizer for rose bushes and acid-loving plants.'
  }
];

export const QUIZ_QUESTIONS = [
  {
    id: 1,
    question: 'Where should empty, rinsed plastic water and soda bottles (PET) be disposed?',
    options: [
      'Green Bin (Wet / Biodegradable)',
      'Blue Bin (Dry / Recyclables)',
      'Black Bin (Reject / Non-Recyclable)',
      'Red Bin (Domestic Hazardous)'
    ],
    correctIndex: 1,
    explanation: 'Clean plastic bottles are high-value recyclables. Rinse them, crush flat to save space, and place them in the Blue Bin.'
  },
  {
    id: 2,
    question: 'How should used lithium-ion batteries from a toy or remote control be handled?',
    options: [
      'Throw into the green compost bin with organic peelings',
      'Crush them with a hammer and put in the dry waste bin',
      'Tape terminals and hand over to a hazardous waste / battery drop-off kiosk',
      'Flush down the toilet'
    ],
    correctIndex: 2,
    explanation: 'Batteries contain toxic heavy metals and cause dangerous fires when crushed in garbage compactor trucks. Always tape the terminals and deposit at battery collection points.'
  },
  {
    id: 3,
    question: 'What is the correct protocol for disposing of sanitary napkins or baby diapers?',
    options: [
      'Throw loose into the blue recycling bin',
      'Wrap securely in newspaper, mark with a red cross (X), and place in sanitary disposal',
      'Bury in your home garden compost bed',
      'Burn in an open backyard fire'
    ],
    correctIndex: 1,
    explanation: 'Sanitary waste contains infectious pathogens. Wrapping securely and marking with a red cross protects waste sanitation workers from health hazards.'
  },
  {
    id: 4,
    question: 'What should you do with a pizza delivery box that has grease and melted cheese on the bottom?',
    options: [
      'Throw the entire greasy box into clean paper recycling',
      'Tear off the clean lid for recycling; dispose the greasy bottom in reject or composting',
      'Wash the cardboard with liquid soap and dry on clothesline',
      'Toss into the storm drain'
    ],
    correctIndex: 1,
    explanation: 'Grease and oil cannot be removed during the paper recycling process and ruins entire batches of paper pulp. Always separate clean cardboard from food-stained sections.'
  },
  {
    id: 5,
    question: 'Why should expired prescription medicines NEVER be flushed down the toilet or sink?',
    options: [
      'It creates pleasant smells in sewer pipes',
      'Pharmaceutical chemicals bypass standard sewage treatment and contaminate drinking water & fish',
      'It makes pipes clog with plastic',
      'There is no problem with doing this'
    ],
    correctIndex: 1,
    explanation: 'Sewage treatment plants cannot neutralize complex antibiotic and hormone chemicals. They leach into rivers and groundwater, creating antibiotic-resistant superbugs and poisoning aquatic life.'
  },
  {
    id: 6,
    question: 'Where do leftover vegetable peels, eggshells, and fruit rinds belong?',
    options: [
      'Blue Bin (Dry Waste)',
      'Green Bin (Wet / Biodegradable Waste)',
      'Red Bin (Hazardous)',
      'Orange Bin (E-Waste)'
    ],
    correctIndex: 1,
    explanation: 'All kitchen organic scraps belong in the Green Bin. They are converted into nutrient-rich compost or biogas rather than generating harmful methane in landfills.'
  },
  {
    id: 7,
    question: 'What should you do with leftover used cooking oil after frying?',
    options: [
      'Pour down the kitchen sink with hot water',
      'Pour into the garden soil near trees',
      'Cool, strain into a sealed container, and take to a biodiesel / hazardous waste center',
      'Pour directly into street gutters'
    ],
    correctIndex: 2,
    explanation: 'Pouring oil down drains creates massive "fatbergs" that choke city sewer infrastructure. Collected used oil can be recycled into eco-friendly biodiesel fuel!'
  },
  {
    id: 8,
    question: 'Can broken window glass or mirrors be recycled together with standard glass drink bottles in the blue bin?',
    options: [
      'Yes, all glass is completely identical',
      'No, window and mirror glass have different chemical formulations and melting temperatures',
      'Only if painted green',
      'Only on weekends'
    ],
    correctIndex: 1,
    explanation: 'Window glass, mirrors, and Pyrex contain additives that alter their melting point. Mixing them with container glass ruins the recycled glass furnace batch. Broken mirrors should be wrapped and treated as reject waste.'
  }
];
