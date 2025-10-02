"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Plus, 
  Minus, 
  Calendar,
  User,
  MapPin,
  Building2,
  CreditCard,
  DollarSign,
  Percent,
  FileText,
  Plane,
  Hotel
} from 'lucide-react'
import { Cliente, Reserva } from '@/lib/types'
import { formatCurrency, calcularComissao, validarCPF } from '@/lib/utils-agencia'

interface ReservaFormProps {
  reserva?: Reserva | null
  clientes: Cliente[]
  operadoras: string[]
  servicos: string[]
  percentualComissaoPadrao: number
  onSave: (reserva: Omit<Reserva, 'id' | 'created_at' | 'updated_at'>) => void
  onCancel: () => void
  isNovaReserva: boolean
}

export default function ReservaForm({
  reserva,
  clientes,
  operadoras,
  servicos,
  percentualComissaoPadrao,
  onSave,
  onCancel,
  isNovaReserva
}: ReservaFormProps) {
  // Estados do formulário
  const [clientePaganteId, setClientePaganteId] = useState(reserva?.cliente_pagante_id || '')
  const [acompanhantes, setAcompanhantes] = useState<string[]>(reserva?.acompanhantes || [])
  const [dataCompra, setDataCompra] = useState(reserva?.data_compra || new Date().toISOString().split('T')[0])
  const [operadora, setOperadora] = useState(reserva?.operadora || '')
  const [codigoReserva, setCodigoReserva] = useState(reserva?.codigo_reserva || '')
  const [servico, setServico] = useState(reserva?.servico || '')
  const [dataCheckin, setDataCheckin] = useState(reserva?.data_checkin || '')
  const [dataCheckout, setDataCheckout] = useState(reserva?.data_checkout || '')
  const [companhiaAerea, setCompanhiaAerea] = useState(reserva?.companhia_aerea || '')
  const [codigoAereo, setCodigoAereo] = useState(reserva?.codigo_aereo || '')
  const [destino, setDestino] = useState(reserva?.destino || '')
  const [hotel, setHotel] = useState(reserva?.hotel || '')
  const [formaPagamento, setFormaPagamento] = useState(reserva?.forma_pagamento || '')
  const [valorVenda, setValorVenda] = useState(reserva?.valor_venda?.toString() || '')
  const [percentualComissao, setPercentualComissao] = useState(
    reserva?.percentual_comissao?.toString() || percentualComissaoPadrao.toString()
  )
  const [comissaoManual, setComissaoManual] = useState(reserva?.comissao_lancada_manual?.toString() || '')
  const [observacoes, setObservacoes] = useState(reserva?.observacoes || '')
  const [status, setStatus] = useState<'Confirmada' | 'Cancelada' | 'Pendente' | 'Finalizada'>(
    reserva?.status || 'Confirmada'
  )
  const [referenciaExterna, setReferenciaExterna] = useState(reserva?.referencia_externa || '')
  const [anexos, setAnexos] = useState<string[]>(reserva?.anexos || [])

  // Estados para novo acompanhante
  const [novoAcompanhante, setNovoAcompanhante] = useState('')
  
  // Estados para anexos
  const [novoAnexo, setNovoAnexo] = useState('')

  // Calcular comissão automaticamente
  const valorVendaNum = parseFloat(valorVenda) || 0
  const percentualComissaoNum = parseFloat(percentualComissao) || 0
  const comissaoCalculada = calcularComissao(valorVendaNum, percentualComissaoNum)
  const comissaoFinal = isNovaReserva && comissaoManual 
    ? parseFloat(comissaoManual) || 0 
    : comissaoCalculada

  // Filtrar dados válidos
  const clientesValidos = clientes.filter(c => c.nome_pagante && c.nome_pagante.trim() && c.cpf && c.cpf.trim())
  const operadorasValidas = operadoras.filter(op => op && op.trim())
  const servicosValidos = servicos.filter(s => s && s.trim())

  // Validações
  const clienteValido = clientePaganteId !== ''
  const operadoraValida = operadora !== ''
  const codigoValido = codigoReserva.trim() !== ''
  const servicoValido = servico !== ''
  const destinoValido = destino.trim() !== ''
  const dataCheckinValida = dataCheckin !== ''
  const valorValido = valorVendaNum > 0
  const formaPagamentoValida = formaPagamento !== ''

  const formularioValido = clienteValido && operadoraValida && codigoValido && 
                          servicoValido && destinoValido && dataCheckinValida && 
                          valorValido && formaPagamentoValida

  // Funções para acompanhantes
  const adicionarAcompanhante = () => {
    if (novoAcompanhante.trim() && !acompanhantes.includes(novoAcompanhante.trim())) {
      setAcompanhantes([...acompanhantes, novoAcompanhante.trim()])
      setNovoAcompanhante('')
    }
  }

  const removerAcompanhante = (index: number) => {
    setAcompanhantes(acompanhantes.filter((_, i) => i !== index))
  }

  // Funções para anexos
  const adicionarAnexo = () => {
    if (novoAnexo.trim() && !anexos.includes(novoAnexo.trim())) {
      setAnexos([...anexos, novoAnexo.trim()])
      setNovoAnexo('')
    }
  }

  const removerAnexo = (index: number) => {
    setAnexos(anexos.filter((_, i) => i !== index))
  }



  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      const fileNames = Array.from(files).map(file => file.name)
      const novosAnexos = fileNames.filter(name => !anexos.includes(name))
      if (novosAnexos.length > 0) {
        setAnexos([...anexos, ...novosAnexos])
      }
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formularioValido) return

    const reservaData: Omit<Reserva, 'id' | 'created_at' | 'updated_at'> = {
      cliente_pagante_id: clientePaganteId,
      acompanhantes,
      data_compra: dataCompra,
      operadora,
      codigo_reserva: codigoReserva,
      servico,
      data_checkin: dataCheckin,
      data_checkout: dataCheckout || undefined,
      companhia_aerea: companhiaAerea || undefined,
      codigo_aereo: codigoAereo || undefined,
      destino,
      hotel: hotel || undefined,
      forma_pagamento: formaPagamento,
      valor_venda: valorVendaNum,
      percentual_comissao: isNovaReserva && comissaoManual ? 0 : percentualComissaoNum,
      comissao_calculada: isNovaReserva && comissaoManual ? 0 : comissaoCalculada,
      comissao_lancada_manual: isNovaReserva && comissaoManual ? parseFloat(comissaoManual) : undefined,
      observacoes,
      status,
      referencia_externa: referenciaExterna || undefined,
      anexos: anexos.length > 0 ? anexos : undefined
    }

    onSave(reservaData)
  }

  const clienteSelecionado = clientesValidos.find(c => c.id === clientePaganteId)

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs defaultValue="basico" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basico">Dados Básicos</TabsTrigger>
          <TabsTrigger value="viagem">Detalhes da Viagem</TabsTrigger>
          <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
          <TabsTrigger value="extras">Extras</TabsTrigger>
        </TabsList>

        {/* Aba: Dados Básicos */}
        <TabsContent value="basico" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Cliente e Acompanhantes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Cliente Pagante */}
              <div>
                <Label htmlFor="cliente">Cliente Pagante *</Label>
                <Select value={clientePaganteId} onValueChange={setClientePaganteId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o cliente pagante" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientesValidos.map(cliente => (
                      <SelectItem key={cliente.id} value={cliente.id}>
                        {cliente.nome_pagante} - {cliente.cpf}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {clienteSelecionado && (
                  <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                    <p><strong>Email:</strong> {clienteSelecionado.email}</p>
                    <p><strong>Telefone:</strong> {clienteSelecionado.telefone}</p>
                    <Badge className="mt-1">{clienteSelecionado.status_fidelidade}</Badge>
                  </div>
                )}
              </div>

              {/* Acompanhantes */}
              <div>
                <Label>Acompanhantes</Label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Nome do acompanhante"
                      value={novoAcompanhante}
                      onChange={(e) => setNovoAcompanhante(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), adicionarAcompanhante())}
                    />
                    <Button type="button" onClick={adicionarAcompanhante} variant="outline">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  {acompanhantes.length > 0 && (
                    <div className="space-y-1">
                      {acompanhantes.map((acompanhante, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span>{acompanhante}</span>
                          <Button 
                            type="button" 
                            onClick={() => removerAcompanhante(index)}
                            variant="ghost" 
                            size="sm"
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Informações da Reserva
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="data-compra">Data da Compra *</Label>
                <Input
                  id="data-compra"
                  type="date"
                  value={dataCompra}
                  onChange={(e) => setDataCompra(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="operadora">Operadora *</Label>
                <Select value={operadora} onValueChange={setOperadora}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a operadora" />
                  </SelectTrigger>
                  <SelectContent>
                    {operadorasValidas.map(op => (
                      <SelectItem key={op} value={op}>{op}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="codigo-reserva">Código da Reserva *</Label>
                <Input
                  id="codigo-reserva"
                  value={codigoReserva}
                  onChange={(e) => setCodigoReserva(e.target.value)}
                  placeholder="Ex: CVC123456"
                  required
                />
              </div>

              <div>
                <Label htmlFor="servico">Tipo de Serviço *</Label>
                <Select value={servico} onValueChange={setServico}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o serviço" />
                  </SelectTrigger>
                  <SelectContent>
                    {servicosValidos.map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={(value: 'Confirmada' | 'Cancelada' | 'Pendente' | 'Finalizada') => setStatus(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Confirmada">Confirmada</SelectItem>
                    <SelectItem value="Pendente">Pendente</SelectItem>
                    <SelectItem value="Cancelada">Cancelada</SelectItem>
                    <SelectItem value="Finalizada">Finalizada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="referencia-externa">Referência Externa</Label>
                <Input
                  id="referencia-externa"
                  value={referenciaExterna}
                  onChange={(e) => setReferenciaExterna(e.target.value)}
                  placeholder="ID externo ou referência"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba: Detalhes da Viagem */}
        <TabsContent value="viagem" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Destino e Datas
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="destino">Destino *</Label>
                <Input
                  id="destino"
                  value={destino}
                  onChange={(e) => setDestino(e.target.value)}
                  placeholder="Ex: Paris, França"
                  required
                />
              </div>

              <div>
                <Label htmlFor="data-checkin">Data Check-in *</Label>
                <Input
                  id="data-checkin"
                  type="date"
                  value={dataCheckin}
                  onChange={(e) => setDataCheckin(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="data-checkout">Data Check-out</Label>
                <Input
                  id="data-checkout"
                  type="date"
                  value={dataCheckout}
                  onChange={(e) => setDataCheckout(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Detalhes específicos por tipo de serviço */}
          {(servico === 'Aéreo' || servico === 'Pacote') && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plane className="w-5 h-5" />
                  Informações Aéreas
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="companhia-aerea">Companhia Aérea</Label>
                  <Input
                    id="companhia-aerea"
                    value={companhiaAerea}
                    onChange={(e) => setCompanhiaAerea(e.target.value)}
                    placeholder="Ex: LATAM, GOL, Azul"
                  />
                </div>

                <div>
                  <Label htmlFor="codigo-aereo">Código do Voo</Label>
                  <Input
                    id="codigo-aereo"
                    value={codigoAereo}
                    onChange={(e) => setCodigoAereo(e.target.value)}
                    placeholder="Ex: LA3456, G31234"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {(servico === 'Hotel' || servico === 'Pacote') && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Hotel className="w-5 h-5" />
                  Informações de Hospedagem
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <Label htmlFor="hotel">Hotel/Pousada</Label>
                  <Input
                    id="hotel"
                    value={hotel}
                    onChange={(e) => setHotel(e.target.value)}
                    placeholder="Nome do hotel ou pousada"
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Aba: Financeiro */}
        <TabsContent value="financeiro" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Forma de Pagamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="forma-pagamento">Forma de Pagamento *</Label>
                <Select value={formaPagamento} onValueChange={setFormaPagamento}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a forma de pagamento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cartao">Cartão de Crédito</SelectItem>
                    <SelectItem value="boleto">Boleto</SelectItem>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="pix_cartao">PIX + Cartão</SelectItem>
                    <SelectItem value="dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="transferencia">Transferência</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Valores e Comissão
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="valor-venda">Valor da Venda *</Label>
                <Input
                  id="valor-venda"
                  type="number"
                  step="0.01"
                  min="0"
                  value={valorVenda}
                  onChange={(e) => setValorVenda(e.target.value)}
                  placeholder="0,00"
                  required
                />
              </div>

              {!isNovaReserva ? (
                // Fluxo automático - comissão calculada
                <div>
                  <Label htmlFor="percentual-comissao">Percentual de Comissão (%)</Label>
                  <Input
                    id="percentual-comissao"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={percentualComissao}
                    onChange={(e) => setPercentualComissao(e.target.value)}
                  />
                  <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded">
                    <p className="text-sm text-green-800">
                      <strong>Comissão Calculada:</strong> {formatCurrency(comissaoCalculada)}
                    </p>
                  </div>
                </div>
              ) : (
                // Fluxo manual - comissão lançada manualmente
                <div>
                  <Label htmlFor="comissao-manual">Comissão Manual</Label>
                  <Input
                    id="comissao-manual"
                    type="number"
                    step="0.01"
                    min="0"
                    value={comissaoManual}
                    onChange={(e) => setComissaoManual(e.target.value)}
                    placeholder="0,00"
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    Deixe vazio para usar cálculo automático ({percentualComissaoPadrao}%)
                  </p>
                  {comissaoManual && (
                    <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded">
                      <p className="text-sm text-blue-800">
                        <strong>Comissão Manual:</strong> {formatCurrency(parseFloat(comissaoManual) || 0)}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Resumo financeiro */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">Resumo Financeiro</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Valor da Venda:</span>
                    <span className="font-medium">{formatCurrency(valorVendaNum)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Comissão:</span>
                    <span className="font-medium text-green-600">{formatCurrency(comissaoFinal)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-1">
                    <span>Percentual:</span>
                    <span className="font-medium">
                      {valorVendaNum > 0 ? ((comissaoFinal / valorVendaNum) * 100).toFixed(2) : 0}%
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba: Extras */}
        <TabsContent value="extras" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Observações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Informações adicionais sobre a reserva..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Documentos Anexados
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Upload de arquivos */}
              <div>
                <Label htmlFor="file-upload">Anexar Documentos</Label>
                <Input
                  id="file-upload"
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={handleFileUpload}
                  className="cursor-pointer"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Formatos aceitos: PDF, DOC, DOCX, JPG, PNG
                </p>
              </div>

              {/* Adicionar anexo manualmente */}
              <div>
                <Label>Ou adicionar nome do documento manualmente</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Nome do documento (ex: Voucher Hotel.pdf)"
                    value={novoAnexo}
                    onChange={(e) => setNovoAnexo(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), adicionarAnexo())}
                  />
                  <Button type="button" onClick={adicionarAnexo} variant="outline">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Lista de anexos */}
              {anexos.length > 0 && (
                <div>
                  <Label>Documentos Anexados ({anexos.length})</Label>
                  <div className="space-y-2 mt-2">
                    {anexos.map((anexo, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-blue-600" />
                          <span className="font-medium">{anexo}</span>
                        </div>
                        <Button 
                          type="button" 
                          onClick={() => removerAnexo(index)}
                          variant="ghost" 
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {anexos.length === 0 && (
                <div className="text-center py-6 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>Nenhum documento anexado</p>
                  <p className="text-sm">Use o campo acima para anexar documentos</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Botões de ação */}
      <div className="flex justify-end gap-4 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button 
          type="submit" 
          disabled={!formularioValido}
          className="bg-green-600 hover:bg-green-700"
        >
          {reserva ? 'Atualizar Reserva' : 'Salvar Reserva'}
        </Button>
      </div>
    </form>
  )
}