# Contrato Técnico da RPC e Especificação de Testes RLS — Sistema de Matrícula 2026

**Escola Técnica Estadual Maria José Vasconcelos — Bezerros/PE**  
**Ano Letivo:** 2026  
**Documento Base:** “Ficha Ok 2026” (Modelo Oficial Google Docs mantido intacto)  
**Status:** Proposta de Contrato para Revisão e Aprovação (Sem migrations aplicadas nesta fase)

---

## 1. Visão Geral do Contrato RPC `save_enrollment`

A gravação e atualização de matrículas será centralizada em uma função PostgreSQL RPC (`save_enrollment`) executada dentro de uma transação atômica. Isso garante que:

1. Nenhuma matrícula incompleta seja salva com inconsistência referencial.
2. O protocolo oficial de matrícula (ex: `MAT-2026-0149`) seja gerado exclusivamente pelo servidor com controle estrito de concorrência.
3. As regras de negócio (duplicidade de CPF no mesmo ano letivo, validação de cotas, responsáveis e documentos obrigatórios) sejam aplicadas no backend.
4. O documento oficial “Ficha Ok 2026” tenha 100% de correspondência com as entidades persistidas.

---

## 2. Assinatura da RPC `save_enrollment`

```sql
CREATE OR REPLACE FUNCTION public.save_enrollment(
  p_enrollment_id UUID,                -- NULL para nova matrícula; UUID para atualização
  p_payload JSONB                      -- Objeto com todos os dados da matrícula
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
...
$$;
```

---

## 3. Esquema do Payload (`p_payload`)

```typescript
export interface SaveEnrollmentPayload {
  // Identificação e Curso
  academic_year: 2026;
  course_id: string; // Ex: 'desenvolvimento-sistemas', 'administracao', 'enfermagem', 'logistica'
  shift: "manha" | "tarde" | "noite" | "integral";
  status: "rascunho" | "em_analise" | "concluida";
  quota: {
    is_quota: boolean;
    quota_type?: "escola_publica" | "renda" | "vulnerabilidade" | "pcd" | "nao_cotista";
    quota_document_ref?: string;
  };

  // Dados Pessoais do Estudante (Ficha Ok 2026 - Seção 2)
  student: {
    full_name: string;
    social_name?: string;
    cpf: string; // Normalizado: apenas números (11 dígitos)
    rg?: string;
    rg_issuer?: string;
    rg_uf?: string;
    birth_date: string; // Formato YYYY-MM-DD
    gender?: "M" | "F" | "outro";
    race?: "branca" | "preta" | "parda" | "amarela" | "indigena" | "nao_declarada";
    nationality: string; // Padrão: "Brasileira"
    birth_place_city?: string;
    birth_place_uf?: string;
    phone?: string;
    email?: string;
    address: {
      street: string;
      number: string;
      complement?: string;
      neighborhood: string;
      city: string;
      uf: string;
      cep: string;
    };
    is_pcd: boolean;
    pcd_details?: string;
    uses_school_transport: boolean;
    transport_route?: string;
    previous_school?: string;
    bolsa_familia_beneficiary?: boolean;
    nis_number?: string;
  };

  // Filiação (Ficha Ok 2026 - Seção 3)
  parentage: {
    mother: {
      status: "informado" | "nao_informado" | "falecida" | "nao_se_aplica";
      name?: string;
      cpf?: string;
      phone?: string;
    };
    father: {
      status: "informado" | "nao_informado" | "falecido" | "nao_se_aplica";
      name?: string;
      cpf?: string;
      phone?: string;
    };
  };

  // Responsável Legal Explicitamente Selecionado (Ficha Ok 2026 - Seção 4)
  legal_guardian: {
    relationship: "mae" | "pai" | "avo" | "tutor_judicial" | "outro";
    full_name: string;
    cpf: string;
    rg?: string;
    phone_primary: string;
    phone_secondary?: string;
    email?: string;
    occupation?: string;
    workplace?: string;
    address_same_as_student: boolean;
    specific_address?: string;
  };

  // Saúde e Emergência (Ficha Ok 2026 - Seção 5 - Protegido por RLS estrita)
  health: {
    has_health_insurance: boolean;
    health_insurance_name?: string;
    has_drug_allergy: boolean;
    drug_allergy_details?: string;
    has_food_allergy: boolean;
    food_allergy_details?: string;
    uses_controlled_medication: boolean;
    medication_details?: string;
    blood_type?: "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";
    emergency_contacts: Array<{
      name: string;
      phone: string;
      relationship: string;
    }>;
    medical_notes?: string;
  };

  // Checklist de Documentos (Ficha Ok 2026 - Seção 6)
  documents: Array<{
    document_type:
      | "certidao_nascimento"
      | "rg_cpf_estudante"
      | "rg_cpf_responsavel"
      | "fotos_3x4"
      | "comprovante_residencia"
      | "cartao_vacina"
      | "ficha_18"
      | "comprovante_cota"
      | "laudo_pcd";
    status: "pendente" | "entregue" | "dispensado" | "em_analise";
    file_path?: string; // Caminho no Storage Privado (sem URLs públicas)
    verified_at?: string;
    deadline?: string; // Prazo tolerado (ex: Ficha 18)
    notes?: string;
  }>;

  // Termos e Declarações Legais
  terms: {
    educational_commitment_accepted: boolean;
    image_voice_concession_accepted: boolean;
    truthfulness_declaration_accepted: boolean;
    accepted_at: string;
    ip_address?: string;
  };
}
```

