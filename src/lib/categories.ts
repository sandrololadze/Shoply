// src/lib/categories.ts

export interface Category {
  id: string;
  label: string;
  emoji: string;
  color: string;
  surface: string;
  keywords: string[];
}

export const CATEGORIES: Category[] = [
  { id: 'dairy', label: 'Dairy', emoji: '🥛', color: '#3B82F6', surface: '#EFF6FF',
    keywords: ['milk','melk','cheese','kaas','butter','boter','yogurt','yoghurt','cream','room','fromage','lait','beurre'] },
  { id: 'bread', label: 'Bread', emoji: '🍞', color: '#F59E0B', surface: '#FFFBEB',
    keywords: ['bread','brood','toast','baguette','croissant','roll','pistolet','pain','sandwich'] },
  { id: 'meat', label: 'Meat', emoji: '🥩', color: '#EF4444', surface: '#FEF2F2',
    keywords: ['meat','vlees','chicken','kip','beef','rund','pork','varken','steak','ham','sausage','worst','poulet','viande'] },
  { id: 'fish', label: 'Fish', emoji: '🐟', color: '#06B6D4', surface: '#ECFEFF',
    keywords: ['fish','vis','salmon','zalm','tuna','tonijn','shrimp','garnaal','cod','kabeljauw','poisson','saumon'] },
  { id: 'vegetables', label: 'Vegetables', emoji: '🥦', color: '#10B981', surface: '#ECFDF5',
    keywords: ['vegetable','groente','carrot','wortel','tomato','tomaat','onion','ui','pepper','paprika','broccoli','spinach','spinazie','légume'] },
  { id: 'fruit', label: 'Fruit', emoji: '🍎', color: '#F97316', surface: '#FFF7ED',
    keywords: ['fruit','apple','appel','banana','banaan','orange','sinaasappel','grape','druif','strawberry','aardbei','lemon','citroen','fraise'] },
  { id: 'drinks', label: 'Drinks', emoji: '🥤', color: '#8B5CF6', surface: '#F5F3FF',
    keywords: ['drink','drank','water','juice','sap','cola','beer','bier','wine','wijn','coffee','koffie','tea','thee','jus','boisson'] },
  { id: 'snacks', label: 'Snacks', emoji: '🍿', color: '#EC4899', surface: '#FDF2F8',
    keywords: ['snack','chips','cookie','koek','chocolate','chocolade','candy','snoep','biscuit','nuts','noten','chocolat'] },
  { id: 'frozen', label: 'Frozen', emoji: '🧊', color: '#67E8F9', surface: '#ECFEFF',
    keywords: ['frozen','diepvries','ice','ijs','icecream','gelato','surgelé'] },
  { id: 'cleaning', label: 'Cleaning', emoji: '🧹', color: '#64748B', surface: '#F8FAFC',
    keywords: ['cleaning','schoonmaak','soap','zeep','detergent','shampoo','toilet','bleach','javel','nettoyant'] },
  { id: 'personal', label: 'Personal Care', emoji: '🧴', color: '#A78BFA', surface: '#F5F3FF',
    keywords: ['shampoo','conditioner','deodorant','toothpaste','tandpasta','razor','scheermesje','lotion','crème'] },
  { id: 'other', label: 'Other', emoji: '🛒', color: '#94A3B8', surface: '#F8FAFC', keywords: [] },
];

export function detectCategory(name: string): Category {
  const lower = name.toLowerCase();
  for (const cat of CATEGORIES) {
    if (cat.id === 'other') continue;
    if (cat.keywords.some((kw) => lower.includes(kw))) {
      return cat;
    }
  }
  return CATEGORIES[CATEGORIES.length - 1]; // 'other'
}