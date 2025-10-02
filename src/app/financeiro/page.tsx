"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  DollarSign, 
  TrendingUp, 
  Target, 
  Award,
  Calendar,
  BarChart3,
  PieChart,
  Settings,
  Plus,
  Edit,
  Save,
  Activity
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts'

// Dados mock para demonstração
const mockDadosFinanceiros = [
  { mes: 'Jan', receita: 15000, comissao: 1500, lucro: 1500 },
  { mes: 'Fev', receita: 18000, comissao: 1800, lucro: 1800 },
  { mes: 'Mar', receita: 22000, comissao: 2200, lucro: 2200 },
  { mes: 'Abr', receita: 19000, comissao: 1900, lucro: 1900 },
  { mes: 'Mai', receita: 25000, comissao: 2500, lucro: 2500 },
  { mes: 'Jun', receita: 28000, comissao: 2800, lucro: 2800 }
]

const mockMetas = {
  meta_valor_mensal: 30000,
  meta_comissao_mensal: 3000,
  meta_valor_anual: 360000,
  meta_comissao_anual: 36000
}

const mockResultadoAtual = {
  receita_mes: 28000,
  comissao_mes: 2800,
  receita_ano: 155000,
  comissao_ano: 15500
}

export default function FinanceiroPage() {
  const [periodo, setPeriodo] = useState('mensal')
  const [metas, setMetas] = useState(mockMetas)
  const [isEditandoMetas, setIsEditandoMetas] = useState(false)
  const [metasTemp, setMetasTemp] = useState(mockMetas)

  // Calcular progressos das metas
  const progressoValorMes = (mockResultadoAtual.receita_mes / metas.meta_valor_mensal) * 100
  const progressoComissaoMes = (mockResultadoAtual.comissao_mes / metas.meta_comissao_mensal) * 100
  const progressoValorAno = (mockResultadoAtual.receita_ano / metas.meta_valor_anual) * 100
  const progressoComissaoAno = (mockResultadoAtual.comissao_ano / metas.meta_comissao_anual) * 100

  const salvarMetas = () => {
    setMetas(metasTemp)
    setIsEditandoMetas(false)
    // Aqui você salvaria no backend
  }

  const cancelarEdicao = () => {
    setMetasTemp(metas)
    setIsEditandoMetas(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Financeiro</h1>
            <p className="text-gray-600">Controle financeiro e acompanhamento de metas</p>
          </div>
          <div className="flex gap-2">
            <Select value={periodo} onValueChange={setPeriodo}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mensal">Mensal</SelectItem>
                <SelectItem value="anual">Anual</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="metas">Metas</TabsTrigger>
            <TabsTrigger value="historico">Histórico</TabsTrigger>
          </TabsList>

          {/* Dashboard Financeiro */}
          <TabsContent value="dashboard">
            {/* KPIs Principais */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Receita Mensal</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">R$ {mockResultadoAtual.receita_mes.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    {progressoValorMes >= 100 ? (
                      <span className="text-green-600">Meta atingida! 🎉</span>
                    ) : (
                      <span>Faltam R$ {(metas.meta_valor_mensal - mockResultadoAtual.receita_mes).toLocaleString()}</span>
                    )}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Comissão Mensal</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">R$ {mockResultadoAtual.comissao_mes.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    {progressoComissaoMes >= 100 ? (
                      <span className="text-green-600">Meta atingida! 🎉</span>
                    ) : (
                      <span>Faltam R$ {(metas.meta_comissao_mensal - mockResultadoAtual.comissao_mes).toLocaleString()}</span>
                    )}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Receita Anual</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">R$ {mockResultadoAtual.receita_ano.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    {progressoValorAno.toFixed(1)}% da meta anual
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Comissão Anual</CardTitle>
                  <Award className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">R$ {mockResultadoAtual.comissao_ano.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    {progressoComissaoAno.toFixed(1)}% da meta anual
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Progresso das Metas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <Card>
                <CardHeader>
                  <CardTitle>Progresso Metas Mensais</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Receita</span>
                      <span>{progressoValorMes.toFixed(1)}%</span>
                    </div>
                    <Progress value={Math.min(progressoValorMes, 100)} className="h-2" />
                    <div className="text-xs text-muted-foreground mt-1">
                      R$ {mockResultadoAtual.receita_mes.toLocaleString()} / R$ {metas.meta_valor_mensal.toLocaleString()}
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Comissão</span>
                      <span>{progressoComissaoMes.toFixed(1)}%</span>
                    </div>
                    <Progress value={Math.min(progressoComissaoMes, 100)} className="h-2" />
                    <div className="text-xs text-muted-foreground mt-1">
                      R$ {mockResultadoAtual.comissao_mes.toLocaleString()} / R$ {metas.meta_comissao_mensal.toLocaleString()}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Progresso Metas Anuais</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Receita</span>
                      <span>{progressoValorAno.toFixed(1)}%</span>
                    </div>
                    <Progress value={Math.min(progressoValorAno, 100)} className="h-2" />
                    <div className="text-xs text-muted-foreground mt-1">
                      R$ {mockResultadoAtual.receita_ano.toLocaleString()} / R$ {metas.meta_valor_anual.toLocaleString()}
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Comissão</span>
                      <span>{progressoComissaoAno.toFixed(1)}%</span>
                    </div>
                    <Progress value={Math.min(progressoComissaoAno, 100)} className="h-2" />
                    <div className="text-xs text-muted-foreground mt-1">
                      R$ {mockResultadoAtual.comissao_ano.toLocaleString()} / R$ {metas.meta_comissao_anual.toLocaleString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Gráfico de Evolução */}
            <Card>
              <CardHeader>
                <CardTitle>Evolução Financeira</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={mockDadosFinanceiros}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mes" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="receita" stackId="1" stroke="#8884d8" fill="#8884d8" name="Receita" />
                    <Area type="monotone" dataKey="comissao" stackId="2" stroke="#82ca9d" fill="#82ca9d" name="Comissão" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Configuração de Metas */}
          <TabsContent value="metas">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Configuração de Metas</CardTitle>
                    <p className="text-sm text-muted-foreground">Defina suas metas mensais e anuais</p>
                  </div>
                  {!isEditandoMetas ? (
                    <Button onClick={() => setIsEditandoMetas(true)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Editar Metas
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button onClick={salvarMetas}>
                        <Save className="w-4 h-4 mr-2" />
                        Salvar
                      </Button>
                      <Button variant="outline" onClick={cancelarEdicao}>
                        Cancelar
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Metas Mensais</h3>
                    
                    <div>
                      <Label>Meta de Receita Mensal</Label>
                      <Input
                        type="number"
                        value={metasTemp.meta_valor_mensal}
                        onChange={(e) => setMetasTemp({...metasTemp, meta_valor_mensal: Number(e.target.value)})}
                        disabled={!isEditandoMetas}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label>Meta de Comissão Mensal</Label>
                      <Input
                        type="number"
                        value={metasTemp.meta_comissao_mensal}
                        onChange={(e) => setMetasTemp({...metasTemp, meta_comissao_mensal: Number(e.target.value)})}
                        disabled={!isEditandoMetas}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Metas Anuais</h3>
                    
                    <div>
                      <Label>Meta de Receita Anual</Label>
                      <Input
                        type="number"
                        value={metasTemp.meta_valor_anual}
                        onChange={(e) => setMetasTemp({...metasTemp, meta_valor_anual: Number(e.target.value)})}
                        disabled={!isEditandoMetas}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label>Meta de Comissão Anual</Label>
                      <Input
                        type="number"
                        value={metasTemp.meta_comissao_anual}
                        onChange={(e) => setMetasTemp({...metasTemp, meta_comissao_anual: Number(e.target.value)})}
                        disabled={!isEditandoMetas}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>

                {/* Preview das Metas */}
                <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold mb-4">Status Atual das Metas</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {progressoValorMes.toFixed(0)}%
                      </div>
                      <div className="text-sm text-muted-foreground">Receita Mensal</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {progressoComissaoMes.toFixed(0)}%
                      </div>
                      <div className="text-sm text-muted-foreground">Comissão Mensal</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {progressoValorAno.toFixed(0)}%
                      </div>
                      <div className="text-sm text-muted-foreground">Receita Anual</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {progressoComissaoAno.toFixed(0)}%
                      </div>
                      <div className="text-sm text-muted-foreground">Comissão Anual</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Histórico Financeiro */}
          <TabsContent value="historico">
            <Card>
              <CardHeader>
                <CardTitle>Histórico Financeiro Detalhado</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={mockDadosFinanceiros}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mes" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="receita" stroke="#8884d8" strokeWidth={2} name="Receita" />
                    <Line type="monotone" dataKey="comissao" stroke="#82ca9d" strokeWidth={2} name="Comissão" />
                    <Line type="monotone" dataKey="lucro" stroke="#ffc658" strokeWidth={2} name="Lucro Líquido" />
                  </LineChart>
                </ResponsiveContainer>

                <div className="mt-6">
                  <h4 className="font-semibold mb-4">Resumo por Período</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border border-gray-300 p-2 text-left">Mês</th>
                          <th className="border border-gray-300 p-2 text-right">Receita</th>
                          <th className="border border-gray-300 p-2 text-right">Comissão</th>
                          <th className="border border-gray-300 p-2 text-right">Lucro Líquido</th>
                          <th className="border border-gray-300 p-2 text-right">Margem (%)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mockDadosFinanceiros.map((item) => (
                          <tr key={item.mes}>
                            <td className="border border-gray-300 p-2">{item.mes}</td>
                            <td className="border border-gray-300 p-2 text-right">R$ {item.receita.toLocaleString()}</td>
                            <td className="border border-gray-300 p-2 text-right">R$ {item.comissao.toLocaleString()}</td>
                            <td className="border border-gray-300 p-2 text-right">R$ {item.lucro.toLocaleString()}</td>
                            <td className="border border-gray-300 p-2 text-right">{((item.comissao / item.receita) * 100).toFixed(1)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}