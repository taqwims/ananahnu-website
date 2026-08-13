/**
 * Generates a snake_case system key from a field label.
 * If the key already exists in existingKeys, appends a unique random suffix.
 */
export const generateUniqueSystemKey = (label: string, existingKeys: string[] = []): string => {
    let base = label
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s_]/g, '')  // remove non-alphanumeric except space and underscore
        .replace(/\s+/g, '_');         // replace spaces with underscores

    if (!base) {
        base = 'field';
    }

    const lowerKeys = existingKeys.map(k => k.toLowerCase());

    if (!lowerKeys.includes(base)) {
        return base;
    }

    let uniqueKey = base;
    let attempts = 0;
    while (lowerKeys.includes(uniqueKey) && attempts < 100) {
        const randomSuffix = Math.random().toString(36).substring(2, 6);
        uniqueKey = `${base}_${randomSuffix}`;
        attempts++;
    }

    return uniqueKey;
};
