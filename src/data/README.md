# Sistema de Treinamento da IA Médica - Documenta

Este documento descreve o sistema de treinamento da IA implementado para melhorar a transcrição e compreensão de consultas médicas no Brasil.

## 📋 Visão Geral

O sistema de treinamento da IA foi desenvolvido para auxiliar na transcrição de consultas médicas, fornecendo:

- **Correção automática de nomes de medicamentos**
- **Validação de nomes brasileiros**
- **Expansão de abreviações médicas**
- **Sugestões contextuais para termos médicos**
- **Glossário abrangente de especialidades médicas**

## 🏗️ Estrutura dos Dados

### Arquivos Principais

- `medical_training_data.json` - Dados completos de treinamento
- `trainingUtils.js` - Utilitários para acessar e usar os dados de treinamento

### Estrutura do JSON de Treinamento

```json
{
  "sections": {
    "medications": {
      "categories": {
        "analgesicos": [...],
        "antibiotticos": [...],
        "antihipertensivos": [...],
        "antidiabeticos": [...]
      }
    },
    "brazilian_names": {
      "first_names_masculine": [...],
      "first_names_feminine": [...],
      "surnames": [...],
      "common_variations": {...},
      "regional_names": {...}
    },
    "medical_terms": {
      "specialties": {
        "cardiologia": [...],
        "ortopedia": [...],
        "ginecologia": [...],
        // ... todas as especialidades
      },
      "surgeries": [...],
      "abbreviations": {...},
      "symptoms": [...],
      "diagnostics": [...]
    }
  },
  "context_rules": {...},
  "transcription_rules": {...}
}
```

## 💊 Medicamentos

### Categorias Incluídas

- **Analgésicos**: Paracetamol, Ibuprofeno, Diclofenaco
- **Antibióticos**: Amoxicilina, Azitromicina, Ciprofloxacino
- **Anti-hipertensivos**: Losartana, Enalapril, Amlodipino
- **Antidiabéticos**: Metformina, Gliclazida

### Informações por Medicamento

Cada medicamento contém:
- Nome principal
- Nomes comerciais
- Doses comuns
- Apresentações
- Observações importantes

## 👥 Nomes Brasileiros

### Base de Dados

- **Nomes masculinos**: João, José, Antônio, Francisco, etc.
- **Nomes femininos**: Maria, Ana, Francisca, Adriana, etc.
- **Sobrenomes**: Silva, Santos, Oliveira, Souza, Rodrigues, etc.

### Variações Regionais

- **Nordeste**: Severino, Francisnete, Maria do Carmo
- **Sudeste**: Roberto, Márcia, Roberto Carlos
- **Sul**: João Pedro, Ana Paula
- **Norte**: Antônio José, Maria Aparecida
- **Centro-Oeste**: Márcio, Simone

## 🩺 Termos Médicos

### Especialidades

- Cardiologia (IAM, AVE, HAS, etc.)
- Ortopedia (ATF, ATM, Artroplastia, etc.)
- Ginecologia (TPM, DST, HPV, etc.)
- Pediatria (IRA, DRS, CRM, etc.)
- Dermatologia (Psoríase, Acne, etc.)
- Oftalmologia (DMA, DR, Glaucoma, etc.)
- Otorrinolaringologia (Rinite, Sinusite, etc.)
- Psiquiatria (TAG, TDAH, Depressão, etc.)

### Cirurgias

- Apendicectomia
- Colecistectomia
- Histerectomia
- Cesariana
- Artroplastia de quadril/joelho
- Cirurgia cardíaca (Bypass, Angioplastia)
- Cirurgia bariátrica

### Abreviaturas

- **Médicas comuns**: mg, ml, mcg, VO, IV, IM, etc.
- **Médicas específicas**: FC, FR, PA, ECG, RX, TC, RM, etc.

## 🔧 Como Usar

### 1. Ativação do Treinamento

Na página de transcrição, há um controle na seção de configuração:

```jsx
<div className="flex items-center justify-between p-2 border...">
  <div className="flex flex-col">
    <span>Treinamento da IA</span>
    <span>Melhora ortografia médica e nomes</span>
  </div>
  <button onClick={() => setIsTrainingEnabled(!isTrainingEnabled)}>
    {/* Toggle switch */}
  </button>
</div>
```

### 2. Funcionalidades Ativas

Quando ativado, o sistema:

1. **Corrige automaticamente** nomes de medicamentos digitados incorretamente
2. **Expande abreviações** quando apropriado
3. **Mostra sugestões** de melhorias na sidebar
4. **Valida nomes** brasileiros em tempo real

### 3. Sugestões em Tempo Real

As sugestões aparecem automaticamente na sidebar quando o texto é digitado:

```
Sugestões da IA (3)
medication: paracetamal → Paracetamol
abbreviation: IAM → IAM (Infarto Agudo do Miocárdio)
name: Jão → João
```

## 🚀 API de Utilitários

### Classe MedicalTrainingData

```javascript
import { medicalTrainingData } from './trainingUtils';

// Buscar medicamento
const med = medicalTrainingData.findMedication('paracetamol');

// Validar nome brasileiro
const nameValidation = medicalTrainingData.validateBrazilianName('João');

// Buscar termos por especialidade
const cardioTerms = medicalTrainingData.getMedicalTermsBySpecialty('cardiologia');

// Expandir abreviatura
const expanded = medicalTrainingData.expandAbbreviation('IAM');
```

### Funções de Utilidade

```javascript
import { enhanceTranscription, findMedicalInfo } from './trainingUtils';

// Melhorar transcrição automaticamente
const enhanced = enhanceTranscription('Paciente toma paracetamal 500mg');

// Buscar informações médicas
const info = findMedicalInfo('dor');
```

## 📈 Benefícios

### Para Médicos
- **Redução de erros** de ortografia em nomes de medicamentos
- **Padronização** de termos médicos
- **Agilidade** na transcrição
- **Precisão** em nomes brasileiros

### Para Pacientes
- **Registros mais precisos** das consultas
- **Nomes corretos** nos prontuários
- **Informações claras** sobre medicações

### Para o Sistema
- **Base de conhecimento** médica brasileira
- **IA treinada** especificamente para medicina nacional
- **Contextualização** regional dos dados

## 🔄 Atualização dos Dados

Para atualizar o banco de dados de treinamento:

1. Edite o arquivo `medical_training_data.json`
2. Adicione novos medicamentos, termos ou nomes
3. Teste as mudanças na interface
4. Faça deploy das atualizações

## 📝 Notas Técnicas

- **Formato**: JSON estruturado para fácil manutenção
- **Performance**: Dados carregados uma vez e cacheados
- **Extensibilidade**: Fácil adição de novas especialidades
- **Regional**: Adaptado para português brasileiro
- **Contextual**: Regras específicas para medicina nacional

## 🤝 Contribuição

Para contribuir com o banco de dados:

1. Adicione novos medicamentos com doses e nomes comerciais
2. Inclua termos médicos específicos de especialidades
3. Atualize nomes regionais brasileiros
4. Teste as funcionalidades na interface de transcrição

---

**Desenvolvido para o sistema Documenta - Transcrição médica inteligente para o Brasil**