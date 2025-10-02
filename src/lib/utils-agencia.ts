import { Cliente, Reserva, Configuracao, Alerta, CalculoAlertaCheckin } from './types'

// Funções de formatação
export const formatCPF = (cpf: string | undefined | null): string => {
  if (!cpf || typeof cpf !== 'string') return ''
  // Remove todos os caracteres não numéricos primeiro
  const cleanCPF = cpf.replace(/\D/g, '')
  // Só formata se tiver 11 dígitos
  if (cleanCPF.length !== 11) return cpf
  return cleanCPF.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

export const formatPhone = (phone: string | undefined | null): string => {
  if (!phone || typeof phone !== 'string') return ''
  // Remove todos os caracteres não numéricos primeiro
  const cleanPhone = phone.replace(/\D/g, '')
  // Só formata se tiver o padrão esperado
  if (cleanPhone.length < 10) return phone
  return phone.replace(/(\+55)\s*(\d{2})\s*(\d{5})(\d{4})/, '$1 ($2) $3-$4')
}

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

export const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('pt-BR')
}

export const formatDateTime = (date: string): string => {
  return new Date(date).toLocaleString('pt-BR')
}

// Validações
export const validarCPF = (cpf: string): boolean => {
  const cleanCPF = cpf.replace(/\D/g, '')
  
  if (cleanCPF.length !== 11) return false
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false
  
  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i)
  }
  let remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(cleanCPF.charAt(9))) return false
  
  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i)
  }
  remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(cleanCPF.charAt(10))) return false
  
  return true
}

export const validarEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Cálculos de negócio
export const calcularComissao = (valorVenda: number, percentualComissao: number): number => {
  return Math.round(valorVenda * (percentualComissao / 100) * 100) / 100
}

export const calcularTicketMedio = (valorTotal: number, numClientes: number): number => {
  return numClientes > 0 ? Math.round((valorTotal / numClientes) * 100) / 100 : 0
}

export const calcularFidelidade = (numReservas: number): 'Bronze' | 'Prata' | 'Ouro' | 'Diamante' => {
  if (numReservas >= 8) return 'Diamante'
  if (numReservas >= 4) return 'Ouro'
  if (numReservas >= 2) return 'Prata'
  return 'Bronze'
}

export const calcularAlertaCheckin = (dataCheckin: string): CalculoAlertaCheckin => {
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  
  const checkin = new Date(dataCheckin)
  checkin.setHours(0, 0, 0, 0)
  
  const diasRestantes = Math.ceil((checkin.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))

  if (diasRestantes === 0) return { 
    data_checkin: dataCheckin, 
    dias_restantes: diasRestantes, 
    status: 'Hoje', 
    cor: 'bg-red-600' 
  }
  if (diasRestantes === 1) return { 
    data_checkin: dataCheckin, 
    dias_restantes: diasRestantes, 
    status: 'Amanhã', 
    cor: 'bg-orange-500' 
  }
  if (diasRestantes >= 2 && diasRestantes <= 7) return { 
    data_checkin: dataCheckin, 
    dias_restantes: diasRestantes, 
    status: `${diasRestantes} dias`, 
    cor: 'bg-red-500' 
  }
  if (diasRestantes >= 8 && diasRestantes <= 30) return { 
    data_checkin: dataCheckin, 
    dias_restantes: diasRestantes, 
    status: `${diasRestantes} dias`, 
    cor: 'bg-green-500' 
  }
  if (diasRestantes < 0) return { 
    data_checkin: dataCheckin, 
    dias_restantes: diasRestantes, 
    status: 'Vencida', 
    cor: 'bg-gray-500' 
  }
  
  return { 
    data_checkin: dataCheckin, 
    dias_restantes: diasRestantes, 
    status: `${diasRestantes} dias`, 
    cor: 'bg-gray-300' 
  }
}

