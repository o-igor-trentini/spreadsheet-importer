# Spreadsheet Importer — Plano de Implementação

Componente React reutilizável para importação dinâmica de planilhas (.csv, .xlsx).
Clientes fazem upload de planilhas de fontes variadas, mapeiam colunas para o schema esperado, validam os dados e enviam.

---

## Etapa 1 — Fundação do Projeto

Setup inicial: Vite + React 19 + TypeScript + Tailwind v4 + shadcn/ui + Zustand.

- [x] Inicializar projeto com Vite (`npm create vite@latest . -- --template react-ts`)
- [x] Configurar Tailwind CSS v4 com `@tailwindcss/vite`
- [x] Configurar path aliases (`@/*`, `@hooks`, `@ui`) no `tsconfig.json` e `vite.config.ts`
- [x] Instalar e configurar shadcn/ui (`components.json`, utilitário `cn()`, CSS variables)
- [x] Configurar Vite em modo library build com `vite-plugin-dts`
  - Entry: `src/index.ts`
  - Externals: `react`, `react-dom`
  - Gerar `.d.ts` bundled
- [x] Criar app de demo em `/dev` (entry separado para desenvolvimento)
- [x] Configurar ESLint + Prettier
- [x] Configurar Vitest + React Testing Library + jsdom

### Estrutura de diretórios a criar:

```
src/
├── index.ts
├── types/
├── components/
│   ├── steps/
│   └── ui/
├── store/
├── workers/
├── lib/
├── hooks/
└── styles/
dev/
├── App.tsx
├── main.tsx
└── index.html
```

### Dependências a instalar:

**Runtime:**
- `xlsx` (SheetJS)
- `zustand`
- `@tanstack/react-virtual`
- `fuse.js`
- `class-variance-authority`, `clsx`, `tailwind-merge`
- `lucide-react`

**Dev:**
- `vite-plugin-dts`
- `vitest`, `@testing-library/react`, `@testing-library/user-event`, `jsdom`
- Radix UI: `@radix-ui/react-dialog`, `@radix-ui/react-select`, `@radix-ui/react-popover`, `@radix-ui/react-progress`, `@radix-ui/react-tooltip`

---

## Etapa 2 — Tipos TypeScript

Definir todos os tipos que serão usados pelo sistema.

- [x] `src/types/column.ts` — tipos de coluna e mapeamento
  - [x] `ColumnType`: `'string' | 'number' | 'date' | 'email' | 'boolean' | 'enum' | 'custom'`
  - [x] `ColumnValidator`: `{ type, value?, message?, validate? }`
  - [x] `TargetColumn`: `{ key, label, required, type, description?, validators?, enumValues?, transform? }`
  - [x] `SourceColumn`: `{ index, header, sampleValues }`
  - [x] `ColumnMapping`: `{ targetKey, sourceIndex, confidence? }`
- [x] `src/types/validation.ts` — tipos de validação
  - [x] `ValidationSeverity`: `'error' | 'warning'`
  - [x] `ValidationIssue`: `{ row, columnKey, severity, message, value }`
  - [x] `ValidationResult`: `{ isValid, totalRows, validRows, issues, errorCount, warningCount }`
- [x] `src/types/importer.ts` — props do componente
  - [x] `ImporterStep`: `'upload' | 'mapping' | 'validation' | 'review'`
  - [x] `SpreadsheetImporterProps`: `{ columns, onComplete, onCancel?, onStepChange?, sessionKey?, maxFileSize?, allowedFormats?, maxRows?, previewRowCount?, locale?, className?, persistStorage? }`
- [x] `src/types/store.ts` — tipos da store Zustand
  - [x] `ImporterState`: step, fileName, fileData, sourceColumns, previewData, totalRows, mappings, validationResult, isProcessing, error
  - [x] `ImporterActions`: setStep, setFileData, setMappings, setValidationResult, setProcessing, setError, reset
- [x] `src/types/index.ts` — barrel re-export

---

## Etapa 3 — Store Zustand + Provider

State management com persistência para salvar progresso.

- [x] `src/store/importer-store.ts`
  - [x] Usar `createStore()` (não `create()`) para store isolada por instância
  - [x] Middleware `persist` com `createJSONStorage`
  - [x] Chave de persistência: `spreadsheet-importer-${sessionKey}`
  - [x] `partialize`: persistir apenas sessionId, step, fileName, sourceColumns, previewData, totalRows, mappings (NÃO persistir fileData nem validationResult)
  - [x] Todas as actions definidas
