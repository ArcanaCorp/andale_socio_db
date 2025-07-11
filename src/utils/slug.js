export const generateSlug = (name) => {
    return name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, "")         // elimina todo excepto letras y números
        .trim();
};