// Funções de fidelidade
export const getFidelidadeColor = (status: string): string => {
  switch (status) {
    case 'Bronze': return 'bg-amber-600'
    case 'Prata': return 'bg-gray-400'
    case 'Ouro': return 'bg-yellow-500'
    case 'Diamante': return 'bg-blue-600'
    default: return 'bg-gray-400'
  }
}

// Funções de data
export const isClienteInativo = (ultimaCompra: string, diasAlerta: number): boolean => {
  if (!ultimaCompra) return true
  
  const hoje = new Date()
  const dataUltimaCompra = new Date(ultimaCompra)
  const diasInativo = Math.ceil((hoje.getTime() - dataUltimaCompra.getTime()) / (1000 * 60 * 60 * 24))
  
  return diasInativo >= diasAlerta
}

export const getProximosCheckIns = (reservas: Reserva[], dias: number): Reserva[] => {
  const hoje = new Date()
  const dataLimite = new Date()
  dataLimite.setDate(hoje.getDate() + dias)
  
  return reservas.filter(reserva => {
    const checkin = new Date(reserva.data_checkin)
    return checkin >= hoje && checkin <= dataLimite
  })
}

// Funções de filtro e busca
export const filtrarReservasPorPeriodo = (reservas: Reserva[], inicio: string, fim: string): Reserva[] => {
  const dataInicio = new Date(inicio)
  const dataFim = new Date(fim)
  
  return reservas.filter(reserva => {
    const dataCompra = new Date(reserva.data_compra)
    return dataCompra >= dataInicio && dataCompra <= dataFim
  })
}

export const buscarReservas = (reservas: Reserva[], clientes: Cliente[], termo: string): Reserva[] => {
  const termoLower = termo.toLowerCase()
  
  return reservas.filter(reserva => {
    const cliente = clientes.find(c => c.id === reserva.cliente_pagante_id)
    
    return (
      cliente?.nome_pagante.toLowerCase().includes(termoLower) ||
      cliente?.cpf.includes(termo) ||
      reserva.codigo_reserva.toLowerCase().includes(termoLower) ||
      reserva.codigo_aereo?.toLowerCase().includes(termoLower) ||
      reserva.destino.toLowerCase().includes(termoLower)
    )
  })
}

// Funções de relatório
export const calcularResumoMensal = (reservas: Reserva[], clientes: Cliente[], mes: number, ano: number) => {
  const reservasMes = reservas.filter(r => {
    const data = new Date(r.data_compra)
    return data.getMonth() + 1 === mes && data.getFullYear() === ano
  })
  
  const clientesUnicos = new Set(reservasMes.map(r => r.cliente_pagante_id))
  const valorVendido = reservasMes.reduce((acc, r) => acc + r.valor_venda, 0)
  const comissaoTotal = reservasMes.reduce((acc, r) => acc + (r.comissao_lancada_manual || r.comissao_calculada), 0)
  
  return {
    mes,
    ano,
    num_vendas: reservasMes.length,
    valor_vendido: valorVendido,
    comissao_total: comissaoTotal,
    ticket_medio: calcularTicketMedio(valorVendido, clientesUnicos.size)
  }
}

export const calcularOrigemVendas = (reservas: Reserva[], clientes: Cliente[]) => {
  const origens: Record<string, { quantidade: number; valor_total: number }> = {}
  
  reservas.forEach(reserva => {
    const cliente = clientes.find(c => c.id === reserva.cliente_pagante_id)
    if (cliente) {
      const origem = cliente.origem_cliente
      if (!origens[origem]) {
        origens[origem] = { quantidade: 0, valor_total: 0 }
      }
      origens[origem].quantidade++
      origens[origem].valor_total += reserva.valor_venda
    }
  })
  
  const total = Object.values(origens).reduce((acc, curr) => acc + curr.valor_total, 0)
  
  return Object.entries(origens).map(([origem, dados]) => ({
    origem,
    quantidade: dados.quantidade,
    valor_total: dados.valor_total,
    percentual: total > 0 ? Math.round((dados.valor_total / total) * 100) : 0
  }))
}

