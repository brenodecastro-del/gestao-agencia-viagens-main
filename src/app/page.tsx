"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { 
  Settings, 
  Users, 
  Calendar, 
  FileText, 
  Building2, 
  DollarSign, 
  BarChart3, 
  FileBarChart, 
  Bell,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  Download,
  Upload,
  Plane,
  Hotel,
  MapPin,
  Phone,
  Mail,
  User,
  CreditCard,
  Star,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  PieChart,
  Calendar as CalendarIcon,
  Eye,
  UserPlus,
  FileUp,
  Target,
  Award,
  Activity,
  ExternalLink
} from 'lucide-react'
import Link from 'next/link'

// Importar componentes
import ClienteForm from '@/components/forms/ClienteForm'
import ReservaForm from '@/components/forms/ReservaForm'
import ConfigForm from '@/components/forms/ConfigForm'
import ClientesViajandoPage from '@/components/ClientesViajandoPage'
import RelatoriosPage from '@/components/RelatoriosPage'
import FinanceiroPage from '@/components/FinanceiroPage'

// Importar tipos e dados
import { Cliente, Reserva, Configuracao, Alerta } from '@/lib/types'
import { 
  formatCPF, 
  formatPhone, 
  formatCurrency, 
  formatDate,
  calcularFidelidade,
  calcularAlertaCheckin,
  getFidelidadeColor,
  isClienteInativo,
  getProximosCheckIns,
  criarAlertasAutomaticos,
  recalcularAlertasCheckin,
  marcarClientesInativos,
  salvarLocalStorage,
  carregarLocalStorage
} from '@/lib/utils-agencia'
import { configInicial, clientesSeed, reservasSeed, fornecedoresSeed } from '@/lib/seed-data'

