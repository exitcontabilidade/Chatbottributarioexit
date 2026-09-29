// Escolhe quem gera a resposta do bot, conforme CHATBOT_RESPOSTA.
//
// Todo "responder" tem o mesmo método:
//   async reply({ conversationId, message, history }) -> { reply, sources, suggestions }
// A IA vai ser mais um (montagem do prompt + chamada ao modelo). Assim dá para
// trocar de modelo sem mexer nas rotas nem na tela.

import 'server-only';
import { FaqResponder } from './faq';
import { MockResponder } from './mock';
import { getSettings } from './settings';

let current = null;

export function getResponder() {
  const settings = getSettings();
  const key = `${settings.resposta}|${settings.perguntasPath}`;
  if (current?.key !== key) {
    const responder =
      settings.resposta === 'faq' ? new FaqResponder(settings.perguntasPath) : new MockResponder();
    current = { key, responder };
  }
  return current.responder;
}
