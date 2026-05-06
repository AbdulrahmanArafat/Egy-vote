function slugify(value) {
    return String(value || "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 80) || `item-${Date.now()}`;
}

function parseBoolean(value) {
    return value === true || value === "true" || value === "on" || value === "1";
}

function normalizeArray(value) {
    if (Array.isArray(value)) {
        return value.filter(Boolean);
    }

    if (typeof value === "string" && value.trim()) {
        return value.split(",").map((item) => item.trim()).filter(Boolean);
    }

    return [];
}

function toDate(value, fallback = null) {
    if (!value) {
        return fallback;
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? fallback : date;
}

function getPagination(query, defaultLimit = 10) {
    const page = Math.max(1, parseInt(query.page || "1", 10) || 1);
    const limit = Math.max(1, Math.min(50, parseInt(query.limit || String(defaultLimit), 10) || defaultLimit));
    const skip = (page - 1) * limit;

    return { page, limit, skip };
}

function buildPagination(page, limit, totalItems) {
    const totalPages = Math.max(1, Math.ceil(totalItems / limit));

    return {
        page,
        limit,
        totalItems,
        totalPages,
        hasPrevious: page > 1,
        hasNext: page < totalPages,
        previousPage: page > 1 ? page - 1 : null,
        nextPage: page < totalPages ? page + 1 : null
    };
}

function formatDate(value, locale = "en-GB") {
    if (!value) {
        return "N/A";
    }

    return new Intl.DateTimeFormat(locale, {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
    }).format(new Date(value));
}

function formatPercent(value) {
    const numericValue = Number(value || 0);
    return `${numericValue.toFixed(1)}%`;
}

function ensureArrayOfObjectIds(values) {
    return normalizeArray(values).map((value) => String(value));
}

module.exports = {
    slugify,
    parseBoolean,
    normalizeArray,
    toDate,
    getPagination,
    buildPagination,
    formatDate,
    formatPercent,
    ensureArrayOfObjectIds
};
