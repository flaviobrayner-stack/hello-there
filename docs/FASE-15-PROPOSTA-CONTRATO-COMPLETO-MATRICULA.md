# Fase 15 — proposta de contrato completo de matrícula (para revisão)

**Projeto:** Sistema de Matrícula 2026 — ETE Maria José Vasconcelos  
**Branch:** `feature/sistema-matricula-2026`  
**Status:** proposta técnica não aprovada. Não conectada ao endpoint e não autoriza migration.

## Objetivo

Consolidar num só documento o formato que a integração futura deverá suportar, evitando conectar a interface ao POST atual que recebe apenas um subconjunto de dados. Este contrato é derivado da UI e do SQL de rascunho; não substitui a ficha oficial “Ficha Ok 2026”.

## Envelope proposto — versão 2

O exemplo é ilustrativo e não deve ser enviado ao endpoint atual:

```json
{
  "schema_version": 2,
  "academic_year": 2026,
  "course_id": "00000000-0000-4000-8000-000000000001",
  "quota": {
    "is_quota": false,
    "quota_type": null
  },
  "student": {
    "full_name": "Nome completo",
    "social_name": null,
    "cpf": null,
    "rg": null,
    "rg_issuer": null,
    "birth_date": null,
    "birthplace": null,
    "sex": null,
    "marital_status": null,
    "phone": null,
    "email": null,
    "address": null,
    "neighborhood": null,
    "city": null,
    "state": "PE",
    "cep": null,
    "race_color": null,
    "pcd": false,
    "pcd_type": null,
    "school_transport": false,
    "transport_type": null,
    "previous_school": null,
    "shirt_size": null,
    "bolsa_familia": null
  },
  "parents": [
    {
      "relationship_type": "mae",
      "full_name": null,
      "status": "informado",
      "cpf": null,
      "is_legal_guardian": false
    },
    {
      "relationship_type": "pai",
      "full_name": null,
      "status": "informado",
      "cpf": null,
      "is_legal_guardian": false
    }
  ],
  "legal_guardian": {
    "relationship_type": "responsavel",
    "full_name": "Nome do responsável",
    "cpf": null
  },
  "health": {
    "health_insurance": null,
    "accredited_hospital": null,
    "family_hospital": null,
    "medication_allergy": null,
    "allergy_details": null,
    "food_allergy": null,
    "food_allergy_details": null,
    "controlled_medication": null,
    "medication_details": null,
    "blood_type": null,
    "rh_factor": null,
    "emergency_name": null,
    "emergency_phone": null,
    "emergency_relationship": null,
    "health_notes": null,
    "health_notes_details": null
  },
  "documents": [
    {
      "document_type": "certidao_nascimento",
      "client_file_token": "issued-by-a-future-upload-endpoint"
    }
  ],
  "confirmation": {
    "reviewed": true,
    "privacy_notice_version": "to-be-approved"
  }
}
```

## Regras obrigatórias para a implementação futura

1. Validar o objeto completo com esquema estrito versionado; rejeitar propriedades desconhecidas, valores fora dos catálogos e combinações inconsistentes.
2. Não confiar em IDs de curso, status de matrícula, protocolo, identidade de operador, estado de documento ou caminho de Storage enviados pelo cliente.
3. Verificar no servidor que o curso está ativo e disponível para o ano letivo solicitado.
4. Tratar o cadastro principal, responsáveis e registros de saúde como uma operação transacional: falha em componente obrigatório deve reverter a transação inteira.
5. Validar CPF e CEP por normalização no servidor; definir política institucional para CPF ausente, duplicidade, correção e rematrícula antes de impor unicidade.
6. Persistir filiação e responsável legal separadamente; não inferir automaticamente que mãe ou pai é responsável legal.
7. Não gravar detalhes médicos em logs, analytics, mensagens de erro ou listagens gerais. Acesso de saúde deve ter autorização própria e auditável.
8. Fazer upload para bucket privado por endpoint específico, com limite real de bytes, MIME verificado pelo conteúdo, allowlist de extensões, nomes gerados pelo servidor, políticas Storage e autorização por matrícula.
9. O navegador nunca envia `storage_path`, `checked_by`, `checked_at`, status “conferido” ou qualquer campo de auditoria como fonte confiável.
10. O servidor gera protocolo e estado inicial; a confirmação da interface não significa matrícula concluída nem substitui aviso de privacidade e política institucional.
11. Definir idempotência para evitar duplicação em reenvios e concorrência; devolver apenas o identificador, protocolo e estado mínimo necessário.
12. Definir retenção, correção, cancelamento, acesso de operador/admin e trilha de auditoria antes de produção.

## Diferenças ainda pendentes de aprovação

- A ficha oficial e seus campos obrigatórios não estão disponíveis no repositório.
- O modelo SQL é um rascunho e os nomes de colunas devem ser comparados com o schema aprovado.
- A UI não tem pergunta explícita de alergia alimentar, embora o SQL a preveja.
- A UI ainda não coleta todos os campos de responsável que existem no rascunho SQL.
- Documentos atuais têm estados locais; o token de upload acima é apenas um conceito e ainda não existe endpoint de upload.
- Regras de cota, prazos documentais, idade, ano letivo e cursos disponíveis precisam de aprovação da escola.

## Decisão de implementação

**Não conectar este contrato ao endpoint atual nesta fase.** Primeiro comparar a ficha oficial e obter aprovação do modelo de campos. Em seguida, implementar validação e testes de contrato, RPC transacional e políticas de acesso numa branch de revisão, sem aplicar migrations no projeto Supabase até autorização explícita.