- [x] `src/store/store-provider.tsx`
  - [x] React Context para fornecer a store aos componentes filhos
  - [x] Criar store no provider com base nas props recebidas
- [x] `src/hooks/use-importer-store.ts`
  - [x] Hook tipado para consumir a store via context
  - [x] Seletores para cada parte do estado
- [x] **Teste**: `src/store/__tests__/importer-store.test.ts`
  - [x] Transições de estado funcionam
  - [x] Persist/rehydrate cycle funciona
  - [x] Reset limpa o estado

---

## Etapa 4 — Parser (Web Worker + Orquestração)

Parsing de planilhas em Web Worker para não travar a UI.

- [ ] `src/workers/parser.worker.ts`
  - [ ] Recebe `ArrayBuffer` via `postMessage`
  - [ ] Usa `XLSX.read(data, { type: 'array' })` para parsear
  - [ ] Extrai: nomes das sheets, headers das colunas, sample rows (N primeiras), total de linhas
  - [ ] Para extração completa (validação/submit): recebe mappings, extrai apenas colunas mapeadas, envia em chunks de 5000 linhas
  - [ ] Protocolo de mensagens tipado (WorkerRequest/WorkerResponse)
  - [ ] Tratamento de erros (arquivo inválido, formato não suportado)
- [ ] `src/lib/parser.ts`
  - [ ] Orquestração no main thread
  - [ ] Instancia o Worker via `new Worker(new URL(...))`
  - [ ] Fallback para main thread se Worker não disponível
  - [ ] Retorna Promise que resolve com resultado do parsing
- [ ] `src/hooks/use-file-parser.ts`
  - [ ] Hook que expõe: `parseFile(file: File)`, `isProcessing`, `error`
  - [ ] Gerencia lifecycle do Worker (criação/terminação)
- [ ] **Teste**: `src/workers/__tests__/parser-logic.test.ts`
  - [ ] Lógica de parsing extraída em funções puras e testada separadamente
  - [ ] Testa CSV, XLSX
  - [ ] Testa extração de headers e sample values

---

## Etapa 5 — Componente FileUpload (Etapa 1 do Wizard)

Interface de upload com drag-and-drop.

- [ ] `src/components/ui/Dropzone.tsx`
  - [ ] Área de drag-and-drop com visual feedback (border, ícone, texto)
  - [ ] Suporte a clique para abrir file picker
  - [ ] Validação de formato (`.csv`, `.xlsx`, `.xls`)
  - [ ] Validação de tamanho máximo
  - [ ] Estado visual: idle, dragover, error, processing
- [ ] `src/components/steps/FileUpload.tsx`
  - [ ] Renderiza `Dropzone`
  - [ ] Ao receber arquivo: chama `parseFile` via hook
  - [ ] Mostra progresso do parsing
  - [ ] Em caso de sucesso: salva resultado na store e avança para step `mapping`
  - [ ] Em caso de erro: mostra mensagem descritiva
- [ ] **Teste**: `src/components/steps/__tests__/FileUpload.test.tsx`
  - [ ] Renderiza dropzone
  - [ ] Rejeita formatos inválidos
  - [ ] Rejeita arquivos acima do tamanho máximo

---

## Etapa 6 — Auto-Mapper

Sugestão automática de mapeamento por fuzzy matching.

- [ ] `src/lib/auto-mapper.ts`
  - [ ] Normalização de headers: lowercase, trim, remover acentos/caracteres especiais
  - [ ] Tabela de abreviações comuns: `dt` → `date`, `num` → `number`, `orig` → `origin`, `dest` → `destination`, `mot` → `motorista`
  - [ ] Usar `Fuse.js` para fuzzy search de cada `TargetColumn.label` contra `SourceColumn.header`
  - [ ] Threshold de confiança (ex: 0.6) — abaixo disso, não sugere
  - [ ] Match exato = confidence 1.0
  - [ ] Evitar mapeamentos duplicados (uma source só mapeia para um target)
  - [ ] Retorna `ColumnMapping[]` com scores de confiança
