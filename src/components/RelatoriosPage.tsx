"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { 
  TrendingUp, 
  DollarSign, 
  Target,
  Download,
  Calendar,
  PieChart,
  BarChart3,
  FileText
} from 'lucide-react'
import { Cliente, Reserva, Configuracao } from '@/lib/types'
import { 
  formatCurrency, 
  calcularResumoMensal,
  calcularOrigemVendas,
  calcularROIOperadora,
  exportarCSV 
} from '@/lib/utils-agencia'

interface RelatoriosProps {
  clientes: Cliente[]
  reservas: Reserva[]
  config: Configuracao
}

export default function RelatoriosPage({ clientes, reservas, config }: RelatoriosProps) {
  const [periodoTipo, setPeriodoTipo] = useState<'mensal' | 'anual'>('mensal')
  const [anoSelecionado, setAnoSelecionado] = useState(new Date().getFullYear())
  const [mesSelecionado, setMesSelecionado] = useState(new Date().getMonth() + 1)
  const [filtroOrigem, setFiltroOrigem] = useState('')

  // Dados calculados
  const [resumoMensal, setResumoMensal] = useState<any>(null)
  const [origemVendas, setOrigemVendas] = useState<any[]>([])
  const [roiOperadoras, setRoiOperadoras] = useState<any[]>([])

  // Calcular dados quando filtros mudarem
  useEffect(() => {
    // Filtrar reservas por período
    let reservasFiltradas = reservas
    
    if (periodoTipo === 'mensal') {
      reservasFiltradas = reservas.filter(r => {
        const data = new Date(r.data_compra)
        return data.getFullYear() === anoSelecionado && data.getMonth() + 1 === mesSelecionado
      })
    } else {
      reservasFiltradas = reservas.filter(r => {
        const data = new Date(r.data_compra)
        return data.getFullYear() === anoSelecionado
      })
    }

    // Calcular resumo
    if (periodoTipo === 'mensal') {
      const resumo = calcularResumoMensal(reservasFiltradas, clientes, mesSelecionado, anoSelecionado)
      setResumoMensal(resumo)
    } else {
      // Calcular resumo anual
      const clientesUnicos = new Set(reservasFiltradas.map(r => r.cliente_pagante_id))
      const valorVendido = reservasFiltradas.reduce((acc, r) => acc + r.valor_venda, 0)
      const comissaoTotal = reservasFiltradas.reduce((acc, r) => acc + (r.comissao_lancada_manual || r.comissao_calculada), 0)
      
      setResumoMensal({
        ano: anoSelecionado,
        num_vendas: reservasFiltradas.length,
        valor_vendido: valorVendido,
        comissao_total: comissaoTotal,
        ticket_medio: clientesUnicos.size > 0 ? valorVendido / clientesUnicos.size : 0
      })
    }

    // Calcular origem das vendas
    const origens = calcularOrigemVendas(reservasFiltradas, clientes)
    setOrigemVendas(origens)

    // Calcular ROI por operadora
    const roi = calcularROIOperadora(reservasFiltradas)
    setRoiOperadoras(roi)
  }, [reservas, clientes, periodoTipo, anoSelecionado, mesSelecionado])

  // Filtrar origem das vendas
  const origensVendasFiltradas = filtroOrigem 
    ? origemVendas.filter(o => o.origem === filtroOrigem)
    : origemVendas

  // Clientes inativos
  const clientesInativos = clientes.filter(c => {
    const ultimaReserva = reservas
      .filter(r => r.cliente_pagante_id === c.id)
      .sort((a, b) => new Date(b.data_compra).getTime() - new Date(a.data_compra).getTime())[0]
    
    if (!ultimaReserva) return true
    
    const hoje = new Date()
    const dataUltimaCompra = new Date(ultimaReserva.data_compra)
    const diasInativo = Math.ceil((hoje.getTime() - dataUltimaCompra.getTime()) / (1000 * 60 * 60 * 24))
    
    return diasInativo >= config.dias_alerta_inatividade
  })

  // Funções de export
  const exportarResumo = () => {
    if (!resumoMensal) return
    
    const dados = [resumoMensal]
    exportarCSV(dados, `resumo-${periodoTipo}-${anoSelecionado}${periodoTipo === 'mensal' ? `-${mesSelecionado}` : ''}`)
  }

  const exportarOrigens = () => {
    exportarCSV(origensVendasFiltradas, `origem-vendas-${anoSelecionado}`)
  }

  const exportarROI = () => {
    exportarCSV(roiOperadoras, `roi-operadoras-${anoSelecionado}`)
  }

  const exportarClientesInativos = () => {
    const dados = clientesInativos.map(cliente => {
      const ultimaReserva = reservas
        .filter(r => r.cliente_pagante_id === cliente.id)
        .sort((a, b) => new Date(b.data_compra).getTime() - new Date(a.data_compra).getTime())[0]
      
      const diasInativo = ultimaReserva 
        ? Math.ceil((new Date().getTime() - new Date(ultimaReserva.data_compra).getTime()) / (1000 * 60 * 60 * 24))
        : 999
      
      return {
        'Nome': cliente.nome_pagante,
        'Email': cliente.email,
        'Telefone': cliente.telefone,
        'Origem': cliente.origem_cliente,
        'Última Compra': ultimaReserva ? new Date(ultimaReserva.data_compra).toLocaleDateString('pt-BR') : 'Nunca',
        'Dias Inativo': diasInativo,
        'Valor Total': formatCurrency(cliente.historico_compras.valor_total),
        'Num Reservas': cliente.historico_compras.num_reservas
      }
    })
    
    exportarCSV(dados, 'clientes-inativos')
  }

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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Relatórios</h1>
        <div className="flex gap-2">
          <Select value={periodoTipo} onValueChange={(value: 'mensal' | 'anual') => setPeriodoTipo(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mensal">Mensal</SelectItem>
              <SelectItem value="anual">Anual</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={anoSelecionado.toString()} onValueChange={(value) => setAnoSelecionado(parseInt(value))}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {anosDisponiveis.map(ano => (
                <SelectItem key={ano} value={ano.toString()}>{ano}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {periodoTipo === 'mensal' && (
            <Select value={mesSelecionado.toString()} onValueChange={(value) => setMesSelecionado(parseInt(value))}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {meses.map(mes => (
                  <SelectItem key={mes.value} value={mes.value.toString()}>{mes.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Resumo Mensal/Anual */}
      {resumoMensal && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Resumo {periodoTipo === 'mensal' ? 'Mensal' : 'Anual'}
            </CardTitle>
            <Button onClick={exportarResumo} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <Target className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                <p className="text-sm text-gray-600">Nº Vendas</p>
                <p className="text-2xl font-bold">{resumoMensal.num_vendas}</p>
              </div>
              
              <div className="text-center p-4 border rounded-lg">
                <DollarSign className="w-8 h-8 mx-auto mb-2 text-green-600" />
                <p className="text-sm text-gray-600">Valor Vendido</p>
                <p className="text-2xl font-bold">{formatCurrency(resumoMensal.valor_vendido)}</p>
              </div>
              
              <div className="text-center p-4 border rounded-lg">
                <TrendingUp className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                <p className="text-sm text-gray-600">Comissão Total</p>
                <p className="text-2xl font-bold">{formatCurrency(resumoMensal.comissao_total)}</p>
              </div>
              
              <div className="text-center p-4 border rounded-lg">
                <Target className="w-8 h-8 mx-auto mb-2 text-orange-600" />
                <p className="text-sm text-gray-600">Ticket Médio</p>
                <p className="text-2xl font-bold">{formatCurrency(resumoMensal.ticket_medio)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Origem das Vendas */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              Origem das Vendas
            </CardTitle>
            <div className="flex gap-2">
              <Select value={filtroOrigem} onValueChange={setFiltroOrigem}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Todas as origens" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas as origens</SelectItem>
                  {config.origens_clientes.map(origem => (
                    <SelectItem key={origem} value={origem}>{origem}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={exportarOrigens} variant="outline" size="sm">
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {origensVendasFiltradas.map((origem, index) => (
                <div key={origem.origem} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: `hsl(${index * 45}, 70%, 50%)` }}
                    />
                    <div>
                      <p className="font-medium">{origem.origem}</p>
                      <p className="text-sm text-gray-500">{origem.quantidade} vendas</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatCurrency(origem.valor_total)}</p>
                    <p className="text-sm text-gray-500">{origem.percentual}%</p>
                  </div>
                </div>
              ))}
              
              {origensVendasFiltradas.length === 0 && (
                <p className="text-center text-gray-500 py-4">Nenhuma venda encontrada no período</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ROI por Operadora */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              ROI por Operadora
            </CardTitle>
            <Button onClick={exportarROI} variant="outline" size="sm">
              <Download className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {roiOperadoras.map((operadora, index) => (
                <div key={operadora.operadora} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{operadora.operadora}</h4>
                    <Badge 
                      className={`${
                        operadora.roi_percentual >= 15 ? 'bg-green-600' :
                        operadora.roi_percentual >= 10 ? 'bg-yellow-600' :
                        'bg-red-600'
                      } text-white`}
                    >
                      {operadora.roi_percentual}% ROI
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Receita</p>
                      <p className="font-medium">{formatCurrency(operadora.receita)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Comissão</p>
                      <p className="font-medium">{formatCurrency(operadora.comissao)}</p>
                    </div>
                  </div>
                </div>
              ))}
              
              {roiOperadoras.length === 0 && (
                <p className="text-center text-gray-500 py-4">Nenhuma operadora encontrada no período</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Clientes Inativos */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Clientes Inativos ({clientesInativos.length})
          </CardTitle>
          <Button onClick={exportarClientesInativos} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Lista
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            Clientes sem compras há mais de {config.dias_alerta_inatividade} dias
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clientesInativos.slice(0, 6).map(cliente => {
              const ultimaReserva = reservas
                .filter(r => r.cliente_pagante_id === cliente.id)
                .sort((a, b) => new Date(b.data_compra).getTime() - new Date(a.data_compra).getTime())[0]
              
              const diasInativo = ultimaReserva 
                ? Math.ceil((new Date().getTime() - new Date(ultimaReserva.data_compra).getTime()) / (1000 * 60 * 60 * 24))
                : 999
              
              return (
                <div key={cliente.id} className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">{cliente.nome_pagante}</h4>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>Origem: {cliente.origem_cliente}</p>
                    <p>LTV: {formatCurrency(cliente.historico_compras.valor_total)}</p>
                    <p>Inativo há: {diasInativo} dias</p>
                  </div>
                  <Button size="sm" className="mt-3 w-full" variant="outline">
                    Criar Follow-up
                  </Button>
                </div>
              )
            })}
          </div>
          
          {clientesInativos.length > 6 && (
            <div className="text-center mt-4">
              <p className="text-gray-500">E mais {clientesInativos.length - 6} clientes inativos...</p>
            </div>
          )}
          
          {clientesInativos.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">Parabéns! Nenhum cliente inativo encontrado.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}