"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Plane, 
  MapPin, 
  Calendar,
  Users,
  FileText,
  Download,
  UserPlus,
  AlertTriangle,
  Clock
} from 'lucide-react'
import { Cliente, Reserva, Configuracao } from '@/lib/types'
import { 
  formatCurrency, 
  formatDate, 
  calcularAlertaCheckin,
  exportarCSV 
} from '@/lib/utils-agencia'

interface ClientesViajandoProps {
  clientes: Cliente[]
  reservas: Reserva[]
  config: Configuracao
}

interface ClienteViajando {
  cliente_id: string
  nome_cliente: string
  num_acompanhantes: number
  destino: string
  servico: string
  operadora: string
  data_checkin: string
  alerta: string
  cor_alerta: string
  tem_documentos: boolean
  reserva_id: string
}

export default function ClientesViajandoPage({ clientes, reservas, config }: ClientesViajandoProps) {
  const [filtroOperadora, setFiltroOperadora] = useState('')
  const [filtroServico, setFiltroServico] = useState('')
  const [filtroAlerta, setFiltroAlerta] = useState('')
  const [buscaTermo, setBuscaTermo] = useState('')
  const [clientesViajando, setClientesViajando] = useState<ClienteViajando[]>([])
  const [isClient, setIsClient] = useState(false)

  // Marcar como cliente após hidratação
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Calcular clientes viajando nos próximos 30 dias
  useEffect(() => {
    if (!isClient) return

    const hoje = new Date()
    const em30Dias = new Date()
    em30Dias.setDate(hoje.getDate() + 30)

    const reservasProximas = reservas.filter(reserva => {
      const dataCheckin = new Date(reserva.data_checkin)
      return dataCheckin >= hoje && dataCheckin <= em30Dias
    })

    const clientesData: ClienteViajando[] = reservasProximas.map(reserva => {
      const cliente = clientes.find(c => c.id === reserva.cliente_pagante_id)
      const alerta = calcularAlertaCheckin(reserva.data_checkin)
      
      return {
        cliente_id: reserva.cliente_pagante_id,
        nome_cliente: cliente?.nome_pagante || 'Cliente não encontrado',
        num_acompanhantes: reserva.acompanhantes.length,
        destino: reserva.destino,
        servico: reserva.servico,
        operadora: reserva.operadora,
        data_checkin: reserva.data_checkin,
        alerta: alerta.status,
        cor_alerta: alerta.cor,
        tem_documentos: (reserva.anexos && reserva.anexos.length > 0) || false,
        reserva_id: reserva.id
      }
    })

    setClientesViajando(clientesData)
  }, [clientes, reservas, isClient])

  // Filtrar dados
  const clientesFiltrados = clientesViajando.filter(cliente => {
    const matchBusca = cliente.nome_cliente.toLowerCase().includes(buscaTermo.toLowerCase()) ||
                      cliente.destino.toLowerCase().includes(buscaTermo.toLowerCase())
    
    const matchOperadora = !filtroOperadora || filtroOperadora === 'all' || cliente.operadora === filtroOperadora
    const matchServico = !filtroServico || filtroServico === 'all' || cliente.servico === filtroServico
    const matchAlerta = !filtroAlerta || filtroAlerta === 'all' || cliente.alerta === filtroAlerta
    
    return matchBusca && matchOperadora && matchServico && matchAlerta
  })

  // Obter listas únicas para filtros
  const operadorasUnicas = [...new Set(clientesViajando.map(c => c.operadora))].sort()
  const servicosUnicos = [...new Set(clientesViajando.map(c => c.servico))].sort()
  const alertasUnicos = [...new Set(clientesViajando.map(c => c.alerta).filter(a => a))].sort()

  // Função para exportar dados
  const handleExport = () => {
    const dadosExport = clientesFiltrados.map(cliente => ({
      'Cliente': cliente.nome_cliente,
      'Acompanhantes': cliente.num_acompanhantes,
      'Destino': cliente.destino,
      'Serviço': cliente.servico,
      'Operadora': cliente.operadora,
      'Check-in': formatDate(cliente.data_checkin),
      'Alerta': cliente.alerta,
      'Documentos': cliente.tem_documentos ? 'Sim' : 'Não'
    }))
    
    exportarCSV(dadosExport, 'clientes-viajando-30-dias')
  }

  // Função para criar follow-up (placeholder)
  const handleCriarFollowUp = (cliente: ClienteViajando) => {
    alert(`Follow-up criado para ${cliente.nome_cliente} - ${cliente.destino}`)
  }

  // Estatísticas rápidas
  const totalClientes = clientesFiltrados.length
  const clientesHoje = clientesFiltrados.filter(c => c.alerta === 'Hoje').length
  const clientesAmanha = clientesFiltrados.filter(c => c.alerta === 'Amanhã').length
  const clientesProximos = clientesFiltrados.filter(c => c.alerta === 'Vermelho').length
  const clientesComDocs = clientesFiltrados.filter(c => c.tem_documentos).length

  // Não renderizar até hidratação completa
  if (!isClient) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Clientes Viajando nos Próximos 30 Dias</h1>
            <p className="text-gray-600 mt-2">Carregando dados...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Clientes Viajando nos Próximos 30 Dias</h1>
          <p className="text-gray-600 mt-2">
            Acompanhe todos os clientes com check-ins programados para os próximos 30 dias
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExport} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Estatísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClientes}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4 text-red-600" />
              Hoje
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{clientesHoje}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-500" />
              Amanhã
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{clientesAmanha}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              Próximos 7 dias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{clientesProximos}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="w-4 h-4 text-green-600" />
              Com Documentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{clientesComDocs}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Input
                placeholder="Buscar cliente ou destino..."
                value={buscaTermo}
                onChange={(e) => setBuscaTermo(e.target.value)}
              />
            </div>
            
            <div>
              <Select value={filtroOperadora} onValueChange={setFiltroOperadora}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as operadoras" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas as operadoras</SelectItem>
                  {operadorasUnicas.map(operadora => (
                    <SelectItem key={operadora} value={operadora}>
                      {operadora}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Select value={filtroServico} onValueChange={setFiltroServico}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os serviços" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os serviços</SelectItem>
                  {servicosUnicos.map(servico => (
                    <SelectItem key={servico} value={servico}>
                      {servico}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Select value={filtroAlerta} onValueChange={setFiltroAlerta}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os alertas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os alertas</SelectItem>
                  {alertasUnicos.map(alerta => (
                    <SelectItem key={alerta} value={alerta}>
                      {alerta}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Button 
                variant="outline" 
                onClick={() => {
                  setBuscaTermo('')
                  setFiltroOperadora('')
                  setFiltroServico('')
                  setFiltroAlerta('')
                }}
                className="w-full"
              >
                Limpar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de clientes */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Clientes ({clientesFiltrados.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Acompanhantes</TableHead>
                <TableHead>Destino</TableHead>
                <TableHead>Serviço</TableHead>
                <TableHead>Operadora</TableHead>
                <TableHead>Check-in</TableHead>
                <TableHead>Alerta</TableHead>
                <TableHead>Docs</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientesFiltrados.map((cliente, index) => (
                <TableRow key={`${cliente.reserva_id}-${index}`}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">{cliente.nome_cliente}</span>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{cliente.num_acompanhantes}</span>
                      {cliente.num_acompanhantes > 0 && (
                        <Badge variant="outline" className="text-xs">
                          +{cliente.num_acompanhantes}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span>{cliente.destino}</span>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Plane className="w-4 h-4 text-gray-400" />
                      <span>{cliente.servico}</span>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <Badge variant="outline">{cliente.operadora}</Badge>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>{formatDate(cliente.data_checkin)}</span>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    {cliente.alerta && (
                      <Badge className={`${cliente.cor_alerta} text-white`}>
                        {cliente.alerta}
                      </Badge>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FileText 
                        className={`w-4 h-4 ${
                          cliente.tem_documentos ? 'text-green-600' : 'text-gray-300'
                        }`} 
                      />
                      <span className="text-sm">
                        {cliente.tem_documentos ? 'Sim' : 'Não'}
                      </span>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleCriarFollowUp(cliente)}
                    >
                      <UserPlus className="w-4 h-4 mr-1" />
                      Follow-up
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {clientesFiltrados.length === 0 && (
            <div className="text-center py-8">
              <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">Nenhum cliente encontrado com os filtros aplicados</p>
              <p className="text-sm text-gray-400 mt-2">
                Ajuste os filtros ou verifique se há reservas para os próximos 30 dias
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}