- [ ] **Teste**: `src/lib/__tests__/auto-mapper.test.ts`
  - [ ] Match exato ("Origem" → "Origem")
  - [ ] Match fuzzy ("orig" → "Origem")
  - [ ] Match com abreviação ("dt_saida" → "Data de Saída")
  - [ ] Não duplica mapeamentos
  - [ ] Abaixo do threshold não sugere

---

## Etapa 7 — Componente ColumnMapping (Etapa 2 do Wizard)

Interface para mapear colunas fonte → colunas alvo.

- [ ] `src/components/ui/DataPreview.tsx`
  - [ ] Tabela virtualizada com `@tanstack/react-virtual`
  - [ ] Mostra N primeiras linhas da planilha importada
  - [ ] Headers da planilha como cabeçalho da tabela
  - [ ] Scroll horizontal para planilhas largas
- [ ] `src/components/ui/MappingSelect.tsx`
  - [ ] Dropdown (Radix Select) com lista de colunas fonte disponíveis
  - [ ] Opção "Não mapear" para colunas opcionais
  - [ ] Sample values como hint no dropdown
  - [ ] Colunas já mapeadas aparecem desabilitadas/marcadas
- [ ] `src/components/ui/MappingRow.tsx`
  - [ ] Uma linha por `TargetColumn`: label, badge required/optional, `MappingSelect`, confidence badge se auto-mapeado
- [ ] `src/components/steps/ColumnMapping.tsx`
  - [ ] Executa auto-mapper ao montar (se não houver mappings salvos)
  - [ ] Lista de `MappingRow` para cada coluna alvo
  - [ ] `DataPreview` acima para referência visual
  - [ ] Validação: todas as colunas required devem estar mapeadas antes de avançar
  - [ ] Botão "Próximo" habilitado só quando válido
  - [ ] Salva mappings na store a cada mudança
- [ ] **Teste**: `src/components/steps/__tests__/ColumnMapping.test.tsx`
  - [ ] Renderiza todas as target columns
  - [ ] Auto-mapping preenche selects
  - [ ] Não permite avançar sem colunas required mapeadas
  - [ ] Mudança manual atualiza a store

---

## Etapa 8 — Validação (Web Worker + Componente)

Validação em background com feedback visual.

- [ ] `src/lib/type-coercion.ts`
  - [ ] `coerceToNumber(value)`: string → number, lidar com vírgula decimal pt-BR
  - [ ] `coerceToDate(value)`: string → Date, múltiplos formatos (DD/MM/YYYY, YYYY-MM-DD, etc.)
  - [ ] `coerceToBoolean(value)`: "sim"/"não", "yes"/"no", "true"/"false", "1"/"0"
- [ ] `src/lib/validator.ts`
  - [ ] Validators built-in: required, regex, min, max, minLength, maxLength, enum
  - [ ] Suporte a `validate` custom function
  - [ ] Type checking com coerção
  - [ ] Orquestração: envia dados em chunks para o Worker, agrega resultados
- [ ] `src/workers/validator.worker.ts`
  - [ ] Recebe chunk de linhas + schema (TargetColumn[]) + mappings
  - [ ] Aplica validators por célula
  - [ ] Retorna `ValidationIssue[]` + progresso
- [ ] `src/hooks/use-validator.ts`
  - [ ] Hook: `validate()`, `isValidating`, `progress`, `result`
- [ ] `src/components/ui/ValidationTable.tsx`
  - [ ] Tabela virtualizada de issues
  - [ ] Colunas: linha, coluna, valor, severidade, mensagem
  - [ ] Filtros: errors only, warnings only, por coluna
  - [ ] Badge de contagem por severidade
- [ ] `src/components/steps/DataValidation.tsx`
  - [ ] Executa validação ao montar
  - [ ] Progress bar durante validação
  - [ ] Sumário: X erros, Y avisos, Z linhas válidas de N total
  - [ ] `ValidationTable` com detalhes
  - [ ] Pode avançar com warnings, mas não com errors (ou config via prop)
  - [ ] Botão "Revalidar" após correções na planilha
- [ ] **Teste**: `src/lib/__tests__/validator.test.ts`
  - [ ] Cada tipo de validator
  - [ ] Type coercion
  - [ ] Custom validator
- [ ] **Teste**: `src/components/steps/__tests__/DataValidation.test.tsx`
  - [ ] Mostra sumário correto
  - [ ] Bloqueia avanço com erros

---

## Etapa 9 — Wizard Shell + Revisão (Etapas 3-4 do Wizard)

Container do wizard e etapa final de revisão.

