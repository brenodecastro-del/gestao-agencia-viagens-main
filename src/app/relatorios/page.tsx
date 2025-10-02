"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { 
  FileBarChart, 
  Download, 
  PieChart, 
  BarChart3, 
  TrendingUp,
  Calendar,
  Users,
  DollarSign,
  Target,
  Filter,
  Search,
  FileText,
  Plus
} from 'lucide-react'

// Importação dinâmica dos componentes de gráfico
import dynamic from 'next/dynamic'

const RechartsPieChart = dynamic(() => import('recharts').then(mod => mod.PieChart), { ssr: false })
const Pie = dynamic(() => import('recharts').then(mod => mod.Pie), { ssr: false })
const Cell = dynamic(() => import('recharts').then(mod => mod.Cell), { ssr: false })
const ResponsiveContainer = dynamic(() => import('recharts').then(mod => mod.ResponsiveContainer), { ssr: false })
const BarChart = dynamic(() => import('recharts').then(mod => mod.BarChart), { ssr: false })
const Bar = dynamic(() => import('recharts').then(mod => mod.Bar), { ssr: false })
const XAxis = dynamic(() => import('recharts').then(mod => mod.XAxis), { ssr: false })
const YAxis = dynamic(() => import('recharts').then(mod => mod.YAxis), { ssr: false })
const CartesianGrid = dynamic(() => import('recharts').then(mod => mod.CartesianGrid), { ssr: false })
const Tooltip = dynamic(() => import('recharts').then(mod => mod.Tooltip), { ssr: false })
const Legend = dynamic(() => import('recharts').then(mod => mod.Legend), { ssr: false })

// Dados mock para demonstração
const mockReservas = [
  {
    id: '1',
    cliente_nome: 'João Silva',
    data_compra: '2024-01-15',
    operadora: 'CVC',
    servico: 'Pacote Completo',
    destino: 'Cancún',
    valor_venda: 5000,
    comissao_calculada: 500,
    comissao_lancada_manual: 0,
    origem_cliente: 'Indicação',
    data_checkin: '2024-02-15'
  },
  {
    id: '2',
    cliente_nome: 'Maria Santos',
    data_compra: '2024-01-20',
    operadora: 'Azul Viagens',
    servico: 'Hospedagem',
    destino: 'Rio de Janeiro',
    valor_venda: 2500,
    comissao_calculada: 250,
    comissao_lancada_manual: 50,
    origem_cliente: 'Site',
    data_checkin: '2024-03-10'
  },
  {
    id: '3',
    cliente_nome: 'Pedro Costa',
    data_compra: '2024-02-01',
    operadora: 'Decolar',
    servico: 'Passagem Aérea',
    destino: 'São Paulo',
    valor_venda: 800,
    comissao_calculada: 80,
    comissao_lancada_manual: 0,
    origem_cliente: 'WhatsApp',
    data_checkin: '2024-02-20'
  }
]

const mockClientes = [
  {
    id: '1',
    nome: 'João Silva',
    cpf: '123.456.789-00',
    ultima_compra: '2024-01-15',
    proxima_viagem: '2024-02-15',
    dias_sem_compra: 45
  },
  {
    id: '2',
    nome: 'Maria Santos',
    cpf: '987.654.321-00',
    ultima_compra: '2024-01-20',
    proxima_viagem: '2024-03-10',
    dias_sem_compra: 40
  }
]

