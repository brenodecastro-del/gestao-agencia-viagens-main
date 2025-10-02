"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  DollarSign, 
  TrendingUp, 
  Target,
  Calendar,
  PieChart,
  BarChart3
} from 'lucide-react'
import { Cliente, Reserva, Configuracao } from '@/lib/types'
import { formatCurrency } from '@/lib/utils-agencia'

interface FinanceiroProps {
  clientes: Cliente[]
  reservas: Reserva[]
  config: Configuracao
}

export default function FinanceiroPage({ clientes, reservas, config }: FinanceiroProps) {
  const [periodoSelecionado, setPeriodoSelecionado] = useState('30') // dias
  const [anoMeta, setAnoMeta] = useState(new Date().getFullYear())
  const [mesMeta, setMesMeta] = useState(new Date().getMonth() + 1)
  const [isClient, setIsClient] = useState(false)
  
  // Marcar como cliente após hidratação
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Calcular dados financeiros
  const calcularDadosFinanceiros = () => {
    const hoje = new Date()
    const dataLimite = new Date()
    dataLimite.setDate(hoje.getDate() - parseInt(periodoSelecionado))
    
    // Filtrar reservas por período
    const reservasPeriodo = reservas.filter(r => new Date(r.data_compra) >= dataLimite)
    
    // Receita total
    const receita = reservasPeriodo.reduce((acc, r) => acc + r.valor_venda, 0)
    
    // Comissão total (calculada + manual)
    const comissao = reservasPeriodo.reduce((acc, r) => {
      return acc + (r.comissao_lancada_manual || r.comissao_calculada)
    }, 0)
    
    // Lucro líquido = Comissão (assumindo que a receita é do fornecedor)
    const lucroLiquido = comissao
    
    // Número de vendas
    const numVendas = reservasPeriodo.length
    
    // Ticket médio
    const clientesUnicos = new Set(reservasPeriodo.map(r => r.cliente_pagante_id))
    const ticketMedio = clientesUnicos.size > 0 ? receita / clientesUnicos.size : 0
    
    return {
      receita,
      comissao,
      lucroLiquido,
      numVendas,
      ticketMedio,
      reservasPeriodo
    }
  }
  
  // Calcular progresso das metas
  const calcularProgressoMetas = () => {
    // Filtrar reservas do mês/ano selecionado
    const reservasMeta = reservas.filter(r => {
      const data = new Date(r.data_compra)
      return data.getFullYear() === anoMeta && data.getMonth() + 1 === mesMeta
    })
    
    const valorAtual = reservasMeta.reduce((acc, r) => acc + r.valor_venda, 0)
    const comissaoAtual = reservasMeta.reduce((acc, r) => {
      return acc + (r.comissao_lancada_manual || r.comissao_calculada)
    }, 0)
    
    const progressoValor = config.metas_valor ? (valorAtual / config.metas_valor) * 100 : 0
    const progressoComissao = config.metas_comissao ? (comissaoAtual / config.metas_comissao) * 100 : 0
    
    return {
      valorAtual,
      comissaoAtual,
      progressoValor: Math.min(progressoValor, 100),
      progressoComissao: Math.min(progressoComissao, 100)
    }
  }
  
  // Calcular distribuição por forma de pagamento
  const calcularDistribuicaoPagamento = (reservasPeriodo: any[]) => {
    const distribuicao: Record<string, { quantidade: number; valor: number }> = {}
    
    reservasPeriodo.forEach(reserva => {
      const forma = reserva.forma_pagamento
      if (!distribuicao[forma]) {
        distribuicao[forma] = { quantidade: 0, valor: 0 }
      }
      distribuicao[forma].quantidade++
      distribuicao[forma].valor += reserva.valor_venda
    })
    
    return Object.entries(distribuicao).map(([forma, dados]) => ({
      forma,
      quantidade: dados.quantidade,
      valor: dados.valor,
      percentual: reservasPeriodo.length > 0 ? Math.round((dados.quantidade / reservasPeriodo.length) * 100) : 0
    }))
  }
  
  // Calcular evolução mensal
  const calcularEvolucaoMensal = () => {
    const mesesData: Record<string, { receita: number; comissao: number }> = {}
    
    reservas.forEach(reserva => {
      const data = new Date(reserva.data_compra)
      const chave = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`
      
      if (!mesesData[chave]) {
        mesesData[chave] = { receita: 0, comissao: 0 }
      }
      
      mesesData[chave].receita += reserva.valor_venda
      mesesData[chave].comissao += (reserva.comissao_lancada_manual || reserva.comissao_calculada)
    })
    
    return Object.entries(mesesData)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6) // Últimos 6 meses
      .map(([mes, dados]) => ({
        mes,
        ...dados
      }))
  }
  
  const dadosFinanceiros = calcularDadosFinanceiros()
  const progressoMetas = calcularProgressoMetas()
  const distribuicaoPagamento = calcularDistribuicaoPagamento(dadosFinanceiros.reservasPeriodo)
  const evolucaoMensal = calcularEvolucaoMensal()
  
  // Anos disponíveis
  const anosDisponiveis = [...new Set(reservas.map(r => new Date(r.data_compra).getFullYear()))].sort((a, b) => b - a)
  
  // Meses
  const meses = [
    { value: 1, label: 'Janeiro' },
    { value: 2, label: 'Fevereiro' },
    { value: 3, label: 'Março' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Maio' },
    { value: 6, label: 'Junho' },
    { value: 7, label: 'Julho' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Setembro' },
    { value: 10, label: 'Outubro' },
    { value: 11, label: 'Novembro' },
    { value: 12, label: 'Dezembro' }
  ]

  // Não renderizar até hidratação completa
  if (!isClient) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Gestão Financeira</h1>
          <p className="text-gray-500">Carregando dados...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Gestão Financeira</h1>
        <div className="flex gap-2">
          <Select value={periodoSelecionado} onValueChange={setPeriodoSelecionado}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
              <SelectItem value="365">Último ano</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPIs Financeiros */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-600" />
              Receita Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(dadosFinanceiros.receita)}
            </div>
            <p className="text-xs text-gray-500">Últimos {periodoSelecionado} dias</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              Comissão Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(dadosFinanceiros.comissao)}
            </div>
            <p className="text-xs text-gray-500">Calculada + Manual</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="w-4 h-4 text-purple-600" />
              Lucro Líquido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {formatCurrency(dadosFinanceiros.lucroLiquido)}
            </div>
            <p className="text-xs text-gray-500">= Comissão Total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-orange-600" />
              Nº Vendas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {dadosFinanceiros.numVendas}
            </div>
            <p className="text-xs text-gray-500">Reservas fechadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <PieChart className="w-4 h-4 text-indigo-600" />
              Ticket Médio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-600">
              {formatCurrency(dadosFinanceiros.ticketMedio)}
            </div>
            <p className="text-xs text-gray-500">Por cliente único</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Metas */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Progresso das Metas
            </CardTitle>
            <div className="flex gap-2">
              <Select value={anoMeta.toString()} onValueChange={(value) => setAnoMeta(parseInt(value))}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {anosDisponiveis.map(ano => (
                    <SelectItem key={ano} value={ano.toString()}>{ano}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={mesMeta.toString()} onValueChange={(value) => setMesMeta(parseInt(value))}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {meses.map(mes => (
                    <SelectItem key={mes.value} value={mes.value.toString()}>{mes.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Meta de Valor */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Meta de Valor</span>
                <span className="text-sm text-gray-500">
                  {formatCurrency(progressoMetas.valorAtual)} / {formatCurrency(config.metas_valor || 0)}
                </span>
              </div>
              <Progress value={progressoMetas.progressoValor} className="h-3" />
              <div className="flex justify-between items-center mt-1">
                <span className="text-xs text-gray-500">
                  {progressoMetas.progressoValor.toFixed(1)}% atingido
                </span>
                <Badge 
                  className={`${
                    progressoMetas.progressoValor >= 100 ? 'bg-green-600' :
                    progressoMetas.progressoValor >= 80 ? 'bg-yellow-600' :
                    'bg-red-600'
                  } text-white`}
                >
                  {progressoMetas.progressoValor >= 100 ? 'Atingida!' : 
                   progressoMetas.progressoValor >= 80 ? 'Quase lá' : 'Em andamento'}
                </Badge>
              </div>
            </div>

            {/* Meta de Comissão */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Meta de Comissão</span>
                <span className="text-sm text-gray-500">
                  {formatCurrency(progressoMetas.comissaoAtual)} / {formatCurrency(config.metas_comissao || 0)}
                </span>
              </div>
              <Progress value={progressoMetas.progressoComissao} className="h-3" />
              <div className="flex justify-between items-center mt-1">
                <span className="text-xs text-gray-500">
                  {progressoMetas.progressoComissao.toFixed(1)}% atingido
                </span>
                <Badge 
                  className={`${
                    progressoMetas.progressoComissao >= 100 ? 'bg-green-600' :
                    progressoMetas.progressoComissao >= 80 ? 'bg-yellow-600' :
                    'bg-red-600'
                  } text-white`}
                >
                  {progressoMetas.progressoComissao >= 100 ? 'Atingida!' : 
                   progressoMetas.progressoComissao >= 80 ? 'Quase lá' : 'Em andamento'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Distribuição por Forma de Pagamento */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              Formas de Pagamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {distribuicaoPagamento.map((forma, index) => (
                <div key={forma.forma} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: `hsl(${index * 60}, 70%, 50%)` }}
                    />
                    <div>
                      <p className="font-medium">{forma.forma}</p>
                      <p className="text-sm text-gray-500">{forma.quantidade} transações</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatCurrency(forma.valor)}</p>
                    <p className="text-sm text-gray-500">{forma.percentual}%</p>
                  </div>
                </div>
              ))}
              
              {distribuicaoPagamento.length === 0 && (
                <p className="text-center text-gray-500 py-4">Nenhuma transação no período</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Evolução Mensal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Evolução dos Últimos 6 Meses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {evolucaoMensal.map((mes, index) => {
              const [ano, mesNum] = mes.mes.split('-')
              const nomeMes = meses.find(m => m.value === parseInt(mesNum))?.label || mesNum
              
              return (
                <div key={mes.mes} className="text-center p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">{nomeMes}/{ano}</h4>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-gray-600">Receita</p>
                      <p className="font-bold text-green-600">{formatCurrency(mes.receita)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Comissão</p>
                      <p className="font-bold text-blue-600">{formatCurrency(mes.comissao)}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          
          {evolucaoMensal.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">Nenhum dado disponível para exibir a evolução</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}