---

## 4. Fluxos de Status e Transições

| Status Origem | Status Destino | Condição / Validação                                                                                       |
| ------------- | -------------- | ---------------------------------------------------------------------------------------------------------- |
| `[Novo]`      | `rascunho`     | Permite salvar campos parciais para preenchimento posterior.                                               |
| `rascunho`    | `em_analise`   | Requer dados pessoais do estudante, responsável legal e ao menos 60% dos documentos entregues.             |
| `em_analise`  | `concluida`    | Valida 100% dos documentos bloqueantes, CPF validado sem duplicidade e aprovação pelo operador/secretaria. |
| `concluida`   | `em_analise`   | Somente papel `admin` pode reabrir matrícula concluída (com log de auditoria obrigatório).                 |

---

## 5. Regras de Unicidade e Validação no Servidor

1. **CPF do Estudante**:
   - Algoritmo oficial de dígitos verificadores (módulo 11).
   - Bloqueio de duplicidade: não é permitida mais de uma matrícula com status `concluida` ou `em_analise` para o mesmo CPF no ano letivo de 2026.
2. **Número de Protocolo / Matrícula**:
   - Gerado na sequência atômica: `MAT-2026-` + `LPAD(nextval('seq_matriculas_2026')::TEXT, 4, '0')`.
3. **Responsável Legal**:
   - É obrigatório que haja exatamente um responsável legal explicitamente eleito, com CPF e contato válidos, mesmo se os pais biológicos estiverem registrados.
4. **Isolamento de Saúde**:
   - Os dados de saúde são armazenados na tabela `health_records`, protegidos por política RLS própria para impedir que operadores gerais visualizem dados clínicos sensíveis fora do atendimento de emergência.

---

## 6. Suíte de Testes de Integração RLS (Supabase Dev)

Abaixo está o script de testes para validação das políticas RLS em ambiente Supabase de desenvolvimento:

```sql
-- ============================================================================
-- SUÍTE DE TESTES DE INTEGRAÇÃO RLS — AMBIENTE SUPABASE DEV
-- ============================================================================

BEGIN;

-- 1. Teste: Usuário anônimo não deve conseguir ler matrículas
SET ROLE anon;
SELECT count(*) FROM public.enrollments;
-- ESPERADO: 0 linhas ou erro de permissão negada (RLS ativo)

-- 2. Teste: Operador autenticado pode listar matrículas
SET ROLE authenticated;
SET request.jwt.claims = '{"sub": "op-user-uuid-1", "role": "authenticated", "app_role": "operador"}';
SELECT count(*) FROM public.enrollments;
-- ESPERADO: Apenas matrículas que o operador está autorizado a ver

-- 3. Teste: Operador NÃO pode deletar matrícula concluída
DELETE FROM public.enrollments WHERE status = 'concluida';
-- ESPERADO: 0 rows affected (bloqueado por policy RLS)

-- 4. Teste: Acesso aos dados de saúde (health_records)
-- Operador geral tentando consultar prontuário de saúde sensível
SELECT * FROM public.health_records WHERE drug_allergy_details IS NOT NULL;
-- ESPERADO: Acesso restrito ou visualização de campos mascarados conforme policy

-- 5. Teste: Administrador possui permissão de auditoria e configurações
SET request.jwt.claims = '{"sub": "admin-user-uuid-1", "role": "authenticated", "app_role": "admin"}';
SELECT count(*) FROM public.audit_logs;
-- ESPERADO: Acesso concedido aos logs de auditoria

ROLLBACK;
```

---

## 7. Garantia do Modelo “Ficha Ok 2026”

- O documento Google Docs oficial **“Ficha Ok 2026”** permanece intacto como matriz de modelo.
- A função de geração de documentos trabalhará exclusivamente gerando uma nova cópia por protocolo emitido e preenchendo os marcadores `${NOME_ESTUDANTE}`, `${CPF}`, `${CURSO}`, `${PROTOCOLO}`, etc.
- O recurso **Converter em PDF** na interface reflete rigorosamente esta estrutura, possibilitando validação visual imediata e impressão A4 em formato oficial.
