import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import {
  ChefHat,
  Search,
  Scale,
  Plus,
  X,
  AlertCircle,
  CheckCircle2,
  Clock,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Zap,
  Sliders
} from 'lucide-react';
import { useData } from '../context/DataContext';

export const RecipesPage: React.FC = () => {
  const { recipes, ingredients, forecastData, fetchAllData } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Modal State for Inspecting a Particular Recipe
  const [inspectedRecipe, setInspectedRecipe] = useState<any>(null);
  const [simulatedPlates, setSimulatedPlates] = useState<number>(100);

  // Modal State for Adding New Dish & Recipe
  const [showAddModal, setShowAddModal] = useState(false);
  const [dishName, setDishName] = useState('');
  const [category, setCategory] = useState('Rice Bowl');
  const [cuisine, setCuisine] = useState('Indian');
  const [basePrice, setBasePrice] = useState<number>(290);
  const [prepTime, setPrepTime] = useState<number>(20);
  const [forecastOrders, setForecastOrders] = useState<number>(120);

  // Dynamic ingredient rows: [{ ingredient_id, quantity, unit }]
  const [recipeIngredients, setRecipeIngredients] = useState<Array<{ ingredient_id: string; quantity: number; unit: string }>>([
    { ingredient_id: 'ING-CHK', quantity: 0.18, unit: 'kg' },
    { ingredient_id: 'ING-ONION', quantity: 0.06, unit: 'kg' },
    { ingredient_id: 'ING-OIL', quantity: 0.02, unit: 'L' },
  ]);

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Comprehensive culinary lookup table ensuring every single dish has a dedicated, appetizing photo
  const MEAL_IMAGE_MAP: Record<number, string> = {
    // Thai Beverages & Extras
    1885: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=600&auto=format&fit=crop&q=80', // Thai Sweet Iced Milk Tea
    1993: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&auto=format&fit=crop&q=80', // Lemongrass Herbal Cooler
    2539: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&auto=format&fit=crop&q=80', // Thai Coconut Palm Shake
    1311: 'https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?w=600&auto=format&fit=crop&q=80', // Crispy Spring Roll Dippers
    1803: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600&auto=format&fit=crop&q=80', // Sweet Chilli Dip & Wafers
    1198: 'https://images.unsplash.com/photo-1559847844-5315695dadae?w=600&auto=format&fit=crop&q=80', // Golden Sesame Prawn Crackers

    // Indian Beverages
    1248: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80', // Royal Saffron Masala Chai
    2631: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80', // Thick Mango Kesar Lassi
    2139: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=600&auto=format&fit=crop&q=80', // Spiced Buttermilk (Chaas)

    // Italian Beverages & Salads
    1062: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80', // Classic Italian Espresso Roast
    1778: 'https://images.unsplash.com/photo-1485808191679-5f86510681a2?w=600&auto=format&fit=crop&q=80', // Iced Caramel Macchiato
    2707: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&auto=format&fit=crop&q=80', // Sparkling Lemon Basil Soda
    2490: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=600&auto=format&fit=crop&q=80', // Caesar Salad with Parmesan
    2664: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80', // Mediterranean Greek Olive Salad
    2569: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80', // Caprese Salad with Basil Pesto

    // Continental Beverages
    1230: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=600&auto=format&fit=crop&q=80', // Cold Pressed Valencia Orange Juice
    1207: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=600&auto=format&fit=crop&q=80', // Berry Blast Greek Yogurt Smoothie
    2322: 'https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?w=600&auto=format&fit=crop&q=80', // Dark Belgian Hot Chocolate

    // Soups & Snacks
    1847: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600&auto=format&fit=crop&q=80', // Spicy Thai Tom Yum Soup
    1438: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600&auto=format&fit=crop&q=80', // Creamy Coconut Chicken Galangal Soup
    2494: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600&auto=format&fit=crop&q=80', // Clear Sweet Corn & Vegetable Soup
    2760: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=600&auto=format&fit=crop&q=80', // Crispy Fried Vegetable Wantons
    1525: 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=600&auto=format&fit=crop&q=80', // Steamed Chicken Dimsums
    2704: 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=600&auto=format&fit=crop&q=80', // Corn Cheese Cocktail Bites

    // Indian Rice Bowls & Biryanis
    1109: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600&auto=format&fit=crop&q=80', // Paneer Butter Masala Rice Bowl
    2290: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&auto=format&fit=crop&q=80', // Dal Makhani & Jeera Rice Bowl
    1727: 'https://images.unsplash.com/photo-1545247181-516773cae754?w=600&auto=format&fit=crop&q=80', // Tender Mutton Rogan Josh Rice Bowl
    1902: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80', // Hyderabadi Chicken Dum Biryani
    1247: 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=600&auto=format&fit=crop&q=80', // Royal Lucknowi Paneer Biryani
    1770: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=600&auto=format&fit=crop&q=80', // Kolkata Egg & Potato Dum Biryani

    // Starters & Sandwiches
    1878: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&auto=format&fit=crop&q=80', // Peri Peri Chicken Skewers
    2640: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=600&auto=format&fit=crop&q=80', // Crispy Paneer Popcorn
    2577: 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=600&auto=format&fit=crop&q=80', // Grilled Chicken Satay with Peanut Dip
    1754: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600&auto=format&fit=crop&q=80', // Italian Grilled Pesto Chicken Sandwich
    1971: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=600&auto=format&fit=crop&q=80', // Toasted Tomato Mozzarella Panini
    2826: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=600&auto=format&fit=crop&q=80', // Double Cheese Smoked Veggie Club

    // Italian Pastas & Pizzas
    2306: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=600&auto=format&fit=crop&q=80', // Creamy Alfredo Penne with Mushrooms
    1216: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=600&auto=format&fit=crop&q=80', // Fiery Chicken Penne Arrabbiata
    2126: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80', // Classic Tuscan Beef Bolognese Pasta
    1558: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80', // Farmhouse Margherita Pizza
    2581: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&auto=format&fit=crop&q=80', // Barbecue Chicken & Onion Pizza
    1962: 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=600&auto=format&fit=crop&q=80', // Gourmet Pepperoni & Mozzarella Pizza

    // Indian Desserts
    2492: 'https://images.unsplash.com/photo-1541832676-9b763b0239ab?w=600&auto=format&fit=crop&q=80', // Warm Gulab Jamun with Rabdi
    2304: 'https://images.unsplash.com/photo-1541832676-9b763b0239ab?w=600&auto=format&fit=crop&q=80', // Kesar Pista Shahi Phirni
    1543: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80', // Bengali Rasgulla in Cardamom Syrup

    // Continental Fish & Seafood
    1571: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600&auto=format&fit=crop&q=80', // Herb Butter Grilled Salmon Fillet
    2956: 'https://images.unsplash.com/photo-1579208575657-c595a05383b7?w=600&auto=format&fit=crop&q=80', // Crispy Golden Fish & Chips
    2104: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=600&auto=format&fit=crop&q=80', // Pan-Seared Lemon Garlic Tilapia
    2444: 'https://images.unsplash.com/photo-1559847844-5315695dadae?w=600&auto=format&fit=crop&q=80', // Butter Garlic King Prawns
    2867: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=600&auto=format&fit=crop&q=80', // Crumbed Fried Calamari Rings
    1445: 'https://images.unsplash.com/photo-1534939561126-855b8675edd7?w=600&auto=format&fit=crop&q=80'  // Coastal Seafood Fisherman Stew
  };

  // Safe fallback resolver that always guarantees a rich gourmet photo matched to dish name
  const getDishImage = (mealId: number, mealName: string, category: string, cuisine: string) => {
    if (mealId && MEAL_IMAGE_MAP[mealId]) {
      return MEAL_IMAGE_MAP[mealId];
    }
    const name = (mealName || '').toLowerCase();
    const cat = (category || '').toLowerCase();
    const cuis = (cuisine || '').toLowerCase();

    if (name.includes('biryani')) return 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80';
    if (name.includes('paneer') || name.includes('palak')) return 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600&auto=format&fit=crop&q=80';
    if (name.includes('chicken') || name.includes('curry')) return 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=600&auto=format&fit=crop&q=80';
    if (name.includes('mutton') || name.includes('rogan')) return 'https://images.unsplash.com/photo-1545247181-516773cae754?w=600&auto=format&fit=crop&q=80';
    if (name.includes('pizza') || cat.includes('pizza')) return 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80';
    if (name.includes('pasta') || cat.includes('pasta')) return 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=600&auto=format&fit=crop&q=80';
    if (name.includes('sandwich') || cat.includes('sandwich')) return 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600&auto=format&fit=crop&q=80';
    if (name.includes('soup') || cat.includes('soup')) return 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600&auto=format&fit=crop&q=80';
    if (name.includes('salad') || cat.includes('salad')) return 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&auto=format&fit=crop&q=80';
    if (name.includes('fish') || name.includes('prawn') || cat.includes('fish') || cat.includes('seafood')) return 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600&auto=format&fit=crop&q=80';
    if (cuis.includes('thai')) return 'https://images.unsplash.com/photo-1559847844-5315695dadae?w=600&auto=format&fit=crop&q=80';
    
    // Guaranteed fallback delicious food bowl
    return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80';
  };

  const categories = ['ALL', ...Array.from(new Set(recipes.map((r: any) => r.category)))];

  const filteredRecipes = recipes.filter((r: any) => {
    const matchesSearch = r.meal_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          r.cuisine.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'ALL' || r.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  // Map forecast predictions by meal_id
  const forecastMap: Record<number, number> = {};
  (forecastData?.forecasts || []).forEach((f: any) => {
    forecastMap[f.meal_id] = f.predicted_orders || 0;
  });

  const handleOpenInspect = (r: any, defaultOrders: number) => {
    setInspectedRecipe({ ...r, predictedOrders: defaultOrders });
    setSimulatedPlates(defaultOrders);
  };

  const handleAddIngredientRow = () => {
    const defaultIng = ingredients[0] || { ingredient_id: 'ING-ONION', base_unit: 'kg' };
    setRecipeIngredients([
      ...recipeIngredients,
      { ingredient_id: defaultIng.ingredient_id, quantity: 0.1, unit: defaultIng.base_unit || 'kg' }
    ]);
  };

  const handleRemoveIngredientRow = (index: number) => {
    if (recipeIngredients.length <= 1) return;
    setRecipeIngredients(recipeIngredients.filter((_, idx) => idx !== index));
  };

  const handleIngredientChange = (index: number, ingId: string) => {
    const matched = ingredients.find((i: any) => i.ingredient_id === ingId);
    const updated = [...recipeIngredients];
    updated[index].ingredient_id = ingId;
    if (matched) {
      updated[index].unit = matched.base_unit;
    }
    setRecipeIngredients(updated);
  };

  const handleQuantityChange = (index: number, qty: number) => {
    const updated = [...recipeIngredients];
    updated[index].quantity = qty;
    setRecipeIngredients(updated);
  };

  const handleSubmitNewRecipe = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(null);

    try {
      const payload = {
        dish_name: dishName,
        category: category,
        cuisine: cuisine,
        base_price: Number(basePrice),
        prep_time_mins: Number(prepTime),
        initial_forecast_orders: Number(forecastOrders),
        ingredients: recipeIngredients.map((item) => ({
          ingredient_id: item.ingredient_id,
          quantity_per_serving: Number(item.quantity),
          unit: item.unit
        }))
      };

      const res = await axios.post('/api/recipes', payload);
      setSaveSuccess(res.data.message || `Dish "${dishName}" created successfully!`);
      await fetchAllData();

      setTimeout(() => {
        setDishName('');
        setShowAddModal(false);
        setSaveSuccess(null);
      }, 1400);
    } catch (err: any) {
      console.error('Error creating recipe:', err);
      setSaveError(err.response?.data?.detail || 'Failed to create recipe. Please check details.');
    } finally {
      setSaving(false);
    }
  };

  // Find other dishes that share the same key ingredients as inspectedRecipe
  const getAffectedDishes = () => {
    if (!inspectedRecipe) return [];
    const recipeIngIds = new Set(inspectedRecipe.ingredients?.map((i: any) => i.ingredient_id) || []);
    const affected: Array<{ meal_name: string; shared_ingredient: string; category: string }> = [];

    recipes.forEach((other: any) => {
      if (other.meal_id === inspectedRecipe.meal_id) return;
      other.ingredients?.forEach((ing: any) => {
        if (recipeIngIds.has(ing.ingredient_id)) {
          if (!affected.some((a) => a.meal_name === other.meal_name && a.shared_ingredient === ing.ingredient_name)) {
            affected.push({
              meal_name: other.meal_name,
              shared_ingredient: ing.ingredient_name,
              category: other.category
            });
          }
        }
      });
    });

    return affected.slice(0, 6); // Top 6 affected dishes
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <ChefHat className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">Dishes & Kitchen Recipes</h2>
                <span className="text-[11px] text-slate-500 font-normal">
                  Inspect ingredient portions, test cooking batch scale, and analyze cross-dish stock impact.
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200 text-slate-700">
              {recipes.length} Active Dishes
            </span>
            <button
              onClick={() => {
                setSaveError(null);
                setSaveSuccess(null);
                setShowAddModal(true);
              }}
              className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Recipe</span>
            </button>
          </div>
        </div>

        {/* Search & Category Filter */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by dish name, ID, or cuisine (e.g. Biryani, Pasta, Indian, Italian)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {categories.map((cat: any) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Recipe Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filteredRecipes.map((r: any) => {
          const predictedOrders = Math.round(forecastMap[r.meal_id] || 120);
          const dishImg = getDishImage(r.meal_id, r.meal_name, r.category, r.cuisine);
          return (
            <div
              key={r.meal_id}
              className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col justify-between shadow-xs hover:border-blue-400 hover:shadow-md transition group"
            >
              <div>
                {/* Culinary Dish Image Banner */}
                <div className="relative h-44 w-full overflow-hidden bg-slate-100">
                  <img
                    src={dishImg}
                    alt={r.meal_name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                  
                  {/* Category & Cuisine Badges on top of Image */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white border border-white/20">
                      {r.cuisine}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-600/90 backdrop-blur-md text-white">
                      {r.category}
                    </span>
                  </div>

                  {/* ID Tag top right */}
                  <div className="absolute top-2.5 right-2.5">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-slate-200 font-bold border border-white/20">
                      #{r.meal_id}
                    </span>
                  </div>

                  {/* Bottom Image Overlay: Dish Title */}
                  <div className="absolute bottom-2.5 left-3 right-3">
                    <h3 className="font-bold text-sm text-white leading-snug drop-shadow-sm group-hover:text-blue-200 transition">
                      {r.meal_name}
                    </h3>
                  </div>
                </div>

                <div className="p-4">
                  {/* Card Metrics Summary */}
                  <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {r.ingredients?.length || 0} Ingredients in BOM
                    </span>
                    <div className="text-right">
                      <span className="text-xs font-bold font-mono text-slate-900">
                        ₹{r.cost_per_serving}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium ml-1">/ plate cost</span>
                    </div>
                  </div>

                  {/* Demand Forecast Highlight */}
                  <div className="mt-2.5 p-2 bg-blue-50/60 rounded-lg border border-blue-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-blue-900 font-medium text-[11px]">
                      <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                      <span>7-Days Forecast:</span>
                    </div>
                    <span className="font-bold font-mono text-blue-950 text-xs">
                      {predictedOrders} plates
                    </span>
                  </div>

                  {/* Ingredients List */}
                  <div className="mt-3 space-y-1.5">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide block">
                      Per-Plate Serving Portions
                    </span>
                    <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                      {r.ingredients?.map((ing: any, i: number) => (
                        <div
                          key={i}
                          className="flex items-center justify-between text-xs py-1 px-2.5 rounded bg-slate-50 border border-slate-150"
                        >
                          <span className="text-slate-800 font-medium truncate max-w-[170px] text-[11.5px]">
                            {ing.ingredient_name}
                          </span>
                          <span className="font-mono text-slate-900 font-bold text-[11px]">
                            {ing.quantity_per_serving} {ing.unit}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Footer with Inspect Action Button */}
              <div className="p-4 pt-0">
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                    <Scale className="w-3.5 h-3.5 text-slate-400" />
                    Yield Factored
                  </span>
                  <button
                    onClick={() => handleOpenInspect(r, predictedOrders)}
                    className="px-3 py-1.5 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white rounded-lg text-[11px] font-bold transition flex items-center space-x-1 cursor-pointer border border-blue-200 hover:border-blue-600"
                  >
                    <span>Impact & Stock Test</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* INSPECT & CROSS-DISH STRESS TEST MODAL */}
      {inspectedRecipe && createPortal(
        <div 
          className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setInspectedRecipe(null)}
        >
          <div 
            className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full my-auto max-h-[94vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="border-b border-slate-100 flex flex-col bg-slate-50/80">
              {/* Optional Hero Dish Image inside Modal */}
              <div className="relative h-32 w-full overflow-hidden bg-slate-200">
                <img
                  src={getDishImage(inspectedRecipe.meal_id, inspectedRecipe.meal_name, inspectedRecipe.category, inspectedRecipe.cuisine)}
                  alt={inspectedRecipe.meal_name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-black/20" />
                <button
                  onClick={() => setInspectedRecipe(null)}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 text-white hover:bg-black/80 flex items-center justify-center cursor-pointer backdrop-blur-sm transition"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="absolute bottom-3 left-6 right-6 flex items-end justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-white text-lg drop-shadow-sm">{inspectedRecipe.meal_name}</h3>
                      <span className="px-2 py-0.5 rounded-full bg-blue-500 text-white text-[10px] font-bold uppercase shadow-xs">
                        {inspectedRecipe.cuisine} • {inspectedRecipe.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-200 mt-0.5">
                      Cooking volume simulation: Adjust batch size to inspect store deficits and cross-menu impact.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
              {/* INTERACTIVE BATCH SLIDER */}
              <div className="p-4 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 rounded-2xl border border-blue-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-blue-600" />
                    <span className="font-bold text-slate-900 text-xs">Simulate Cooking Batch Volume</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-slate-500">Preparing:</span>
                    <span className="px-3 py-1 rounded-xl bg-blue-600 text-white font-mono font-bold text-sm shadow-xs">
                      {simulatedPlates} Plates
                    </span>
                  </div>
                </div>

                <input
                  type="range"
                  min="50"
                  max="1000"
                  step="25"
                  value={simulatedPlates}
                  onChange={(e) => setSimulatedPlates(Number(e.target.value))}
                  className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />

                <div className="flex justify-between text-[10.5px] text-slate-500 font-mono">
                  <span>50 plates (Tasting)</span>
                  <span className="text-blue-700 font-semibold">{inspectedRecipe.predictedOrders} (AI Baseline Forecast)</span>
                  <span>1,000 plates (Mega Banquet)</span>
                </div>
              </div>

              {/* THREE CORE OPERATIONAL METRICS */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Raw Ingredients Cost</span>
                  <span className="text-xl font-bold font-mono text-slate-900 mt-0.5 block">
                    ₹{(simulatedPlates * (inspectedRecipe.cost_per_serving || 65)).toLocaleString()}
                  </span>
                  <span className="text-[10.5px] text-slate-500 mt-0.5 block">
                    ₹{inspectedRecipe.cost_per_serving} per serving
                  </span>
                </div>

                <div className="p-3.5 bg-emerald-50/70 border border-emerald-100 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-emerald-700 block">Revenue Potential</span>
                  <span className="text-xl font-bold font-mono text-emerald-950 mt-0.5 block">
                    ₹{(simulatedPlates * (inspectedRecipe.base_price || 280)).toLocaleString()}
                  </span>
                  <span className="text-[10.5px] text-emerald-700/80 mt-0.5 block">
                    Gross Margin: ~{Math.round(((inspectedRecipe.base_price - inspectedRecipe.cost_per_serving) / inspectedRecipe.base_price) * 100)}%
                  </span>
                </div>

                <div className="p-3.5 bg-purple-50/70 border border-purple-100 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-purple-700 block">Kitchen Prep Load</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Clock className="w-4 h-4 text-purple-600" />
                    <span className="text-xl font-bold font-mono text-purple-950">
                      {((simulatedPlates * (inspectedRecipe.prep_time_mins || 20)) / 60).toFixed(1)} hrs
                    </span>
                  </div>
                  <span className="text-[10.5px] text-purple-700/80 mt-0.5 block">
                    {simulatedPlates > 400 ? '⚠️ High staff load' : '✅ Standard prep capacity'}
                  </span>
                </div>
              </div>

              {/* INGREDIENT REQUIREMENTS & SHORTAGE TABLE */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <div className="bg-[#F8FAFC] px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs">
                    Raw Stock Needed for {simulatedPlates} Plates vs Kitchen Store Stock
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">Auto-Trim Factored</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-white text-slate-500 font-bold uppercase text-[10px]">
                        <th className="py-2.5 px-4">Ingredient</th>
                        <th className="py-2.5 px-3 text-right">Portion/Plate</th>
                        <th className="py-2.5 px-3 text-right">Total Mass Needed</th>
                        <th className="py-2.5 px-3 text-right">In Store Stock</th>
                        <th className="py-2.5 px-4 text-center">Kitchen Sufficiency</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {inspectedRecipe.ingredients?.map((ing: any, idx: number) => {
                        const matchedMaster = ingredients.find((i: any) => i.ingredient_id === ing.ingredient_id);
                        const curStock = matchedMaster?.current_stock || 0;
                        const totalNeeded = Number(((ing.quantity_per_serving || 0) * simulatedPlates).toFixed(2));
                        const isShortage = curStock < totalNeeded;
                        const deficit = (totalNeeded - curStock).toFixed(1);

                        return (
                          <tr key={idx} className="hover:bg-slate-50/60">
                            <td className="py-3 px-4">
                              <span className="font-bold text-slate-900 block">{ing.ingredient_name}</span>
                              <span className="text-[10px] text-slate-400 font-mono">{ing.ingredient_id}</span>
                            </td>
                            <td className="py-3 px-3 text-right font-mono text-slate-600">
                              {ing.quantity_per_serving} {ing.unit}
                            </td>
                            <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                              {totalNeeded} {ing.unit}
                            </td>
                            <td className="py-3 px-3 text-right font-mono text-slate-700">
                              {curStock} {ing.unit}
                            </td>
                            <td className="py-3 px-4 text-center">
                              {isShortage ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                  <AlertTriangle className="w-3 h-3" />
                                  Deficit (-{deficit} {ing.unit})
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Stock Sufficient
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* CROSS-DISH RIPPLE IMPACT (WHICH OTHER DISHES WILL SUFFER?) */}
              <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2.5">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="font-bold text-amber-950 text-xs">
                    Cross-Menu Ripple Effect: Other Dishes Affected by this Volume
                  </span>
                </div>
                <p className="text-[11px] text-amber-900 leading-relaxed">
                  Preparing <strong>{simulatedPlates} plates</strong> of <em>{inspectedRecipe.meal_name}</em> consumes store ingredients shared across the kitchen. The following menu dishes may experience stock shortages if inventory is depleted:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {getAffectedDishes().map((aff, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-white/90 border border-amber-200/80 text-xs">
                      <div>
                        <span className="font-bold text-slate-800 block text-[11.5px]">{aff.meal_name}</span>
                        <span className="text-[10px] text-slate-400">{aff.category}</span>
                      </div>
                      <span className="text-[10.5px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
                        Competes for {aff.shared_ingredient}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 border-t border-slate-100 flex items-center justify-between bg-slate-50/60">
              <span className="text-[11px] text-slate-500">
                Calculations refresh in real-time as slider moves.
              </span>
              <button
                onClick={() => setInspectedRecipe(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer transition shadow-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ADD NEW RECIPE MODAL */}
      {showAddModal && createPortal(
        <div 
          className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setShowAddModal(false)}
        >
          <div 
            className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full my-auto max-h-[92vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                  <ChefHat className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Add New Dish & Kitchen Recipe</h3>
                  <p className="text-[11px] text-slate-500">
                    Define ingredients per serving. Inventory stock & weekly orders calculate automatically.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmitNewRecipe} className="flex-1 overflow-y-auto p-6 space-y-5">
              {saveSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-semibold">{saveSuccess}</span>
                </div>
              )}

              {saveError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{saveError}</span>
                </div>
              )}

              {/* Dish Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Dish Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chettinad Pepper Chicken, Paneer Butter Masala, Garlic Butter Prawns..."
                  value={dishName}
                  onChange={(e) => setDishName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-medium"
                />
              </div>

              {/* Category, Cuisine, Price Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Cuisine</label>
                  <select
                    value={cuisine}
                    onChange={(e) => setCuisine(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  >
                    <option value="Indian">Indian</option>
                    <option value="Italian">Italian</option>
                    <option value="Continental">Continental</option>
                    <option value="Thai">Thai</option>
                    <option value="Asian">Asian</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  >
                    <option value="Rice Bowl">Rice Bowl / Biryani</option>
                    <option value="Biryani">Biryani</option>
                    <option value="Starters">Starters & Snacks</option>
                    <option value="Pasta">Pasta & Noodles</option>
                    <option value="Pizza">Pizza & Breads</option>
                    <option value="Soup">Soup & Salads</option>
                    <option value="Beverages">Beverages</option>
                    <option value="Desert">Dessert</option>
                    <option value="Fish">Fish & Seafood</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Selling Price (₹)</label>
                  <div className="relative">
                    <DollarSign className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                    <input
                      type="number"
                      min="10"
                      step="5"
                      value={basePrice}
                      onChange={(e) => setBasePrice(Number(e.target.value))}
                      className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Prep Time & Forecast Demand */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kitchen Prep Time (Mins)</label>
                  <div className="relative">
                    <Clock className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                    <input
                      type="number"
                      min="5"
                      max="180"
                      value={prepTime}
                      onChange={(e) => setPrepTime(Number(e.target.value))}
                      className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Expected Weekly Orders</label>
                  <input
                    type="number"
                    min="10"
                    step="10"
                    value={forecastOrders}
                    onChange={(e) => setForecastOrders(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-mono"
                  />
                </div>
              </div>

              {/* INGREDIENTS LIST BUILDER */}
              <div className="border-t border-slate-200/80 pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Required Ingredients (Per Plate)</span>
                    <span className="text-[10.5px] text-slate-500">Add all raw items used to prepare 1 serving of this dish.</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddIngredientRow}
                    className="flex items-center space-x-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold cursor-pointer transition border border-blue-200"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Ingredient</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {recipeIngredients.map((row, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2.5 bg-slate-50/80 rounded-xl border border-slate-200">
                      <div className="flex-1">
                        <select
                          value={row.ingredient_id}
                          onChange={(e) => handleIngredientChange(idx, e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-medium"
                        >
                          {ingredients.map((ing: any) => (
                            <option key={ing.ingredient_id} value={ing.ingredient_id}>
                              {ing.ingredient_name} ({ing.category} • {ing.base_unit})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="w-28 flex items-center space-x-1">
                        <input
                          type="number"
                          step="0.005"
                          min="0.001"
                          required
                          value={row.quantity}
                          onChange={(e) => handleQuantityChange(idx, Number(e.target.value))}
                          className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 font-mono text-right focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                        <span className="text-xs text-slate-500 font-semibold w-7">{row.unit}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveIngredientRow(idx)}
                        disabled={recipeIngredients.length <= 1}
                        className="w-7 h-7 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition disabled:opacity-30 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition cursor-pointer disabled:opacity-50 flex items-center space-x-2"
                >
                  {saving ? (
                    <span>Calculating Stock & Saving...</span>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Save Recipe & Check Stock</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
