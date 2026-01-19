# 🚀 Configuração das APIs Gratuitas para Teste

Este guia mostra como configurar todas as APIs gratuitas para testar o Documenta.

## 📋 APIs Disponíveis

### 1. **OpenAI (GPT-3.5) - RECOMENDADO**
- ✅ **$18 gratuitos** para novos usuários
- ✅ **Melhor qualidade** de resumos médicos
- ✅ **Contexto brasileiro** avançado

**Como obter:**
1. Acesse [https://platform.openai.com](https://platform.openai.com)
2. Crie uma conta gratuita
3. Vá em "API Keys" → "Create new secret key"
4. Copie a chave

### 2. **Google Cloud Speech-to-Text**
- ✅ **60 minutos gratuitos** por mês
- ✅ **Excelente** reconhecimento de português brasileiro
- ✅ **Modelo médico** disponível

**Como obter:**
1. Acesse [https://console.cloud.google.com](https://console.cloud.google.com)
2. Crie um projeto gratuito
3. Ative a API "Cloud Speech-to-Text"
4. Vá em "APIs & Services" → "Credentials" → "Create Credentials" → "API key"

### 3. **Hugging Face**
- ✅ **Completamente gratuito** e ilimitado
- ✅ **Modelos locais** disponíveis
- ✅ **Open source**

**Como obter:**
1. Acesse [https://huggingface.co](https://huggingface.co)
2. Crie uma conta gratuita
3. Vá em "Settings" → "Access Tokens" → "New token"
4. Copie o token (tipo "Read")

## ⚙️ Configuração

### Passo 1: Criar arquivo de configuração

Crie um arquivo `.env` na raiz do projeto com suas chaves:

```env
# OpenAI (recomendado para resumos)
VITE_OPENAI_API_KEY=sk-your-openai-key-here

# Google Speech (recomendado para transcrição)
VITE_GOOGLE_SPEECH_KEY=your-google-api-key-here

# Hugging Face (fallback gratuito)
VITE_HUGGINGFACE_API_KEY=hf_your-huggingface-token-here

# Usar modelos locais (mais lento, mas offline)
VITE_USE_LOCAL_MODELS=false
```

### Passo 2: Instalar dependências

```bash
npm install
```

### Passo 3: Executar o projeto

```bash
npm run dev
```

## 🧪 Como Testar

1. **Abra o aplicativo** no navegador
2. **Permita o microfone** quando solicitado
3. **Clique no botão de microfone** 🎤
4. **Fale uma consulta médica** em português
5. **Clique em "Parar Gravação"**
6. **Veja o resumo automático** aparecer
7. **Clique em "Ver Transcrição Completa"** para detalhes

## 📊 Ordem de Fallback

O sistema usa esta prioridade para máxima confiabilidade:

1. **Web Speech API** (gratuito, offline, sempre disponível)
2. **OpenAI GPT-3.5** ($18 gratuitos - melhor para resumos)
3. **Google Speech** (60 min/mês - melhor para transcrição)
4. **Hugging Face** (ilimitado - fallback)

## 💡 Dicas de Teste

- **Teste primeiro sem APIs**: Apenas Web Speech funciona
- **Adicione OpenAI**: Melhora drasticamente os resumos
- **Adicione Google**: Melhor reconhecimento médico
- **Fallback automático**: Se uma API falhar, outra assume

## 🔒 Segurança

- As chaves ficam apenas no seu navegador
- Nada é enviado para nossos servidores
- Dados médicos ficam locais no seu dispositivo
- LGPD compliant

## ❓ Problemas Comuns

**"Web Speech não funciona"**
- Verifique se o navegador suporta (Chrome/Edge recomendados)
- Permita acesso ao microfone

**"APIs não funcionam"**
- Verifique se as chaves estão corretas no `.env`
- Confirme se há saldo/créditos disponíveis

**"Resumo não aparece"**
- Verifique console do navegador (F12)
- Certifique-se de que há texto suficiente na transcrição

## 📞 Suporte

Para dúvidas sobre configuração das APIs, consulte:
- [OpenAI Docs](https://platform.openai.com/docs)
- [Google Cloud Docs](https://cloud.google.com/speech-to-text)
- [Hugging Face Docs](https://huggingface.co/docs)