- [ ] `src/components/ui/StepIndicator.tsx`
  - [ ] Stepper horizontal: upload → mapping → validation → review
  - [ ] Estado visual: completed, current, upcoming
  - [ ] Clicável para navegar a steps já completados
- [ ] `src/components/ui/ResumeSessionBanner.tsx`
  - [ ] Detecta estado persistido no localStorage
  - [ ] Mostra: "Importação anterior encontrada ({fileName}). Continuar de onde parou?"
  - [ ] Botões: "Continuar" (restaura estado) / "Nova importação" (reset)
- [ ] `src/components/steps/ReviewSubmit.tsx`
  - [ ] Resumo do mapeamento (read-only): coluna origem → coluna destino
  - [ ] Preview dos dados transformados (virtualizado)
  - [ ] Contagem: N linhas serão importadas
  - [ ] Botão "Importar" que chama `onComplete` com os dados processados
  - [ ] Estado de loading durante processamento/envio
- [ ] `src/components/WizardShell.tsx`
  - [ ] Lê step da store, renderiza componente correspondente
  - [ ] Renderiza `StepIndicator` no topo
  - [ ] Botões de navegação (Voltar/Próximo) padronizados
  - [ ] Renderiza `ResumeSessionBanner` se houver estado salvo
- [ ] `src/components/SpreadsheetImporter.tsx`
  - [ ] Componente raiz — API pública
  - [ ] Recebe props, cria store, renderiza `StoreProvider` > `WizardShell`
  - [ ] Passa `columns`, callbacks, configurações para a store/context
- [ ] `src/index.ts`
  - [ ] Exporta `SpreadsheetImporter` (componente)
  - [ ] Exporta todos os tipos públicos
  - [ ] Exporta validators para uso standalone se necessário
- [ ] **Teste**: `src/components/__tests__/SpreadsheetImporter.test.tsx`
  - [ ] Renderiza sem crash
  - [ ] Fluxo completo: upload → map → validate → submit

---

## Etapa 10 — Polimento + Demo

Finalização, app demo e documentação.

- [ ] `dev/App.tsx` — app demo com exemplo de importação de viagens
  - [ ] Configuração de colunas de exemplo (origem, destino, data, motorista)
  - [ ] `onComplete` que mostra os dados no console / toast
- [ ] Teste de performance manual
  - [ ] Upload de planilha com 50k+ linhas
  - [ ] Verificar que UI permanece responsiva
  - [ ] Medir tempo de parsing e validação
- [ ] Teste de persistência manual
  - [ ] Iniciar importação, parar no step de mapping
  - [ ] Recarregar página → banner de resume deve aparecer
  - [ ] Clicar "Continuar" → deve restaurar mappings
- [ ] Build da biblioteca
  - [ ] `npm run build` gera `dist/index.js`, `dist/index.d.ts`, `dist/style.css`
  - [ ] `npm pack` e testar instalação em projeto separado
- [ ] README.md com documentação
  - [ ] Instalação
  - [ ] Uso básico
  - [ ] API completa (props, tipos)
  - [ ] Exemplos para diferentes casos (viagens, posições, etc.)

---

## Notas Técnicas

### Performance
- Web Workers para parsing e validação (nunca bloqueia UI)
- Comunicação em chunks de 5000 linhas (evita picos de memória)
- Virtual scrolling em todas as tabelas de dados
- Fallback para main thread se Worker indisponível

### Persistência
- localStorage por padrão (via Zustand persist)
- NÃO persiste dados brutos do arquivo (muito grande)
- Persiste: step, fileName, sourceColumns, mappings, previewData
- No resume: cliente re-faz upload, sistema verifica headers
- Prop `persistStorage` permite injetar IndexedDB adapter

### API Pública

```tsx
<SpreadsheetImporter
  columns={[
    { key: 'origin', label: 'Origem', required: true, type: 'string' },
    { key: 'destination', label: 'Destino', required: true, type: 'string' },
    { key: 'date', label: 'Data', required: true, type: 'date' },
    { key: 'driver', label: 'Motorista', required: false, type: 'string' },
  ]}
  onComplete={(data) => handleImport(data)}
  onCancel={() => {}}
  sessionKey="trips-import-v1"
  maxFileSize={50 * 1024 * 1024}
  allowedFormats={['.csv', '.xlsx', '.xls']}
/>
```
