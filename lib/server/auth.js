// Conferência de usuário e senha.
//
// Por enquanto é só DEMONSTRAÇÃO: um usuário fixo aqui no código do servidor.
// Na fase 1 isto vira uma consulta à tabela de usuários (Infra/Esquema do Banco),
// com a senha guardada em hash, e limite de tentativas de login.

import 'server-only';
import { createHash, timingSafeEqual } from 'node:crypto';

const DEMO_USERS = [{ id: 'admin', username: 'Admin', password: '123', name: 'Administrador', role: 'admin' }];

// Compara sem vazar pelo tempo de resposta quantos caracteres batem.
function sameText(a, b) {
  const hash = (text) => createHash('sha256').update(text).digest();
  return timingSafeEqual(hash(a), hash(b));
}

/** Devolve { id, name, role } se usuário e senha conferem; senão, null. */
export async function checkCredentials(username, password) {
  const user = DEMO_USERS.find((u) => u.username.toLowerCase() === username.toLowerCase());
  if (!user || !sameText(password, user.password)) return null;
  return { id: user.id, name: user.name, role: user.role };
}
