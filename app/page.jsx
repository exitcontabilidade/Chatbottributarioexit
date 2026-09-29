import { redirect } from 'next/navigation';
import ChatApp from '@/components/chat/ChatApp';
import { getTopics } from '@/lib/server/faq';
import { getSession } from '@/lib/server/session';
import { getSettings } from '@/lib/server/settings';
import { grupoInfo, temaInfo, topicInfo } from '@/lib/topics';

// Os temas vão junto com a página: "Explorar temas" abre na hora, sem esperar outra chamada ao servidor.
// Cada assunto leva o seu tema e o seu grupo já com nome, ícone e cor.
async function loadTopics() {
  try {
    const { topics, meta } = await getTopics(getSettings().perguntasPath);
    return topics.map((topic) => {
      const tema = temaInfo(topic.tema, meta.temas);
      const grupo = grupoInfo(tema.grupo, meta.grupos);
      return { ...topic, ...topicInfo(topic.key, meta.modulos), tema, grupo };
    });
  } catch (err) {
    console.error('Falha ao ler os temas:', err);
    return [];
  }
}

export default async function Page() {
  const user = await getSession();
  if (!user) redirect('/login');
  return <ChatApp user={user} topics={await loadTopics()} />;
}
