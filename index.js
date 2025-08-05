import express from 'express';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();
const app = express();
app.use(express.json());

const mySecret = process.env['GEMINI']


const genAI = new GoogleGenerativeAI(mySecret);

app.get('/', (req, res) => {
  res.json({ status: 'API Qisa está funcionando!' });
});

app.post('/responder', async (req, res) => {
  console.log('🔥 POST /responder chamado');
  console.log('📝 Corpo recebido:', req.body);

  const { loja, produtos, pergunta } = req.body;

  if (!loja || !pergunta || !Array.isArray(produtos)) {
    return res.status(400).json({ error: 'Loja, produtos e pergunta são obrigatórios.' });
  }

  const {
    nome,
    cnpj,
    categoria,
    descricao,
    endereco,
    bairro,
    cidade,
    estado,
    cep,
    pontoReferencia,
    googleMaps,
    diasFuncionamento,
    horarioAbertura,
    horarioFechamento,
    fechaFeriados,
    observacoes,
    telefone,
    email,
    redesSociais,
    site,
    tiposAtendimento,
    metodosPagamento
  } = loja;

  const listaProdutos = produtos.length
    ? produtos.map(p => `- ${p.nome}: R$ ${p.preco.toFixed(2).replace('.', ',')}`).join('\n')
    : 'Nenhum produto informado.';

  const systemInstruction = `
Você é Qisa, assistente virtual da loja "${nome}".

📌 Informações da loja:
- CNPJ: ${cnpj || 'Não informado'}
- Categoria: ${categoria}
- Descrição: ${descricao}

📍 Localização:
- Endereço: ${endereco}, ${bairro || 'Bairro não informado'}, ${cidade} - ${estado}, CEP: ${cep || 'Não informado'}
- Ponto de referência: ${pontoReferencia || 'Não informado'}
- Google Maps: ${googleMaps || 'Não informado'}

⏰ Funcionamento:
- Dias: ${diasFuncionamento}
- Horário: ${horarioAbertura} às ${horarioFechamento}
- Fecha em feriados: ${fechaFeriados ? 'Sim' : 'Não'}
- Observações: ${observacoes || 'Nenhuma'}

📞 Contato:
- Telefone/WhatsApp: ${telefone}
- E-mail: ${email || 'Não informado'}
- Redes sociais: ${redesSociais || 'Não informado'}
- Site: ${site || 'Não informado'}

📦 Produtos disponíveis:
${listaProdutos}

💳 Serviços e Pagamento:
- Tipos de atendimento: ${tiposAtendimento.join(', ')}
- Métodos de pagamento: ${metodosPagamento.join(', ')}

⚠️ IMPORTANTE:
Você deve responder apenas perguntas relacionadas à loja acima, seus produtos, serviços, funcionamento ou localização.

Se a pergunta **não** for sobre a loja ou seus serviços, **responda com:**
"Desculpe, só posso responder sobre a loja e seus serviços."

Seja simpática, objetiva e profissional nas respostas.
`;

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const chat = model.startChat({
      generationConfig: { temperature: 0.7 },
      history: [
        {
          role: "user",
          parts: [{ text: systemInstruction + "\n(⚠️ Esta é uma instrução interna, não responda a ela.)" }]
        },
        {
          role: "user",
          parts: [{ text: pergunta }]
        }
      ]

    });

    const result = await chat.sendMessage(pergunta);
    const resposta = await result.response.text();

    res.json({ resposta: resposta.trim() });
  } catch (error) {
    console.error('Erro ao gerar resposta:');
    res.status(500).json({ error: 'Erro ao gerar resposta da qisa' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 API Qisa rodando em http://localhost:${PORT}`);
});
