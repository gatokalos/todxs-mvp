export function resolveUserId(user) {
  if (!user) return null;
  if (typeof user === "string") return user;
  if (user.id) return user.id;
  if (user.user?.id) return user.user.id;
  if (user.anon_id) return user.anon_id;
  if (user.anonId) return user.anonId;
  if (user.uuid) return user.uuid;
  if (user.client_id) return user.client_id;
  return null;
}

export function resolveOwnerId(entry = {}) {
  return (
    entry.usuario_id ||
    entry.user_id ||
    entry.owner_id ||
    entry.autor_id ||
    entry.autorId ||
    entry.anon_id ||
    entry.anonId ||
    null
  );
}

export function isEntryOwnedBy(entry, user) {
  const ownerId = resolveOwnerId(entry);
  const userId = resolveUserId(user);
  return Boolean(ownerId && userId && ownerId === userId);
}

export function isAdminUser(user) {
  if (!user) return false;
  const role =
    user.client_role ||
    user.role ||
    user.app_metadata?.role ||
    (Array.isArray(user.app_metadata?.roles) ? user.app_metadata.roles.find((r) => r === "admin") : null);
  return role === "admin" || role === "superadmin";
}

export function getPersonajeDisplay(personajes = [], slug) {
  if (!slug) return { nombre: "Personaje", avatar: null };
  const match = personajes.find((p) => p.id === slug);
  if (match) return { nombre: match.nombre || slug, avatar: match.avatar || null };
  return { nombre: slug, avatar: null };
}
