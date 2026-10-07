export const fmt = (val) => {
    const v = Number(val);
    if (isNaN(v)) return '0';
    return v.toFixed(1).replace(/\.0$/, '');
};

export const getMealMacros = (items) => {
    let cal = 0, p = 0, f = 0, c = 0;
    items.forEach(it => {
        const ratio = it.qty / it.food.base_serving;
        cal += it.food.calories * ratio;
        p += it.food.macros.protein * ratio; 
        f += it.food.macros.fat * ratio;
        c += it.food.macros.carbs * ratio;
   });
   return { cal: fmt(cal), p: fmt(p), f: fmt(f), c: fmt(c) };
};