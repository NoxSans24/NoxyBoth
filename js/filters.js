// Filter definitions with Canvas pixel manipulation / CSS filters
const FILTERS = [
    { id: 'normal', name: 'Original', filterStr: 'none' },
    { id: 'grayscale', name: 'B & W', filterStr: 'grayscale(100%)' },
    { id: 'sepia', name: 'Sepia', filterStr: 'sepia(80%)' },
    { id: 'vintage', name: 'Vintage', filterStr: 'sepia(50%) contrast(120%) brightness(90%)' },
    { id: 'warm', name: 'Warm Sunset', filterStr: 'sepia(30%) saturate(140%) hue-rotate(-10deg)' },
    { id: 'cool', name: 'Cyber Cool', filterStr: 'saturate(130%) hue-rotate(180deg) brightness(95%)' }
];

function applyFilterToContext(ctx, filterId) {
    const filter = FILTERS.find(f => f.id === filterId);
    if (filter) {
        ctx.filter = filter.filterStr;
    } else {
        ctx.filter = 'none';
    }
}
