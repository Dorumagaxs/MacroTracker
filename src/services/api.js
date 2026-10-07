export async function fetchFoodByBarcode(barcode) {
    if (!navigator.onLine) return { error: "offline" };
    try {
        const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
        if (!res.ok) return { error: "network_error" };
        const data = await res.json();
        if (data.status === 1 && data.product) {
            const p = data.product;
            const n = p.nutriments || {};
            return {
                data: {
                    name: p.product_name_pt || p.product_name || 'Produto Desconhecido',
                    calories: n['energy-kcal_100g'] || 0,
                    protein: n['proteins_100g'] || 0,
                    fat: n['fat_100g'] || 0,
                    carbs: n['carbohydrates_100g'] || 0
                }
            };
        }
        return { error: "not_found" };
    } catch (err) { return { error: "fetch_failed" }; }
}