export default function RelatoriosPage() {
  const [isClient, setIsClient] = useState(false)
  const [filtros, setFiltros] = useState({
    periodo: '30',
    operadora: '',
    servico: '',
    destino: '',
    forma_pagamento: '',
    origem_cliente: ''
  })
  
  const [busca, setBusca] = useState('')
  const [dadosResumo, setDadosResumo] = useState({
    num_vendas: 0,
    valor_vendido: 0,
    comissao_total: 0,
    ticket_medio: 0
  })

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Calcular dados do resumo
  useEffect(() => {
    if (isClient) {
      const num_vendas = mockReservas.length
      const valor_vendido = mockReservas.reduce((acc, r) => acc + r.valor_venda, 0)
      const comissao_total = mockReservas.reduce((acc, r) => acc + r.comissao_calculada + (r.comissao_lancada_manual || 0), 0)
      const ticket_medio = valor_vendido / num_vendas || 0

      setDadosResumo({
        num_vendas,
        valor_vendido,
        comissao_total,
        ticket_medio
      })
    }
  }, [isClient])

  // Dados para gráficos
  const dadosOrigemVendas = [
    { origem: 'Indicação', contagem: 1, valor: 5000 },
    { origem: 'Site', contagem: 1, valor: 2500 },
    { origem: 'WhatsApp', contagem: 1, valor: 800 }
  ]

  const dadosROI = mockReservas.map(r => ({
    operadora: r.operadora,
    servico: r.servico,
    receita: r.valor_venda,
    comissao: r.comissao_calculada + (r.comissao_lancada_manual || 0),
    roi: ((r.comissao_calculada + (r.comissao_lancada_manual || 0)) / r.valor_venda * 100).toFixed(2)
  }))

  const clientesProximasViagens = mockClientes.filter(c => {
    const proximaViagem = new Date(c.proxima_viagem)
    const hoje = new Date()
    const diff = (proximaViagem.getTime() - hoje.getTime()) / (1000 * 3600 * 24)
    return diff <= 30 && diff >= 0
  })

  const clientesInativos = mockClientes.filter(c => c.dias_sem_compra >= 30)

  const exportarCSV = (dados: any[], nomeArquivo: string) => {
    const headers = Object.keys(dados[0]).join(',')
    const csv = [headers, ...dados.map(row => Object.values(row).join(','))].join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${nomeArquivo}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

  if (!isClient) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Carregando relatórios...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Relatórios</h1>
            <p className="text-gray-600">Análises e relatórios detalhados do seu negócio</p>
          </div>
          <Button onClick={() => exportarCSV([dadosResumo], 'resumo-geral')}>
            <Download className="w-4 h-4 mr-2" />
            Exportar Resumo
          </Button>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtros e Busca
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-4">
              <div>
                <Label>Período (dias)</Label>
                <Select value={filtros.periodo} onValueChange={(value) => setFiltros({...filtros, periodo: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 dias</SelectItem>
                    <SelectItem value="30">30 dias</SelectItem>
                    <SelectItem value="90">90 dias</SelectItem>
                    <SelectItem value="365">1 ano</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Operadora</Label>
                <Select value={filtros.operadora} onValueChange={(value) => setFiltros({...filtros, operadora: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CVC">CVC</SelectItem>
                    <SelectItem value="Azul Viagens">Azul Viagens</SelectItem>
                    <SelectItem value="Decolar">Decolar</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Serviço</Label>
                <Select value={filtros.servico} onValueChange={(value) => setFiltros({...filtros, servico: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pacote Completo">Pacote Completo</SelectItem>
                    <SelectItem value="Hospedagem">Hospedagem</SelectItem>
                    <SelectItem value="Passagem Aérea">Passagem Aérea</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Origem Cliente</Label>
                <Select value={filtros.origem_cliente} onValueChange={(value) => setFiltros({...filtros, origem_cliente: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Indicação">Indicação</SelectItem>
                    <SelectItem value="Site">Site</SelectItem>
                    <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2">
                <Label>Busca</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Nome, CPF, código..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="resumo" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="resumo">Resumo Geral</TabsTrigger>
            <TabsTrigger value="origem">Origem Vendas</TabsTrigger>
            <TabsTrigger value="roi">ROI Operadoras</TabsTrigger>
            <TabsTrigger value="viagens">Próximas Viagens</TabsTrigger>
            <TabsTrigger value="inativos">Clientes Inativos</TabsTrigger>
          </TabsList>

          {/* Resumo Mensal/Anual */}
          <TabsContent value="resumo">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Nº Vendas</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dadosResumo.num_vendas}</div>
                  <p className="text-xs text-muted-foreground">vendas realizadas</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Valor Vendido</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">R$ {dadosResumo.valor_vendido.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">em vendas totais</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Comissão Total</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">R$ {dadosResumo.comissao_total.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">em comissões</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">R$ {dadosResumo.ticket_medio.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">por cliente</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Detalhamento das Vendas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-end mb-4">
                  <Button onClick={() => exportarCSV(mockReservas, 'detalhamento-vendas')}>
                    <Download className="w-4 h-4 mr-2" />
                    Exportar CSV
                  </Button>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Data Compra</TableHead>
                      <TableHead>Operadora</TableHead>
                      <TableHead>Serviço</TableHead>
                      <TableHead>Destino</TableHead>
                      <TableHead>Valor Venda</TableHead>
                      <TableHead>Comissão</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockReservas.map((reserva) => (
                      <TableRow key={reserva.id}>
                        <TableCell>{reserva.cliente_nome}</TableCell>
                        <TableCell>{new Date(reserva.data_compra).toLocaleDateString()}</TableCell>
                        <TableCell>{reserva.operadora}</TableCell>
                        <TableCell>{reserva.servico}</TableCell>
                        <TableCell>{reserva.destino}</TableCell>
                        <TableCell>R$ {reserva.valor_venda.toLocaleString()}</TableCell>
                        <TableCell>R$ {(reserva.comissao_calculada + (reserva.comissao_lancada_manual || 0)).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Origem das Vendas */}
          <TabsContent value="origem">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Distribuição por Origem</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
                      <Pie
                        data={dadosOrigemVendas}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ origem, value }) => `${origem}: R$ ${value.toLocaleString()}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="valor"
                      >
                        {dadosOrigemVendas.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Vendas por Origem</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={dadosOrigemVendas}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="origem" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="contagem" fill="#8884d8" name="Quantidade" />
                      <Bar dataKey="valor" fill="#82ca9d" name="Valor (R$)" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Tabela Detalhada por Origem</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-end mb-4">
                  <Button onClick={() => exportarCSV(dadosOrigemVendas, 'origem-vendas')}>
                    <Download className="w-4 h-4 mr-2" />
                    Exportar CSV
                  </Button>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Origem</TableHead>
                      <TableHead>Quantidade</TableHead>
                      <TableHead>Valor Total</TableHead>
                      <TableHead>Percentual</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dadosOrigemVendas.map((item) => (
                      <TableRow key={item.origem}>
                        <TableCell>{item.origem}</TableCell>
                        <TableCell>{item.contagem}</TableCell>
                        <TableCell>R$ {item.valor.toLocaleString()}</TableCell>
                        <TableCell>{((item.valor / dadosResumo.valor_vendido) * 100).toFixed(1)}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ROI por Operadora */}
          <TabsContent value="roi">
            <Card>
              <CardHeader>
                <CardTitle>ROI por Operadora e Serviço</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-end mb-4">
                  <Button onClick={() => exportarCSV(dadosROI, 'roi-operadoras')}>
                    <Download className="w-4 h-4 mr-2" />
                    Exportar CSV
                  </Button>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Operadora</TableHead>
                      <TableHead>Serviço</TableHead>
                      <TableHead>Receita</TableHead>
                      <TableHead>Comissão</TableHead>
                      <TableHead>ROI (%)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dadosROI.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.operadora}</TableCell>
                        <TableCell>{item.servico}</TableCell>
                        <TableCell>R$ {item.receita.toLocaleString()}</TableCell>
                        <TableCell>R$ {item.comissao.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={parseFloat(item.roi) >= 10 ? "default" : "secondary"}>
                            {item.roi}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Clientes Próximas Viagens */}
          <TabsContent value="viagens">
            <Card>
              <CardHeader>
                <CardTitle>Clientes Viajando nos Próximos 30 Dias</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-end mb-4">
                  <Button onClick={() => exportarCSV(clientesProximasViagens, 'proximas-viagens')}>
                    <Download className="w-4 h-4 mr-2" />
                    Exportar CSV
                  </Button>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>CPF</TableHead>
                      <TableHead>Próxima Viagem</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clientesProximasViagens.map((cliente) => {
                      const diasRestantes = Math.ceil((new Date(cliente.proxima_viagem).getTime() - new Date().getTime()) / (1000 * 3600 * 24))
                      return (
                        <TableRow key={cliente.id}>
                          <TableCell>{cliente.nome}</TableCell>
                          <TableCell>{cliente.cpf}</TableCell>
                          <TableCell>{new Date(cliente.proxima_viagem).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Badge variant={diasRestantes <= 7 ? "destructive" : "default"}>
                              {diasRestantes} dias
                            </Badge>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Clientes Inativos */}
          <TabsContent value="inativos">
            <Card>
              <CardHeader>
                <CardTitle>Clientes sem Compra há mais de 30 dias</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-end mb-4">
                  <Button onClick={() => exportarCSV(clientesInativos, 'clientes-inativos')}>
                    <Download className="w-4 h-4 mr-2" />
                    Exportar CSV
                  </Button>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>CPF</TableHead>
                      <TableHead>Última Compra</TableHead>
                      <TableHead>Dias sem Compra</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clientesInativos.map((cliente) => (
                      <TableRow key={cliente.id}>
                        <TableCell>{cliente.nome}</TableCell>
                        <TableCell>{cliente.cpf}</TableCell>
                        <TableCell>{new Date(cliente.ultima_compra).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge variant="destructive">
                            {cliente.dias_sem_compra} dias
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline">
                            <Plus className="w-4 h-4 mr-2" />
                            Criar Tarefa
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}