export const calcularROIOperadora = (reservas: Reserva[]) => {
  const operadoras: Record<string, { receita: number; comissao: number }> = {}
  
  reservas.forEach(reserva => {
    const operadora = reserva.operadora
    if (!operadoras[operadora]) {
      operadoras[operadora] = { receita: 0, comissao: 0 }
    }
    operadoras[operadora].receita += reserva.valor_venda
    operadoras[operadora].comissao += (reserva.comissao_lancada_manual || reserva.comissao_calculada)
  })
  
  return Object.entries(operadoras).map(([operadora, dados]) => ({
    operadora,
    receita: dados.receita,
    comissao: dados.comissao,
    roi_percentual: dados.receita > 0 ? Math.round((dados.comissao / dados.receita) * 100) : 0
  }))
}

// Funções de automação
export const recalcularAlertasCheckin = (reservas: Reserva[]): Reserva[] => {
  return reservas.map(reserva => {
    const alerta = calcularAlertaCheckin(reserva.data_checkin)
    return {
      ...reserva,
      alerta_checkin: alerta.status
    }
  })
}

export const marcarClientesInativos = (clientes: Cliente[], reservas: Reserva[], diasAlerta: number): Cliente[] => {
  return clientes.map(cliente => {
    const ultimaReserva = reservas
      .filter(r => r.cliente_pagante_id === cliente.id)
      .sort((a, b) => new Date(b.data_compra).getTime() - new Date(a.data_compra).getTime())[0]
    
    const inativo = ultimaReserva ? isClienteInativo(ultimaReserva.data_compra, diasAlerta) : true
    
    return {
      ...cliente,
      ativo: !inativo,
      data_ultima_compra: ultimaReserva?.data_compra
    }
  })
}

export const criarAlertasAutomaticos = (reservas: Reserva[], clientes: Cliente[]): Alerta[] => {
  const alertas: Alerta[] = []
  const hoje = new Date()
  
  // Alertas de check-in
  reservas.forEach(reserva => {
    const alerta = calcularAlertaCheckin(reserva.data_checkin)
    const cliente = clientes.find(c => c.id === reserva.cliente_pagante_id)
    
    if (alerta.status === 'Hoje' || alerta.status === 'Amanhã' || alerta.dias_restantes <= 7) {
      alertas.push({
        id: `checkin_${reserva.id}`,
        tipo: alerta.status === 'Hoje' ? 'checkin_hoje' : 
              alerta.status === 'Amanhã' ? 'checkin_amanha' : 'checkin_proximo',
        titulo: `Check-in ${alerta.status.toLowerCase()}`,
        descricao: `${cliente?.nome_pagante} - ${reserva.destino}`,
        prioridade: alerta.status === 'Hoje' ? 'alta' : 
                   alerta.status === 'Amanhã' ? 'media' : 'baixa',
        lido: false,
        data_criacao: hoje.toISOString(),
        dados_relacionados: { reserva_id: reserva.id, cliente_id: reserva.cliente_pagante_id }
      })
    }
  })
  
  return alertas
}

// Funções de export
export const exportarCSV = (dados: any[], nomeArquivo: string): void => {
  if (dados.length === 0) return
  
  const headers = Object.keys(dados[0])
  const csvContent = [
    headers.join(','),
    ...dados.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
  ].join('\n')
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', `${nomeArquivo}.csv`)
  link.style.visibility = 'hidden'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// Funções de storage
export const salvarLocalStorage = (chave: string, dados: any): void => {
  try {
    localStorage.setItem(chave, JSON.stringify(dados))
  } catch (error) {
    console.error('Erro ao salvar no localStorage:', error)
  }
}

export const carregarLocalStorage = <T>(chave: string, valorPadrao: T): T => {
  try {
    const dados = localStorage.getItem(chave)
    return dados ? JSON.parse(dados) : valorPadrao
  } catch (error) {
    console.error('Erro ao carregar do localStorage:', error)
    return valorPadrao
  }
}