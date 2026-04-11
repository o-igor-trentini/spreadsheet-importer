# Spreadsheet Importer

Componente React reutilizável para importação dinâmica de planilhas (.csv, .xlsx, .xls).

Clientes fazem upload de planilhas de fontes variadas, mapeiam colunas para o schema esperado, validam os dados e enviam.

## Instalação

```bash
npm install spreadsheet-importer
```

**Peer dependencies:** `react` e `react-dom` >= 19.

## Uso Básico

```tsx
import { SpreadsheetImporter } from 'spreadsheet-importer'
import type { TargetColumn } from 'spreadsheet-importer'

const columns: TargetColumn[] = [
  { key: 'origin', label: 'Origem', required: true, type: 'string' },
  { key: 'destination', label: 'Destino', required: true, type: 'string' },
  { key: 'date', label: 'Data', required: true, type: 'date' },
  { key: 'driver', label: 'Motorista', required: false, type: 'string' },
]

function App() {
  return (
    <SpreadsheetImporter
      columns={columns}
      onComplete={(data) => console.log(data)}
    />
  )
}
```

## API

### `<SpreadsheetImporter>` Props

| Prop | Tipo | Obrigatório | Descrição |
|------|------|:-----------:|-----------|
| `columns` | `TargetColumn[]` | Sim | Colunas esperadas no destino |
| `onComplete` | `(data: Record<string, unknown>[]) => void` | Sim | Callback com os dados importados |
| `onCancel` | `() => void` | Não | Callback ao cancelar |
| `onStepChange` | `(step: ImporterStep) => void` | Não | Callback a cada mudança de etapa |
| `sessionKey` | `string` | Não | Chave para persistência (localStorage) |
| `maxFileSize` | `number` | Não | Tamanho máximo do arquivo em bytes |
| `allowedFormats` | `AllowedFormat[]` | Não | Formatos aceitos (`.csv`, `.xlsx`, `.xls`) |
| `maxRows` | `number` | Não | Máximo de linhas |
| `previewRowCount` | `number` | Não | Linhas de preview (padrão: 10) |
| `locale` | `string` | Não | Locale |
| `className` | `string` | Não | Classe CSS do container |
| `persistStorage` | `StateStorage` | Não | Storage customizado (ex: IndexedDB) |

### `TargetColumn`

```ts
interface TargetColumn {
  key: string          // Identificador único
  label: string        // Label exibido na UI
  required: boolean    // Se é obrigatório
  type: ColumnType     // 'string' | 'number' | 'date' | 'email' | 'boolean' | 'enum' | 'custom'
  description?: string // Descrição auxiliar
  validators?: ColumnValidator[]  // Validadores adicionais
  enumValues?: string[]           // Valores aceitos (type: 'enum')
  transform?: (value: unknown) => unknown  // Transformação pré-submit
}
```

### Validators

```ts
interface ColumnValidator {
  type: 'required' | 'regex' | 'min' | 'max' | 'minLength' | 'maxLength' | 'enum' | 'custom'
  value?: string | number | string[]
  message?: string
  validate?: (value: unknown) => boolean  // Para type: 'custom'
}
```

## Exemplos

### Importação de Viagens

```tsx
const columns: TargetColumn[] = [
  { key: 'origin', label: 'Origem', required: true, type: 'string' },
  { key: 'destination', label: 'Destino', required: true, type: 'string' },
  { key: 'date', label: 'Data de Saída', required: true, type: 'date' },
  { key: 'driver', label: 'Motorista', required: false, type: 'string' },
  {
    key: 'weight',
    label: 'Peso (kg)',
    required: false,
    type: 'number',
    validators: [
      { type: 'min', value: 0, message: 'Peso não pode ser negativo' },
    ],
  },
]
```

### Importação de Posições

```tsx
const columns: TargetColumn[] = [
  { key: 'plate', label: 'Placa', required: true, type: 'string',
    validators: [{ type: 'regex', value: '^[A-Z]{3}\\d[A-Z0-9]\\d{2}$', message: 'Placa inválida' }]
  },
  { key: 'lat', label: 'Latitude', required: true, type: 'number' },
  { key: 'lng', label: 'Longitude', required: true, type: 'number' },
  { key: 'timestamp', label: 'Data/Hora', required: true, type: 'date' },
  { key: 'speed', label: 'Velocidade', required: false, type: 'number',
    validators: [{ type: 'min', value: 0 }, { type: 'max', value: 200 }]
  },
]
```

### Com Validators Customizados

```tsx
const columns: TargetColumn[] = [
  {
    key: 'email',
    label: 'Email',
    required: true,
    type: 'email',
    validators: [{
      type: 'custom',
      validate: (v) => String(v).endsWith('@empresa.com'),
      message: 'Deve ser um email corporativo',
    }],
  },
]
```

## Exports Auxiliares

Validators e coercion estão disponíveis para uso standalone:

```ts
import {
  validateCell,
  validateRows,
  buildValidationResult,
  coerceToNumber,
  coerceToDate,
  coerceToBoolean,
} from 'spreadsheet-importer'
```

## Desenvolvimento

```bash
npm install
npm run test      # Rodar testes
npm run build     # Build da biblioteca
npm run lint      # ESLint
npm run format    # Prettier
```

Para testar visualmente, use a app consumidora em `../si-demo`:

```bash
cd ../si-demo
npm run dev
```

## Stack

- React 19 + TypeScript
- Vite (library mode)
- Tailwind CSS v4
- Zustand (state management com persistência)
- SheetJS (parsing de planilhas)
- Fuse.js (fuzzy matching para auto-mapping)
- @tanstack/react-virtual (virtual scrolling)
- Radix UI (primitivos acessíveis)
- Vitest + React Testing Library (testes)
