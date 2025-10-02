// Tipos de dados para o sistema de gestão de agência de viagens

export interface Configuracao {
  nome_agencia: string
  percentual_comissao_padrao: number
  dias_alerta_inatividade: number
  cores_marca: { primaria: string; secundaria: string }
  origens_clientes: string[]
  operadoras_default: string[]
  servicos_default: string[]
  metas_valor?: number
  metas_comissao?: number
}

export interface Cliente {
  id: string
  nome_pagante: string
  cpf: string
  data_nascimento: string
  telefone: string
  email: string
  origem_cliente: string
  status_fidelidade: 'Bronze' | 'Prata' | 'Ouro' | 'Diamante'
  historico_compras: { num_reservas: number; valor_total: number }
  ativo: boolean
  data_ultima_compra?: string
  created_at: string
  updated_at: string
}

export interface Acompanhante {
  id: string
  nome: string
  cpf: string
  data_nascimento: string
  telefone?: string
  email?: string
  cliente_id: string
  created_at: string
  updated_at: string
}

export interface Fornecedor {
  id: string
  nome: string
  tipo: 'Operadora' | 'Companhia Aérea' | 'Hotel' | 'Seguradora' | 'Outros'
  cnpj?: string
  telefone?: string
  email?: string
  contato_comercial?: string
  percentual_comissao_padrao?: number
  observacoes?: string
  ativo: boolean
  created_at: string
  updated_at: string
}

export interface Reserva {
  id: string
  cliente_pagante_id: string
  acompanhantes: string[]
  data_compra: string
  operadora: string
  codigo_reserva: string
  servico: string
  data_checkin: string
  data_checkout?: string
  companhia_aerea?: string
  codigo_aereo?: string
  destino: string
  hotel?: string
  forma_pagamento: string
  valor_venda: number
  percentual_comissao: number
  comissao_calculada: number
  comissao_lancada_manual?: number
  observacoes: string
  status: 'Confirmada' | 'Cancelada' | 'Pendente' | 'Finalizada'
  alerta_checkin?: string
  anexos?: string[]
  referencia_externa?: string
  created_at: string
  updated_at: string
}

export interface Documento {
  id: string
  reserva_id: string
  tipo: 'Voucher' | 'Passagem' | 'Seguro' | 'Contrato' | 'Outros'
  nome_arquivo: string
  url_arquivo: string
  tamanho_arquivo: number
  created_at: string
  updated_at: string
}

export interface LogAuditoria {
  id: string
  usuario: string
  acao: 'CREATE' | 'UPDATE' | 'DELETE'
  tabela: string
  registro_id: string
  dados_anteriores?: any
  dados_novos?: any
  timestamp: string
}

export interface Alerta {
  id: string
  tipo: 'checkin_hoje' | 'checkin_amanha' | 'checkin_proximo' | 'cliente_inativo' | 'meta_atingida'
  titulo: string
  descricao: string
  prioridade: 'baixa' | 'media' | 'alta'
  lido: boolean
  data_criacao: string
  data_expiracao?: string
  dados_relacionados?: any
}

export interface Meta {
  id: string
  tipo: 'valor' | 'comissao' | 'vendas'
  valor_meta: number
  periodo: 'mensal' | 'anual'
  ano: number
  mes?: number
  valor_atual: number
  percentual_atingido: number
  created_at: string
  updated_at: string
}

// Tipos para relatórios
export interface ResumoMensal {
  mes: number
  ano: number
  num_vendas: number
  valor_vendido: number
  comissao_total: number
  ticket_medio: number
}

export interface OrigemVendas {
  origem: string
  quantidade: number
  valor_total: number
  percentual: number
}

export interface ROIOperadora {
  operadora: string
  receita: number
  comissao: number
  roi_percentual: number
}

export interface ClienteViajando {
  cliente_id: string
  nome_cliente: string
  num_acompanhantes: number
  destino: string
  servico: string
  operadora: string
  data_checkin: string
  alerta: string
  tem_documentos: boolean
}

// Tipos para filtros
export interface FiltroReservas {
  periodo_inicio?: string
  periodo_fim?: string
  operadora?: string
  servico?: string
  destino?: string
  forma_pagamento?: string
  origem_cliente?: string
  status?: string
}

export interface FiltroBusca {
  termo: string
  campos: ('nome' | 'cpf' | 'codigo_reserva' | 'codigo_aereo' | 'destino')[]
}

// Tipos para permissões
export type TipoPermissao = 'admin' | 'comercial' | 'atendimento' | 'financeiro' | 'leitor'

export interface Usuario {
  id: string
  nome: string
  email: string
  permissao: TipoPermissao
  ativo: boolean
  created_at: string
  updated_at: string
}

// Tipos para webhooks
export interface WebhookEvent {
  evento: 'reserva_criada' | 'reserva_atualizada' | 'alerta_checkin'
  dados: any
  timestamp: string
}

// Tipos para cálculos
export interface CalculoComissao {
  valor_venda: number
  percentual_comissao: number
  comissao_calculada: number
}

export interface CalculoTicketMedio {
  valor_total: number
  num_clientes: number
  ticket_medio: number
}

export interface CalculoAlertaCheckin {
  data_checkin: string
  dias_restantes: number
  status: 'Hoje' | 'Amanhã' | 'Vermelho' | 'Verde' | 'Vencido' | ''
  cor: string
}