export default function GestaoAgenciaViagens() {
  const [activeModule, setActiveModule] = useState('dashboard')
  const [config, setConfig] = useState<Configuracao>(configInicial)
  const [clientes, setClientes] = useState<Cliente[]>(clientesSeed)
  const [reservas, setReservas] = useState<Reserva[]>(reservasSeed)
  const [alertas, setAlertas] = useState<Alerta[]>([])
  const [showDialog, setShowDialog] = useState(false)
  const [dialogType, setDialogType] = useState<'cliente' | 'reserva' | 'reserva-manual' | 'config'>('cliente')
  const [editingItem, setEditingItem] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filtroOrigem, setFiltroOrigem] = useState('')
  const [filtroFidelidade, setFiltroFidelidade] = useState('')
  const [periodoKPI, setPeriodoKPI] = useState('30') // dias
  const [isClient, setIsClient] = useState(false)

  // Marcar como cliente após hidratação
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Carregar dados do localStorage apenas no cliente
  useEffect(() => {
    if (!isClient) return

    const savedConfig = carregarLocalStorage('agencia_config', configInicial)
    const savedClientes = carregarLocalStorage('agencia_clientes', clientesSeed)
    const savedReservas = carregarLocalStorage('agencia_reservas', reservasSeed)
    const savedAlertas = carregarLocalStorage('agencia_alertas', [])

    setConfig(savedConfig)
    setClientes(savedClientes)
    setReservas(savedReservas)
    setAlertas(savedAlertas)
  }, [isClient])

  // Salvar dados no localStorage
  useEffect(() => {
    if (!isClient) return
    salvarLocalStorage('agencia_config', config)
  }, [config, isClient])

  useEffect(() => {
    if (!isClient) return
    salvarLocalStorage('agencia_clientes', clientes)
  }, [clientes, isClient])

  useEffect(() => {
    if (!isClient) return
    salvarLocalStorage('agencia_reservas', reservas)
  }, [reservas, isClient])

  useEffect(() => {
    if (!isClient) return
    salvarLocalStorage('agencia_alertas', alertas)
  }, [alertas, isClient])

  // Automação diária (simulada) - apenas no cliente
  useEffect(() => {
    if (!isClient) return

    const executarAutomacaoDiaria = () => {
      // 1. Recalcular alertas de check-in
      const reservasAtualizadas = recalcularAlertasCheckin(reservas)
      if (JSON.stringify(reservasAtualizadas) !== JSON.stringify(reservas)) {
        setReservas(reservasAtualizadas)
      }

      // 2. Marcar clientes inativos
      const clientesAtualizados = marcarClientesInativos(clientes, reservas, config.dias_alerta_inatividade)
      if (JSON.stringify(clientesAtualizados) !== JSON.stringify(clientes)) {
        setClientes(clientesAtualizados)
      }

      // 3. Criar alertas automáticos
      const novosAlertas = criarAlertasAutomaticos(reservas, clientes)
      if (novosAlertas.length > 0) {
        setAlertas(prev => [...prev.filter(a => !a.lido), ...novosAlertas])
      }
    }

    // Executar na inicialização com delay para evitar loops
    const timeoutId = setTimeout(executarAutomacaoDiaria, 1000)
    
    return () => clearTimeout(timeoutId)
  }, [isClient, config.dias_alerta_inatividade])

  // Automação on create/update de reserva
  const atualizarStatusFidelidade = (clienteId: string) => {
    const reservasCliente = reservas.filter(r => r.cliente_pagante_id === clienteId)
    const novoStatus = calcularFidelidade(reservasCliente.length)
    
    setClientes(prev => prev.map(c => 
      c.id === clienteId 
        ? { ...c, status_fidelidade: novoStatus }
        : c
    ))
  }

  // Funções de CRUD
  const handleSaveCliente = (clienteData: Omit<Cliente, 'id' | 'created_at' | 'updated_at'>) => {
    const now = new Date().toISOString()
    
    if (editingItem) {
      // Editar cliente existente
      setClientes(clientes.map(c => 
        c.id === editingItem.id 
          ? { ...clienteData, id: editingItem.id, created_at: editingItem.created_at, updated_at: now }
          : c
      ))
    } else {
      // Criar novo cliente
      const novoCliente: Cliente = {
        ...clienteData,
        id: Date.now().toString(),
        created_at: now,
        updated_at: now
      }
      setClientes([...clientes, novoCliente])
    }
    
    setShowDialog(false)
    setEditingItem(null)
  }

  const handleSaveReserva = (reservaData: Omit<Reserva, 'id' | 'created_at' | 'updated_at'>) => {
    const now = new Date().toISOString()
    
    if (editingItem) {
      // Editar reserva existente
      setReservas(reservas.map(r => 
        r.id === editingItem.id 
          ? { ...reservaData, id: editingItem.id, created_at: editingItem.created_at, updated_at: now }
          : r
      ))
    } else {
      // Criar nova reserva
      const novaReserva: Reserva = {
        ...reservaData,
        id: Date.now().toString(),
        created_at: now,
        updated_at: now
      }
      setReservas([...reservas, novaReserva])
    }
    
    // Atualizar status de fidelidade do cliente
    atualizarStatusFidelidade(reservaData.cliente_pagante_id)
    
    // Criar alerta se check-in <= 7 dias
    const alerta = calcularAlertaCheckin(reservaData.data_checkin)
    if (alerta.status === 'Hoje' || alerta.status === 'Amanhã' || alerta.status === 'Vermelho') {
      const cliente = clientes.find(c => c.id === reservaData.cliente_pagante_id)
      const novoAlerta: Alerta = {
        id: `checkin_${Date.now()}`,
        tipo: alerta.status === 'Hoje' ? 'checkin_hoje' : 
              alerta.status === 'Amanhã' ? 'checkin_amanha' : 'checkin_proximo',
        titulo: `Check-in ${alerta.status.toLowerCase()}`,
        descricao: `${cliente?.nome_pagante} - ${reservaData.destino}`,
        prioridade: alerta.status === 'Hoje' ? 'alta' : 
                   alerta.status === 'Amanhã' ? 'media' : 'baixa',
        lido: false,
        data_criacao: now,
        dados_relacionados: { reserva_id: reservaData.id || Date.now().toString(), cliente_id: reservaData.cliente_pagante_id }
      }
      setAlertas(prev => [...prev, novoAlerta])
    }
    
    setShowDialog(false)
    setEditingItem(null)
  }

  const handleSaveConfig = (configData: Configuracao) => {
    setConfig(configData)
    setShowDialog(false)
  }

  // Calcular badges para o menu
  const calcularBadges = () => {
    const checkinsProximos = getProximosCheckIns(reservas, 7).length
    const clientesInativos = clientes.filter(c => !c.ativo).length
    
    return {
      reservas: checkinsProximos,
      crm: clientesInativos
    }
  }

  const badges = calcularBadges()

  // Componente de navegação
  const Navigation = () => {
    const modules = [
      { id: 'dashboard', name: 'Dashboard', icon: BarChart3 },
      { id: 'crm', name: 'CRM', icon: Users, badge: badges.crm },
      { id: 'reservas', name: 'Reservas', icon: Calendar, badge: badges.reservas },
      { id: 'documentos', name: 'Documentos', icon: FileText },
      { id: 'fornecedores', name: 'Fornecedores', icon: Building2 },
      { id: 'financeiro', name: 'Financeiro', icon: DollarSign },
      { id: 'relatorios', name: 'Relatórios', icon: FileBarChart },
      { id: 'clientes-viajando', name: 'Clientes Viajando', icon: Plane },
      { id: 'alertas', name: 'Alertas', icon: Bell, badge: alertas.filter(a => !a.lido).length },
      { id: 'configuracoes', name: 'Configurações', icon: Settings },
    ]

    return (
      <div className="bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 w-64 min-h-screen">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-xl font-bold" style={{ color: config.cores_marca.primaria }}>
            {config.nome_agencia}
          </h1>
        </div>
        <nav className="p-4">
          {modules.map((module) => {
            const Icon = module.icon
            return (
              <button
                key={module.id}
                onClick={() => setActiveModule(module.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg mb-2 transition-colors ${
                  activeModule === module.id
                    ? 'text-white'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
                style={{
                  backgroundColor: activeModule === module.id ? config.cores_marca.primaria : 'transparent'
                }}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{module.name}</span>
                </div>
                {module.badge && module.badge > 0 && (
                  <Badge className="bg-red-600 text-white text-xs">
                    {module.badge}
                  </Badge>
                )}
              </button>
            )
          })}
        </nav>
      </div>
    )
  }

  // Dashboard com KPIs e gráficos
  const Dashboard = () => {
    const [currentTime, setCurrentTime] = useState('')
    
    // Filtrar dados por período
    const dataLimite = new Date()
    dataLimite.setDate(dataLimite.getDate() - parseInt(periodoKPI))
    
    const reservasPeriodo = reservas.filter(r => new Date(r.data_compra) >= dataLimite)
    const clientesAtivos = clientes.filter(c => {
      const ultimaCompra = reservas
        .filter(r => r.cliente_pagante_id === c.id)
        .sort((a, b) => new Date(b.data_compra).getTime() - new Date(a.data_compra).getTime())[0]
      return ultimaCompra && new Date(ultimaCompra.data_compra) >= dataLimite
    })

    // KPIs
    const totalVendas = reservasPeriodo.length
    const valorVendido = reservasPeriodo.reduce((acc, r) => acc + r.valor_venda, 0)
    const comissaoTotal = reservasPeriodo.reduce((acc, r) => acc + (r.comissao_lancada_manual || r.comissao_calculada), 0)
    const ticketMedio = clientesAtivos.length > 0 ? valorVendido / clientesAtivos.length : 0

    // Check-ins próximos
    const hoje = new Date()
    const amanha = new Date(hoje)
    amanha.setDate(amanha.getDate() + 1)
    const seteDias = new Date(hoje)
    seteDias.setDate(seteDias.getDate() + 7)

    const checkinsHoje = reservas.filter(r => {
      const checkin = new Date(r.data_checkin)
      return checkin.toDateString() === hoje.toDateString()
    })

    const checkinsAmanha = reservas.filter(r => {
      const checkin = new Date(r.data_checkin)
      return checkin.toDateString() === amanha.toDateString()
    })

    const checkins7Dias = reservas.filter(r => {
      const checkin = new Date(r.data_checkin)
      return checkin >= hoje && checkin <= seteDias
    })

    // Ranking de destinos
    const destinosCount = reservasPeriodo.reduce((acc, r) => {
      acc[r.destino] = (acc[r.destino] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    const topDestinos = Object.entries(destinosCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)

    // Ranking de operadoras
    const operadorasCount = reservasPeriodo.reduce((acc, r) => {
      acc[r.operadora] = (acc[r.operadora] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    const topOperadoras = Object.entries(operadorasCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)

    // TOP 10 clientes por rentabilidade
    const clientesRentabilidade = clientes
      .map(c => ({
        ...c,
        rentabilidade: reservas
          .filter(r => r.cliente_pagante_id === c.id)
          .reduce((acc, r) => acc + (r.comissao_lancada_manual || r.comissao_calculada), 0)
      }))
      .sort((a, b) => b.rentabilidade - a.rentabilidade)
      .slice(0, 10)

    // Clientes inativos
    const clientesInativos = clientes.filter(c => !c.ativo)

    // Atualizar horário apenas no cliente
    useEffect(() => {
      if (!isClient) return
      
      setCurrentTime(new Date().toLocaleString('pt-BR'))
      const interval = setInterval(() => {
        setCurrentTime(new Date().toLocaleString('pt-BR'))
      }, 60000) // Atualiza a cada minuto
      
      return () => clearInterval(interval)
    }, [isClient])

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold">Dashboard</h2>
          <div className="flex items-center gap-4">
            <Select value={periodoKPI} onValueChange={setPeriodoKPI}>
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
            {currentTime && (
              <div className="text-sm text-gray-500">
                Atualizado: {currentTime}
              </div>
            )}
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vendas (qtd)</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalVendas}</div>
              <p className="text-xs text-muted-foreground">
                Últimos {periodoKPI} dias
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valor Vendido</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(valorVendido)}</div>
              <p className="text-xs text-muted-foreground">
                Últimos {periodoKPI} dias
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Comissão Total</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(comissaoTotal)}</div>
              <p className="text-xs text-muted-foreground">
                Calculada + Manual
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(ticketMedio)}</div>
              <p className="text-xs text-muted-foreground">
                Por cliente ativo
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Lista rápida de check-ins */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-red-600" />
                Check-ins Hoje ({checkinsHoje.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {checkinsHoje.slice(0, 3).map(reserva => {
                  const cliente = clientes.find(c => c.id === reserva.cliente_pagante_id)
                  return (
                    <div key={reserva.id} className="flex justify-between items-center p-2 bg-red-50 rounded">
                      <span className="text-sm font-medium">{cliente?.nome_pagante}</span>
                      <Badge className="bg-red-600 text-white">Hoje</Badge>
                    </div>
                  )
                })}
                {checkinsHoje.length === 0 && (
                  <p className="text-sm text-gray-500">Nenhum check-in hoje</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-500" />
                Check-ins Amanhã ({checkinsAmanha.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {checkinsAmanha.slice(0, 3).map(reserva => {
                  const cliente = clientes.find(c => c.id === reserva.cliente_pagante_id)
                  return (
                    <div key={reserva.id} className="flex justify-between items-center p-2 bg-orange-50 rounded">
                      <span className="text-sm font-medium">{cliente?.nome_pagante}</span>
                      <Badge className="bg-orange-500 text-white">Amanhã</Badge>
                    </div>
                  )
                })}
                {checkinsAmanha.length === 0 && (
                  <p className="text-sm text-gray-500">Nenhum check-in amanhã</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-green-600" />
                Próximos 7 dias ({checkins7Dias.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {checkins7Dias.slice(0, 3).map(reserva => {
                  const cliente = clientes.find(c => c.id === reserva.cliente_pagante_id)
                  const alerta = calcularAlertaCheckin(reserva.data_checkin)
                  return (
                    <div key={reserva.id} className="flex justify-between items-center p-2 bg-green-50 rounded">
                      <span className="text-sm font-medium">{cliente?.nome_pagante}</span>
                      <Badge className={`${alerta.cor} text-white`}>{alerta.status}</Badge>
                    </div>
                  )
                })}
                {checkins7Dias.length === 0 && (
                  <p className="text-sm text-gray-500">Nenhum check-in nos próximos 7 dias</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos e Rankings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Ranking de Destinos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Ranking de Destinos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topDestinos.map(([destino, count], index) => (
                  <div key={destino} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                           style={{ backgroundColor: config.cores_marca.primaria, color: 'white' }}>
                        {index + 1}
                      </div>
                      <span className="font-medium">{destino}</span>
                    </div>
                    <Badge variant="outline">{count} vendas</Badge>
                  </div>
                ))}
                {topDestinos.length === 0 && (
                  <p className="text-sm text-gray-500">Nenhum destino no período</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Ranking de Operadoras */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Ranking de Operadoras
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topOperadoras.map(([operadora, count], index) => (
                  <div key={operadora} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                           style={{ backgroundColor: config.cores_marca.secundaria, color: 'white' }}>
                        {index + 1}
                      </div>
                      <span className="font-medium">{operadora}</span>
                    </div>
                    <Badge variant="outline">{count} vendas</Badge>
                  </div>
                ))}
                {topOperadoras.length === 0 && (
                  <p className="text-sm text-gray-500">Nenhuma operadora no período</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* TOP 10 Clientes por Rentabilidade */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5" />
                TOP 10 Clientes por Rentabilidade
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {clientesRentabilidade.map((cliente, index) => (
                  <div key={cliente.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                           style={{ backgroundColor: index < 3 ? config.cores_marca.primaria : '#e5e7eb', 
                                   color: index < 3 ? 'white' : '#374151' }}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{cliente.nome_pagante}</p>
                        <Badge className={`${getFidelidadeColor(cliente.status_fidelidade)} text-white text-xs`}>
                          {cliente.status_fidelidade}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">{formatCurrency(cliente.rentabilidade)}</p>
                      <p className="text-xs text-gray-500">{cliente.historico_compras.num_reservas} reservas</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alertas */}
        {(checkinsHoje.length > 0 || checkinsAmanha.length > 0 || clientesInativos.length > 0) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                Alertas Importantes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {checkinsHoje.length > 0 && (
                  <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <Clock className="w-5 h-5 text-red-600" />
                    <div>
                      <p className="font-medium text-red-800">Check-ins hoje: {checkinsHoje.length}</p>
                      <p className="text-sm text-red-600">Confirme os detalhes das reservas</p>
                    </div>
                  </div>
                )}
                
                {checkinsAmanha.length > 0 && (
                  <div className="flex items-center gap-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <Clock className="w-5 h-5 text-orange-600" />
                    <div>
                      <p className="font-medium text-orange-800">Check-ins amanhã: {checkinsAmanha.length}</p>
                      <p className="text-sm text-orange-600">Prepare a documentação necessária</p>
                    </div>
                  </div>
                )}

                {clientesInativos.length > 0 && (
                  <div className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <Users className="w-5 h-5 text-yellow-600" />
                    <div>
                      <p className="font-medium text-yellow-800">Clientes inativos: {clientesInativos.length}</p>
                      <p className="text-sm text-yellow-600">Há mais de {config.dias_alerta_inatividade} dias sem compras</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  // CRM - Gestão de Clientes com filtros avançados
  const CRM = () => {
    const clientesFiltrados = clientes.filter(cliente => {
      const matchSearch = cliente.nome_pagante.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cliente.cpf.includes(searchTerm) ||
                         cliente.email.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchOrigem = !filtroOrigem || filtroOrigem === 'todas' || cliente.origem_cliente === filtroOrigem
      const matchFidelidade = !filtroFidelidade || filtroFidelidade === 'todas' || cliente.status_fidelidade === filtroFidelidade
      
      return matchSearch && matchOrigem && matchFidelidade
    }).sort((a, b) => b.historico_compras.valor_total - a.historico_compras.valor_total) // Ordenar por LTV

    const handleAddCliente = () => {
      setEditingItem(null)
      setDialogType('cliente')
      setShowDialog(true)
    }

    const handleEditCliente = (cliente: Cliente) => {
      setEditingItem(cliente)
      setDialogType('cliente')
      setShowDialog(true)
    }

    const handleCreateReserva = (cliente: Cliente) => {
      setEditingItem({ cliente_pagante_id: cliente.id })
      setDialogType('reserva')
      setShowDialog(true)
    }

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold">CRM - Gestão de Clientes</h2>
          <Button onClick={handleAddCliente} style={{ backgroundColor: config.cores_marca.primaria }}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Cliente
          </Button>
        </div>

        {/* Filtros e busca */}
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-64">
            <Input
              placeholder="Buscar por nome, CPF ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
          </div>
          <Select value={filtroOrigem} onValueChange={setFiltroOrigem}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrar por origem" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as origens</SelectItem>
              {config.origens_clientes.map(origem => (
                <SelectItem key={origem} value={origem}>{origem}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filtroFidelidade} onValueChange={setFiltroFidelidade}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrar por fidelidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as fidelidades</SelectItem>
              <SelectItem value="Bronze">Bronze</SelectItem>
              <SelectItem value="Prata">Prata</SelectItem>
              <SelectItem value="Ouro">Ouro</SelectItem>
              <SelectItem value="Diamante">Diamante</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Lista de clientes */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>CPF</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead>Fidelidade</TableHead>
                  <TableHead>LTV</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientesFiltrados.map((cliente) => (
                  <TableRow key={cliente.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{cliente.nome_pagante}</p>
                        <p className="text-sm text-gray-500">
                          {formatDate(cliente.data_nascimento)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{formatCPF(cliente.cpf)}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Phone className="w-3 h-3" />
                          <span className="text-sm">{formatPhone(cliente.telefone)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="w-3 h-3" />
                          <span className="text-sm">{cliente.email}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{cliente.origem_cliente}</TableCell>
                    <TableCell>
                      <Badge className={`${getFidelidadeColor(cliente.status_fidelidade)} text-white`}>
                        {cliente.status_fidelidade}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{formatCurrency(cliente.historico_compras.valor_total)}</p>
                        <p className="text-sm text-gray-500">{cliente.historico_compras.num_reservas} reservas</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={cliente.ativo ? "default" : "destructive"}>
                        {cliente.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEditCliente(cliente)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleEditCliente(cliente)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleCreateReserva(cliente)}>
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Gestão de Reservas com dois fluxos
  const Reservas = () => {
    const reservasFiltradas = reservas.filter(reserva => {
      const cliente = clientes.find(c => c.id === reserva.cliente_pagante_id)
      return cliente?.nome_pagante.toLowerCase().includes(searchTerm.toLowerCase()) ||
             reserva.codigo_reserva.toLowerCase().includes(searchTerm.toLowerCase()) ||
             reserva.destino.toLowerCase().includes(searchTerm.toLowerCase())
    })

    const handleAddReservaAutomatica = () => {
      setEditingItem(null)
      setDialogType('reserva')
      setShowDialog(true)
    }

    const handleAddReservaManual = () => {
      setEditingItem(null)
      setDialogType('reserva-manual')
      setShowDialog(true)
    }

    const handleEditReserva = (reserva: Reserva) => {
      setEditingItem(reserva)
      setDialogType(reserva.comissao_lancada_manual ? 'reserva-manual' : 'reserva')
      setShowDialog(true)
    }

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold">Gestão de Reservas</h2>
          <div className="flex gap-2">
            <Button onClick={handleAddReservaAutomatica} style={{ backgroundColor: config.cores_marca.primaria }}>
              <Plus className="w-4 h-4 mr-2" />
              Gestão de Reservas
            </Button>
            <Button onClick={handleAddReservaManual} variant="outline" 
                    style={{ borderColor: config.cores_marca.secundaria, color: config.cores_marca.secundaria }}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Reserva
            </Button>
          </div>
        </div>

        {/* Filtros e busca */}
        <div className="flex gap-4">
          <div className="flex-1">
            <Input
              placeholder="Buscar por cliente, código ou destino..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
          </div>
        </div>

        {/* Lista de reservas */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Serviço</TableHead>
                  <TableHead>Destino</TableHead>
                  <TableHead>Check-in</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Comissão</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reservasFiltradas.map((reserva) => {
                  const cliente = clientes.find(c => c.id === reserva.cliente_pagante_id)
                  const alerta = calcularAlertaCheckin(reserva.data_checkin)
                  
                  return (
                    <TableRow key={reserva.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{cliente?.nome_pagante}</p>
                          <p className="text-sm text-gray-500">
                            {reserva.acompanhantes.length > 0 && `+${reserva.acompanhantes.length} acompanhantes`}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono">{reserva.codigo_reserva}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {reserva.servico === 'Aéreo' || reserva.servico === 'Pacote' ? 
                            <Plane className="w-4 h-4" /> : 
                            <Hotel className="w-4 h-4" />
                          }
                          <span>{reserva.servico}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span>{reserva.destino}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <p>{formatDate(reserva.data_checkin)}</p>
                          {alerta.status && (
                            <Badge className={`${alerta.cor} text-white text-xs`}>
                              {alerta.status}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{formatCurrency(reserva.valor_venda)}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {formatCurrency(reserva.comissao_lancada_manual || reserva.comissao_calculada)}
                          </p>
                          <p className="text-sm text-gray-500">
                            {reserva.comissao_lancada_manual ? 'Manual' : `${reserva.percentual_comissao}%`}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={alerta.status === 'Hoje' || alerta.status === 'Amanhã' ? "destructive" : 
                                      alerta.status === 'Vermelho' ? "secondary" : "default"}>
                          {alerta.status || 'Confirmada'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleEditReserva(reserva)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Central de Alertas
  const Alertas = () => {
    const marcarComoLido = (alertaId: string) => {
      setAlertas(prev => prev.map(a => 
        a.id === alertaId ? { ...a, lido: true } : a
      ))
    }

    const marcarTodosComoLidos = () => {
      setAlertas(prev => prev.map(a => ({ ...a, lido: true })))
    }

    const alertasNaoLidos = alertas.filter(a => !a.lido)
    const alertasLidos = alertas.filter(a => a.lido)

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold">Central de Alertas</h2>
          <Button onClick={marcarTodosComoLidos} variant="outline">
            Marcar todos como lidos
          </Button>
        </div>

        {/* Alertas não lidos */}
        {alertasNaoLidos.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-red-600" />
                Alertas Não Lidos ({alertasNaoLidos.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {alertasNaoLidos.map(alerta => (
                  <div key={alerta.id} className="flex items-center justify-between p-4 border border-red-200 bg-red-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        alerta.prioridade === 'alta' ? 'bg-red-600' :
                        alerta.prioridade === 'media' ? 'bg-yellow-600' :
                        'bg-blue-600'
                      }`} />
                      <div>
                        <p className="font-medium">{alerta.titulo}</p>
                        <p className="text-sm text-gray-600">{alerta.descricao}</p>
                        <p className="text-xs text-gray-500">{formatDate(alerta.data_criacao)}</p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => marcarComoLido(alerta.id)}>
                      Marcar como lido
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Alertas lidos */}
        {alertasLidos.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Alertas Lidos ({alertasLidos.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {alertasLidos.slice(0, 10).map(alerta => (
                  <div key={alerta.id} className="flex items-center gap-3 p-3 border rounded-lg opacity-60">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <div>
                      <p className="font-medium">{alerta.titulo}</p>
                      <p className="text-sm text-gray-600">{alerta.descricao}</p>
                    </div>
                  </div>
                ))}
                {alertasLidos.length > 10 && (
                  <p className="text-center text-gray-500 py-2">
                    E mais {alertasLidos.length - 10} alertas lidos...
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {alertas.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <Bell className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">Nenhum alerta disponível</p>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  // Módulos em desenvolvimento
  const Documentos = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Gestão de Documentos</h2>
        <Button style={{ backgroundColor: config.cores_marca.primaria }}>
          <FileUp className="w-4 h-4 mr-2" />
          Anexar Documento
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Cliente</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clientes.map(cliente => (
                    <SelectItem key={cliente.id} value={cliente.id}>
                      {cliente.nome_pagante}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Operadora</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar operadora" />
                </SelectTrigger>
                <SelectContent>
                  {config.operadoras_default.map(op => (
                    <SelectItem key={op} value={op}>{op}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tipo</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo de documento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="voucher">Voucher</SelectItem>
                  <SelectItem value="passagem">Passagem</SelectItem>
                  <SelectItem value="seguro">Seguro</SelectItem>
                  <SelectItem value="contrato">Contrato</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Documentos Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Simular alguns documentos baseados nas reservas com anexos */}
              {reservas.filter(r => r.anexos && r.anexos.length > 0).slice(0, 5).map(reserva => {
                const cliente = clientes.find(c => c.id === reserva.cliente_pagante_id)
                return (
                  <div key={reserva.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="font-medium">{reserva.anexos![0]}</p>
                        <p className="text-sm text-gray-500">{cliente?.nome_pagante} - {reserva.destino}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}
              
              {reservas.filter(r => r.anexos && r.anexos.length > 0).length === 0 && (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">Nenhum documento encontrado</p>
                  <p className="text-sm text-gray-400">Anexe documentos às reservas para vê-los aqui</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  const Fornecedores = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Gestão de Fornecedores</h2>
        <Button style={{ backgroundColor: config.cores_marca.primaria }}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Fornecedor
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {fornecedoresSeed.map((fornecedor) => (
          <Card key={fornecedor.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                {fornecedor.nome}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-gray-500">{fornecedor.tipo}</p>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-sm">{fornecedor.telefone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-sm">{fornecedor.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-sm">{fornecedor.contato_comercial}</span>
                </div>
                <div className="pt-2 flex justify-between items-center">
                  <Badge variant={fornecedor.ativo ? "default" : "destructive"}>
                    {fornecedor.ativo ? 'Ativo' : 'Inativo'}
                  </Badge>
                  {fornecedor.percentual_comissao_padrao && (
                    <Badge variant="outline">
                      {fornecedor.percentual_comissao_padrao}% comissão
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )

  // Configurações
  const Configuracoes = () => {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold">Configurações</h2>
          <Button onClick={() => { setDialogType('config'); setShowDialog(true) }} 
                  style={{ backgroundColor: config.cores_marca.primaria }}>
            <Edit className="w-4 h-4 mr-2" />
            Editar Configurações
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações da Agência</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Nome da Agência</Label>
                <p className="text-lg font-medium">{config.nome_agencia}</p>
              </div>
              <div>
                <Label>Percentual de Comissão Padrão</Label>
                <p className="text-lg font-medium">{config.percentual_comissao_padrao}%</p>
              </div>
              <div>
                <Label>Dias para Alerta de Inatividade</Label>
                <p className="text-lg font-medium">{config.dias_alerta_inatividade} dias</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Metas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Meta de Valor Mensal</Label>
                <p className="text-lg font-medium">{formatCurrency(config.metas_valor || 0)}</p>
              </div>
              <div>
                <Label>Meta de Comissão Mensal</Label>
                <p className="text-lg font-medium">{formatCurrency(config.metas_comissao || 0)}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cores da Marca</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg border" 
                     style={{ backgroundColor: config.cores_marca.primaria }}></div>
                <div>
                  <Label>Cor Primária</Label>
                  <p className="font-mono">{config.cores_marca.primaria}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg border" 
                     style={{ backgroundColor: config.cores_marca.secundaria }}></div>
                <div>
                  <Label>Cor Secundária</Label>
                  <p className="font-mono">{config.cores_marca.secundaria}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Origens de Clientes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {config.origens_clientes.map((origem, index) => (
                  <Badge key={index} variant="outline">{origem}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Operadoras Padrão</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {config.operadoras_default.map((operadora, index) => (
                  <Badge key={index} variant="outline">{operadora}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Serviços Disponíveis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {config.servicos_default.map((servico, index) => (
                  <Badge key={index} variant="outline">{servico}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Renderizar conteúdo baseado no módulo ativo
  const renderContent = () => {
    switch (activeModule) {
      case 'dashboard':
        return <Dashboard />
      case 'crm':
        return <CRM />
      case 'reservas':
        return <Reservas />
      case 'documentos':
        return <Documentos />
      case 'fornecedores':
        return <Fornecedores />
      case 'financeiro':
        return <FinanceiroPage clientes={clientes} reservas={reservas} config={config} />
      case 'relatorios':
        return <RelatoriosPage clientes={clientes} reservas={reservas} config={config} />
      case 'clientes-viajando':
        return <ClientesViajandoPage clientes={clientes} reservas={reservas} config={config} />
      case 'alertas':
        return <Alertas />
      case 'configuracoes':
        return <Configuracoes />
      default:
        return <Dashboard />
    }
  }

  // Renderizar formulário no dialog
  const renderDialogContent = () => {
    switch (dialogType) {
      case 'cliente':
        return (
          <ClienteForm
            cliente={editingItem}
            origens={config.origens_clientes}
            onSave={handleSaveCliente}
            onCancel={() => setShowDialog(false)}
          />
        )
      case 'reserva':
        return (
          <ReservaForm
            reserva={editingItem}
            clientes={clientes}
            operadoras={config.operadoras_default}
            servicos={config.servicos_default}
            percentualComissaoPadrao={config.percentual_comissao_padrao}
            onSave={handleSaveReserva}
            onCancel={() => setShowDialog(false)}
            isNovaReserva={false}
          />
        )
      case 'reserva-manual':
        return (
          <ReservaForm
            reserva={editingItem}
            clientes={clientes}
            operadoras={config.operadoras_default}
            servicos={config.servicos_default}
            percentualComissaoPadrao={config.percentual_comissao_padrao}
            onSave={handleSaveReserva}
            onCancel={() => setShowDialog(false)}
            isNovaReserva={true}
          />
        )
      case 'config':
        return (
          <ConfigForm
            config={config}
            onSave={handleSaveConfig}
            onCancel={() => setShowDialog(false)}
          />
        )
      default:
        return null
    }
  }

  // Não renderizar até hidratação completa
  if (!isClient) {
    return (
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 w-64 min-h-screen">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h1 className="text-xl font-bold">Carregando...</h1>
          </div>
        </div>
        <main className="flex-1 p-8">
          <div className="text-center py-8">
            <p className="text-gray-500">Carregando aplicação...</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      <main className="flex-1 p-8">
        {renderContent()}
      </main>

      {/* Dialog para formulários */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {dialogType === 'cliente' && (editingItem ? 'Editar Cliente' : 'Novo Cliente')}
              {dialogType === 'reserva' && (editingItem ? 'Editar Reserva' : 'Gestão de Reservas')}
              {dialogType === 'reserva-manual' && (editingItem ? 'Editar Reserva Manual' : 'Nova Reserva')}
              {dialogType === 'config' && 'Configurações da Agência'}
            </DialogTitle>
          </DialogHeader>
          
          {renderDialogContent()}
        </DialogContent>
      </Dialog>
    </div>
  )
}