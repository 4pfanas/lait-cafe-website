// Lait Cafe menu, Al Jimi, Al Ain. Names and prices (AED) as listed on Talabat, Nov 2026.
// Descriptions are short rewrites for the concept. `k` = keywords for search and "Ask Lait".
export type Tag = 'V' | 'sig' | 'hot' | 'cold' | 'share';
export type Item = { id: string; name: string; desc?: string; price: number; tags?: Tag[]; k?: string };
export type Section = { id: string; title: string; items: Item[] };
export type Chapter = { id: string; title: string; note: string; sections: Section[] };

const i = (id: string, name: string, price: number, desc?: string, tags?: Tag[], k?: string): Item => ({ id, name, price, desc, tags, k });

export const chapters: Chapter[] = [
  {
    id: 'coffee',
    title: 'Coffee',
    note: 'Specialty beans, pulled and poured all day.',
    sections: [
      {
        id: 'classic-hot',
        title: 'Classic hot coffee',
        items: [
          i('espresso', 'Espresso', 21, 'A double shot, bold and rich.', ['hot'], 'strong short coffee caffeine'),
          i('hot-americano', 'Hot Americano', 24, 'Espresso lengthened with hot water.', ['hot'], 'black coffee strong'),
          i('piccolo', 'Piccolo', 25, 'Ristretto with a little warm milk.', ['hot'], 'short milk coffee'),
          i('cortado', 'Cortado', 25, 'Espresso cut with an equal pour of milk.', ['hot'], 'short milk coffee'),
          i('hot-latte', 'Hot Latte', 27, 'Espresso and silky steamed milk.', ['hot'], 'milk coffee creamy'),
          i('cappuccino', 'Cappuccino', 27, 'Espresso, steamed milk and a deep foam cap.', ['hot'], 'milk coffee foam'),
          i('flat-white', 'Flat White', 27, 'Double shot with velvety micro-foam.', ['hot'], 'milk coffee strong'),
        ],
      },
      {
        id: 'flavored',
        title: 'Flavoured coffee',
        items: [
          i('hot-lait-latte', 'Hot Lait Latte', 30, 'Our house latte, creamy and medium-sweet.', ['hot', 'sig'], 'signature house sweet creamy milk coffee'),
          i('hot-white-mocha', 'Hot White Mocha', 30, 'Espresso with white chocolate and steamed milk.', ['hot'], 'sweet chocolate creamy coffee'),
          i('hot-spanish-latte', 'Hot Spanish Latte', 30, 'Espresso with sweetened condensed milk.', ['hot'], 'sweet creamy coffee'),
          i('hot-pistachio-latte', 'Hot Pistachio Latte', 33, 'A warm latte with pistachio cream.', ['hot'], 'pistachio nutty sweet coffee'),
          i('hot-chocolate', 'Hot Chocolate', 25, 'Rich cocoa, steamed milk.', ['hot', 'V'], 'chocolate sweet no coffee kids'),
          i('spanish-cortado', 'Spanish Cortado', 30, 'A short, sweet cortado with condensed milk.', ['hot'], 'short sweet coffee'),
          i('hot-matcha-latte', 'Hot Matcha Latte', 31, 'Premium-grade matcha and steamed milk.', ['hot', 'V'], 'matcha green tea no coffee'),
        ],
      },
      {
        id: 'iced',
        title: 'Iced coffee',
        items: [
          i('cold-americano', 'Cold Americano', 25, 'Espresso over ice and cold water.', ['cold'], 'iced black coffee refreshing'),
          i('cold-latte', 'Cold Latte', 29, 'Espresso, cold milk, ice.', ['cold'], 'iced milk coffee'),
          i('cold-white-mocha', 'Cold White Mocha', 32, 'Iced coffee with white chocolate.', ['cold'], 'iced sweet chocolate coffee'),
          i('cold-spanish-latte', 'Cold Spanish Latte', 32, 'Espresso, sweet milk, poured over ice.', ['cold'], 'iced sweet creamy coffee'),
          i('cold-lait-latte', 'Cold Lait Latte', 32, 'The house latte, blended with ice and medium-sweet milk.', ['cold', 'sig'], 'signature house iced sweet creamy coffee'),
          i('affogato', 'Affogato', 35, 'A shot of espresso over vanilla ice cream.', ['cold'], 'ice cream dessert coffee'),
          i('shaken-affogato', 'Shaken Affogato', 38, 'Espresso, milk and ice cream, shaken.', ['cold'], 'ice cream creamy coffee'),
          i('pistachio-latte-cold', 'Pistachio Latte (Cold)', 35, 'Iced latte with pistachio cream.', ['cold', 'sig'], 'pistachio nutty iced sweet coffee'),
          i('iced-matcha-latte', 'Iced Matcha Latte', 35, 'Matcha over ice and milk.', ['cold', 'V'], 'matcha green tea iced no coffee'),
          i('cloudy-matcha', 'Cloudy Matcha', 38, 'Creamy matcha floating on coconut water.', ['cold', 'V', 'sig'], 'matcha coconut light refreshing no coffee'),
          i('velvet-cloud', 'Velvet Cloud', 26, 'A short, sweet iced coffee dusted with chocolate.', ['cold'], 'short sweet chocolate iced coffee'),
          i('ocean-latte', 'Ocean Latte', 43, 'An iced latte with a blue, ocean-inspired twist.', ['cold'], 'iced special colourful coffee'),
          i('creamy-espresso', 'Creamy Espresso', 30, 'Espresso shaken with cream and ice.', ['cold'], 'iced strong creamy coffee'),
          i('dirty-espresso', 'Dirty Espresso', 30, 'An intense iced shot over cold milk.', ['cold'], 'iced strong coffee'),
        ],
      },
      {
        id: 'brewed',
        title: 'Brewed by hand',
        items: [
          i('chemex', 'Chemex', 33, 'Pour-over for a clean, bright cup.', ['hot'], 'filter pour over black coffee specialty'),
          i('v60', 'V60', 33, 'Hand-poured, aromatic and light.', ['hot', 'sig'], 'filter pour over black coffee specialty'),
          i('cold-brew', 'Cold Brew', 33, 'Steeped slowly in cold water, smooth and low in acid.', ['cold'], 'iced black coffee smooth strong'),
        ],
      },
      {
        id: 'beans',
        title: 'Coffee beans · 250 g',
        items: [
          i('brazil-250', 'Brazil', 80, 'Roasted hazelnut, dark chocolate, cacao nibs.', [], 'beans take home gift chocolate nutty'),
          i('ethiopia-250', 'Ethiopia', 90, 'Sugar cane, orange, plum, a hint of florals.', [], 'beans take home gift fruity floral'),
        ],
      },
      {
        id: 'gathering',
        title: 'For gatherings',
        items: [
          i('hot-coffee-flask', 'Hot Coffee Flask', 135, 'Hot coffee for the whole table.', ['hot', 'share'], 'share group family friends office flask'),
          i('ice-coffee-bottle', 'Ice Coffee Bottle', 125, 'Iced coffee in a sharing bottle.', ['cold', 'share'], 'share group family friends office iced'),
        ],
      },
    ],
  },
  {
    id: 'cold-drinks',
    title: 'Cold drinks',
    note: 'Iced teas, mojitos, shakes and juice.',
    sections: [
      {
        id: 'iced-tea',
        title: 'Iced tea & mojito',
        items: [
          i('strawberry-mojito', 'Strawberry Mojito', 35, 'Fresh strawberries, mint, lime and soda.', ['cold', 'V'], 'fruity refreshing mint no coffee'),
          i('hibiscus-iced-tea', 'Hibiscus Iced Tea', 35, 'Dried hibiscus steeped and poured over ice.', ['cold', 'V'], 'tea floral refreshing no coffee'),
          i('peach-iced-tea', 'Peach Iced Tea', 35, 'Black tea with ripe peach.', ['cold', 'V'], 'tea fruity refreshing no coffee'),
          i('passion-iced-tea', 'Passion Fruit Iced Tea', 35, 'Iced tea with tropical passion fruit.', ['cold', 'V'], 'tea fruity tropical refreshing no coffee'),
          i('passion-mojito', 'Passion Fruit Mojito', 35, 'Passion fruit, lime, mint and soda.', ['cold', 'V'], 'fruity tropical mint refreshing no coffee'),
          i('classic-mojito', 'Classic Mojito', 35, 'Lime, mint and soda.', ['cold', 'V'], 'mint lime refreshing no coffee'),
        ],
      },
      {
        id: 'shakes',
        title: 'Milkshakes & smoothies',
        items: [
          i('frappuccino', 'Frappuccino', 36, 'Coffee, milk and ice, topped with cream.', ['cold'], 'blended iced sweet creamy coffee'),
          i('pistachio-milkshake', 'Pistachio Milkshake', 43, 'Sweet milk blended with crushed pistachio.', ['cold', 'V'], 'pistachio nutty sweet creamy shake'),
          i('caramel-milkshake', 'Caramel Milkshake', 33, 'Velvety caramel shake.', ['cold', 'V'], 'caramel sweet creamy shake kids'),
          i('oreo-milkshake', 'Oreo Milkshake', 33, 'Vanilla ice cream, milk and crushed Oreo.', ['cold', 'V'], 'oreo chocolate sweet shake kids'),
          i('matcha-lait-frappe', 'Matcha Lait Frappe', 43, 'Blended matcha crowned with vanilla ice cream.', ['cold', 'V', 'sig'], 'matcha ice cream sweet green'),
          i('acai-smoothie', 'Açaí Smoothie', 43, 'A cold, berry-dark açaí blend.', ['cold', 'V'], 'acai berry fruity healthy light'),
        ],
      },
      {
        id: 'juices',
        title: 'Juice & water',
        items: [
          i('orange-juice', 'Fresh Orange Juice', 25, 'Squeezed to order.', ['cold', 'V'], 'fresh fruit juice healthy breakfast'),
          i('mineral-water', 'Mineral Water', 9, undefined, ['cold', 'V'], 'water'),
          i('sparkling-water', 'Sparkling Water', 14, undefined, ['cold', 'V'], 'water sparkling'),
          i('coca-cola', 'Coca-Cola', 9, undefined, ['cold', 'V'], 'soft drink soda'),
          i('sprite', 'Sprite', 9, undefined, ['cold', 'V'], 'soft drink soda'),
        ],
      },
    ],
  },
  {
    id: 'kitchen',
    title: 'Kitchen',
    note: 'Sandwiches, croissants and plates, all day.',
    sections: [
      {
        id: 'croissants',
        title: 'Croissants',
        items: [
          i('butter-croissant', 'Butter Croissant', 19, 'Flaky, buttery, baked fresh.', ['V'], 'breakfast pastry light classic'),
          i('cheese-croissant', 'Cheese Croissant', 21, 'Butter layers with melted cheese.', ['V'], 'breakfast pastry cheese'),
          i('zaatar-croissant', 'Zaatar Croissant', 21, 'Filled with zaatar and olive oil.', ['V'], 'breakfast pastry herbs local'),
          i('three-cheese-croissant', 'Three Cheese Croissant', 33, 'Three cheeses, one golden croissant.', ['V'], 'breakfast pastry cheese hearty'),
        ],
      },
      {
        id: 'sandwiches',
        title: 'All-day sandwiches',
        items: [
          i('halloumi-avocado-pretzel', 'Halloumi Avocado Pretzel', 39, 'Warm pretzel bread with halloumi and avocado.', ['V'], 'breakfast halloumi avocado cheese'),
          i('halloumi-pretzel', 'Halloumi Pretzel', 39, 'Pretzel bread and grilled halloumi.', ['V'], 'breakfast halloumi cheese'),
          i('grilled-chicken-sandwich', 'Grilled Chicken Sandwich', 50, 'Grilled chicken on sourdough with baby rocket and house sauce.', [], 'chicken lunch hearty'),
          i('avocado-mushroom-toast', 'Avocado & Mushroom Toast', 50, 'Avocado on artisan toast, sautéed mushrooms, feta and herbs.', ['V'], 'breakfast avocado mushroom healthy'),
          i('avo-feta-toast', 'Avo Feta Toast', 47, 'Avocado toast with crumbled feta.', ['V'], 'breakfast avocado healthy light'),
          i('mushroom-labneh-toast', 'Mushroom Labneh Toast', 43, 'Labneh and mushrooms on toast.', ['V'], 'breakfast mushroom labneh light'),
          i('caesar-wrap', 'Caesar Wrap', 50, 'Crisp lettuce, Caesar dressing and parmesan in a soft wrap.', [], 'chicken lunch wrap'),
          i('buffalo-chicken-wrap', 'Buffalo Chicken Wrap', 59, 'Spicy buffalo chicken in a soft tortilla.', [], 'chicken spicy lunch wrap'),
          i('greek-quesadilla', 'Greek Quesadilla', 51, 'Greek flavours folded into a crisp quesadilla.', ['V'], 'cheese lunch'),
          i('crispy-chicken-quesadilla', 'Crispy Chicken Quesadilla', 55, 'Golden quesadilla with crispy seasoned chicken.', [], 'chicken crispy cheese lunch hearty'),
          i('grilled-cheese-tomato', 'Grilled Cheese & Tomato', 47, 'Sourdough, melted cheese, tomato.', ['V'], 'cheese comfort classic'),
          i('avo-sundried-tomato', 'Avo Sun-dried Tomato Sandwich', 43, 'Avocado and sun-dried tomato.', ['V'], 'avocado light healthy'),
          i('mozzarella-basil', 'Mozzarella Basil Sandwich', 50, 'Mozzarella and basil, chips on the side.', ['V'], 'cheese fresh light'),
        ],
      },
      {
        id: 'appetizers',
        title: 'Appetizers',
        items: [
          i('french-fries', 'French Fries', 25, 'Golden, crisp and seasoned.', ['V', 'share'], 'fries crispy salty share snack'),
          i('mozzarella-sticks', 'Mozzarella Sticks', 40, 'Fried mozzarella with a tomato-herb dip.', ['V', 'share'], 'cheese crispy share snack'),
          i('dynamite-fries', 'Dynamite Fries', 51, 'Fries with spicy sauce and crispy onion.', ['V', 'share'], 'fries spicy crispy share'),
          i('mexican-fries', 'Mexican Fries', 45, 'Fries tossed in zesty Mexican spice.', ['V', 'share'], 'fries spicy crispy share'),
          i('batata-harra', 'Batata Harra', 45, 'Spicy potatoes with garlic and fresh herbs.', ['V', 'share'], 'potato spicy local share'),
          i('buffalo-chicken-bites', 'Buffalo Chicken Bites', 40, 'Seven chicken bites in house buffalo sauce.', ['share'], 'chicken spicy crispy share'),
          i('crispy-chicken-tender', 'Crispy Chicken Tenders', 55, 'Golden tenders with a crunchy coat.', ['share'], 'chicken crispy kids share'),
          i('ny-loaded-fries', 'New York Loaded Fries', 62, 'Fries loaded with melted cheese and toppings.', ['share'], 'fries cheese hearty share'),
        ],
      },
      {
        id: 'pasta',
        title: 'Pasta & sliders',
        items: [
          i('pink-spicy-pasta', 'Pink Spicy Pasta', 65, 'Penne in a pink spicy sauce with sautéed mushrooms and garlic bread.', ['sig'], 'pasta spicy creamy signature hearty dinner'),
          i('white-alfredo', 'White Alfredo Pasta', 65, 'Penne, white sauce and mushrooms.', ['V'], 'pasta creamy mushroom dinner'),
          i('pasta-selection', 'Pasta of the Day', 50, 'Ask the team for today’s pasta.', [], 'pasta dinner'),
          i('mushroom-risotto', 'Mushroom Risotto', 57, 'Arborio rice slow-cooked with fresh mushrooms.', ['V'], 'rice creamy mushroom dinner'),
          i('lasagna', 'Lasagna', 80, 'Layers of pasta, rich sauce and cheese.', [], 'pasta beef cheese hearty dinner'),
          i('crispy-chicken-slider', 'Crispy Chicken Slider Meal', 65, 'Crispy chicken on soft mini buns.', [], 'chicken burger crispy hearty'),
          i('spicy-crispy-slider', 'Spicy Crispy Chicken Slider Meal', 70, 'Crispy chicken sliders with a bold spicy kick.', [], 'chicken burger spicy crispy hearty'),
          i('buffalo-slider', 'Buffalo Chicken Slider Meal', 70, 'Chicken sliders in buffalo sauce.', [], 'chicken burger spicy hearty'),
        ],
      },
      {
        id: 'salads',
        title: 'Salads',
        items: [
          i('caesar-salad', 'Caesar Salad', 60, 'Lettuce, green apple, grilled chicken and Caesar dressing.', [], 'salad chicken healthy light'),
          i('rocca-corn-salad', 'Rocca Corn Salad', 60, 'Peppery rocket with sweet corn.', ['V'], 'salad healthy light fresh'),
          i('strawberry-feta-salad', 'Strawberry Feta Salad', 55, 'Fresh greens, sweet strawberries and feta.', ['V'], 'salad fruity healthy light fresh'),
        ],
      },
    ],
  },
  {
    id: 'sweets',
    title: 'Sweets',
    note: 'Where your sweetest cravings belong.',
    sections: [
      {
        id: 'desserts',
        title: 'Desserts',
        items: [
          i('um-ali', 'Um Ali', 42, 'The warm Egyptian classic, baked with milk and nuts.', ['V', 'sig'], 'warm traditional local sweet milk'),
          i('cheesecake', 'Cheesecake', 40, 'Rich and creamy on a buttery crust.', ['V', 'sig'], 'creamy sweet classic'),
          i('tiramisu', 'Tiramisu', 45, 'Espresso-soaked layers and mascarpone.', ['V'], 'coffee creamy sweet'),
          i('chocolate-cake', 'Chocolate Cake (Slice)', 35, 'A rich, dark chocolate slice.', ['V'], 'chocolate sweet cake'),
          i('london-cake', 'London Cake', 55, 'Sponge layered with rich chocolate.', ['V'], 'chocolate sweet cake share'),
          i('oreo-truffles', 'Oreo Truffles', 32, 'Four chocolate truffles made with Oreo.', ['V'], 'chocolate sweet bites'),
          i('french-toast', 'French Toast', 60, 'Thick bread soaked in custard and pan-golden.', ['V'], 'breakfast sweet warm'),
          i('fluffy-pancake', 'Fluffy Pancake', 56, 'Light, warm and served with maple syrup.', ['V'], 'breakfast sweet warm kids'),
        ],
      },
      {
        id: 'acai',
        title: 'Açaí',
        items: [
          i('acai-bowl', 'Açaí Bowl', 46, 'With three toppings of your choice.', ['V'], 'acai healthy fruity light cold'),
          i('super-acai', 'Super Açaí', 60, 'Granola, banana, strawberry and blueberry.', ['V'], 'acai healthy fruity berry cold'),
        ],
      },
    ],
  },
];

export type FlatItem = Item & { section: string; chapter: string };
export const allItems = (): FlatItem[] =>
  chapters.flatMap((c) => c.sections.flatMap((s) => s.items.map((it) => ({ ...it, section: s.id, chapter: c.id }))));
