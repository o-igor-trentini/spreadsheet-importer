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

- [x] `src/workers/parser.worker.ts`
  - [x] Recebe `ArrayBuffer` via `postMessage`
  - [x] Usa `XLSX.read(data, { type: 'array' })` para parsear
  - [x] Extrai: nomes das sheets, headers das colunas, sample rows (N primeiras), total de linhas
  - [x] Para extração completa (validação/submit): recebe mappings, extrai apenas colunas mapeadas, envia em chunks de 5000 linhas
  - [x] Protocolo de mensagens tipado (WorkerRequest/WorkerResponse)
  - [x] Tratamento de erros (arquivo inválido, formato não suportado)
- [x] `src/lib/parser.ts`
  - [x] Orquestração no main thread
  - [x] Instancia o Worker via `new Worker(new URL(...))`
  - [x] Fallback para main thread se Worker não disponível
  - [x] Retorna Promise que resolve com resultado do parsing
- [x] `src/hooks/use-file-parser.ts`
  - [x] Hook que expõe: `parseFile(file: File)`, `isProcessing`, `error`
  - [x] Gerencia lifecycle do Worker (criação/terminação)
- [x] **Teste**: `src/workers/__tests__/parser-logic.test.ts`
  - [x] Lógica de parsing extraída em funções puras e testada separadamente
  - [x] Testa CSV, XLSX
  - [x] Testa extração de headers e sample values

---

## Etapa 5 — Componente FileUpload (Etapa 1 do Wizard)

Interface de upload com drag-and-drop.

- [x] `src/components/ui/Dropzone.tsx`
  - [x] Área de drag-and-drop com visual feedback (border, ícone, texto)
  - [x] Suporte a clique para abrir file picker
  - [x] Validação de formato (`.csv`, `.xlsx`, `.xls`)
  - [x] Validação de tamanho máximo
  - [x] Estado visual: idle, dragover, error, processing
- [x] `src/components/steps/FileUpload.tsx`
  - [x] Renderiza `Dropzone`
  - [x] Ao receber arquivo: chama `parseFile` via hook
  - [x] Mostra progresso do parsing
  - [x] Em caso de sucesso: salva resultado na store e avança para step `mapping`
  - [x] Em caso de erro: mostra mensagem descritiva
- [x] **Teste**: `src/components/steps/__tests__/FileUpload.test.tsx`
  - [x] Renderiza dropzone
  - [x] Rejeita formatos inválidos
  - [x] Rejeita arquivos acima do tamanho máximo

---

## Etapa 6 — Auto-Mapper

Sugestão automática de mapeamento por fuzzy matching.

- [x] `src/lib/auto-mapper.ts`
  - [x] Normalização de headers: lowercase, trim, remover acentos/caracteres especiais
  - [x] Tabela de abreviações comuns: `dt` → `date`, `num` → `number`, `orig` → `origin`, `dest` → `destination`, `mot` → `motorista`
  - [x] Usar `Fuse.js` para fuzzy search de cada `TargetColumn.label` contra `SourceColumn.header`
  - [x] Threshold de confiança (ex: 0.6) — abaixo disso, não sugere
  - [x] Match exato = confidence 1.0
  - [x] Evitar mapeamentos duplicados (uma source só mapeia para um target)
  - [x] Retorna `ColumnMapping[]` com scores de confiança
- [x] **Teste**: `src/lib/__tests__/auto-mapper.test.ts`
  - [x] Match exato ("Origem" → "Origem")
  - [x] Match fuzzy ("orig" → "Origem")
  - [x] Match com abreviação ("dt_saida" → "Data de Saída")
  - [x] Não duplica mapeamentos
  - [x] Abaixo do threshold não sugere

---

## Etapa 7 — Componente ColumnMapping (Etapa 2 do Wizard)

Interface para mapear colunas fonte → colunas alvo.

- [x] `src/components/ui/DataPreview.tsx`
  - [x] Tabela virtualizada com `@tanstack/react-virtual`
  - [x] Mostra N primeiras linhas da planilha importada
  - [x] Headers da planilha como cabeçalho da tabela
  - [x] Scroll horizontal para planilhas largas
- [x] `src/components/ui/MappingSelect.tsx`
  - [x] Dropdown (Radix Select) com lista de colunas fonte disponíveis
  - [x] Opção "Não mapear" para colunas opcionais
  - [x] Sample values como hint no dropdown
  - [x] Colunas já mapeadas aparecem desabilitadas/marcadas
- [x] `src/components/ui/MappingRow.tsx`
  - [x] Uma linha por `TargetColumn`: label, badge required/optional, `MappingSelect`, confidence badge se auto-mapeado
- [x] `src/components/steps/ColumnMapping.tsx`
  - [x] Executa auto-mapper ao montar (se não houver mappings salvos)
  - [x] Lista de `MappingRow` para cada coluna alvo
  - [x] `DataPreview` acima para referência visual
  - [x] Validação: todas as colunas required devem estar mapeadas antes de avançar
  - [x] Botão "Próximo" habilitado só quando válido
  - [x] Salva mappings na store a cada mudança
- [x] **Teste**: `src/components/steps/__tests__/ColumnMapping.test.tsx`
  - [x] Renderiza todas as target columns
  - [x] Auto-mapping preenche selects
  - [x] Não permite avançar sem colunas required mapeadas
  - [x] Mudança manual atualiza a store

---

## Etapa 8 — Validação (Web Worker + Componente)

Validação em background com feedback visual.

- [x] `src/lib/type-coercion.ts`
  - [x] `coerceToNumber(value)`: string → number, lidar com vírgula decimal pt-BR
  - [x] `coerceToDate(value)`: string → Date, múltiplos formatos (DD/MM/YYYY, YYYY-MM-DD, etc.)
  - [x] `coerceToBoolean(value)`: "sim"/"não", "yes"/"no", "true"/"false", "1"/"0"
- [x] `src/lib/validator.ts`
  - [x] Validators built-in: required, regex, min, max, minLength, maxLength, enum
  - [x] Suporte a `validate` custom function
  - [x] Type checking com coerção
  - [x] Orquestração: envia dados em chunks para o Worker, agrega resultados
- [x] `src/workers/validator.worker.ts`
  - [x] Recebe chunk de linhas + schema (TargetColumn[]) + mappings
  - [x] Aplica validators por célula
  - [x] Retorna `ValidationIssue[]` + progresso
- [x] `src/hooks/use-validator.ts`
  - [x] Hook: `validate()`, `isValidating`, `progress`, `result`
- [x] `src/components/ui/ValidationTable.tsx`
  - [x] Tabela virtualizada de issues
  - [x] Colunas: linha, coluna, valor, severidade, mensagem
  - [x] Filtros: errors only, warnings only, por coluna
  - [x] Badge de contagem por severidade
- [x] `src/components/steps/DataValidation.tsx`
  - [x] Executa validação ao montar
  - [x] Progress bar durante validação
  - [x] Sumário: X erros, Y avisos, Z linhas válidas de N total
  - [x] `ValidationTable` com detalhes
  - [x] Pode avançar com warnings, mas não com errors (ou config via prop)
  - [x] Botão "Revalidar" após correções na planilha
- [x] **Teste**: `src/lib/__tests__/validator.test.ts`
  - [x] Cada tipo de validator
  - [x] Type coercion
  - [x] Custom validator
- [x] **Teste**: `src/components/steps/__tests__/DataValidation.test.tsx`
  - [x] Mostra sumário correto
  - [x] Bloqueia avanço com erros

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
